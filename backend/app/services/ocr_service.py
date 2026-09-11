import os
import uuid
import shutil
import tempfile
import logging
import threading

# PaddlePaddle 3.x crashes on CPU when the PIR executor builds oneDNN
# instructions:
#   NotImplementedError: ConvertPirAttribute2RuntimeAttribute not support
#   [pir::ArrayAttribute<pir::DoubleAttribute>] (onednn_instruction.cc)
#
# The actual fix is `enable_mkldnn=False` in the PaddleOCR constructor below
# (verified: with MKLDNN disabled OCR works; without it, it crashes).
# The env var below is NOT sufficient by itself on PaddlePaddle 3.x (PIR is
# mandatory there); it is kept only as a harmless compatibility shim for
# PaddlePaddle 2.x. It must be set BEFORE paddle/paddleocr is imported.
os.environ.setdefault("FLAGS_enable_pir_api", "0")

# Skip the network connectivity check on startup (models are cached
# locally after the first download).
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

import pymupdf as fitz
from PIL import Image
from docx import Document

from app.services.text_cleaner import clean_text

logger = logging.getLogger(__name__)


# ===========================================================
# LAZY PADDLE OCR SINGLETON
# ===========================================================
# PaddleOCR is heavy to initialize (~2-5s, downloads model weights
# on first run).  We defer it until the first OCR request so that
# `uvicorn --reload` and tests that never touch OCR start instantly.
# A threading lock makes the lazy init safe under concurrent requests.

_ocr_instance = None
_ocr_lock = threading.Lock()


def get_ocr():
    """Return the shared PaddleOCR instance, initializing on first call.

    Thread-safe: concurrent requests block on the lock until the
    singleton is created, then all subsequent calls return immediately.
    If initialization fails, an error is logged and None is returned;
    callers must handle a None return gracefully.
    """
    global _ocr_instance
    if _ocr_instance is not None:
        return _ocr_instance
    with _ocr_lock:
        # Double-check after acquiring the lock.
        if _ocr_instance is not None:
            return _ocr_instance
        try:
            from paddleocr import PaddleOCR

            logger.info("Initializing PaddleOCR (first OCR request)...")
            instance = PaddleOCR(
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                # Critical: MKLDNN/oneDNN triggers the PIR executor crash on
                # CPU in PaddlePaddle 3.x. Disabling it fixes PDF/Image OCR.
                enable_mkldnn=False,
                # Lightweight mobile models: ~4x faster than the default
                # PP-OCRv6 medium models on CPU with comparable accuracy.
                text_detection_model_name="PP-OCRv4_mobile_det",
                text_recognition_model_name="en_PP-OCRv4_mobile_rec",
            )
            logger.info("PaddleOCR initialized successfully")
            _ocr_instance = instance
            return _ocr_instance
        except Exception:
            logger.exception("Failed to initialize PaddleOCR")
            return None


# ===========================================================
# SUPPORTED FILE TYPES
# ===========================================================

IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".tiff",
    ".tif",
    ".webp"
}

PDF_EXTENSION = ".pdf"

DOCX_EXTENSION = ".docx"

TXT_EXTENSION = ".txt"


# ===========================================================
# OCR TUNING
# ===========================================================

# Pages whose embedded text layer has at least this many characters
# are treated as "digital" PDFs and read directly with PyMuPDF,
# which is orders of magnitude faster than running OCR.
MIN_TEXT_CHARS = 15

# Render resolution used ONLY for pages that genuinely need OCR.
# 200 DPI is plenty for PaddleOCR (it downscales images internally);
# 300 DPI only makes page rendering and inference slower.
OCR_PAGE_DPI = 200

# Maximum number of pages/images sent to PaddleOCR in a single
# batch call. Batching reduces per-image overhead.
OCR_BATCH_SIZE = 4

# Hard cap on how many pages are OCR'd for a single PDF. At ~25s/page
# on CPU this bounds worst-case extraction time; pages beyond the cap
# are skipped with a warning instead of blocking the request.
MAX_OCR_PAGES = 8


# ===========================================================
# SAVE PDF PAGE AS IMAGE
# ===========================================================

def pdf_page_to_image(page, dpi=OCR_PAGE_DPI):

    temp_directory = tempfile.gettempdir()

    image_name = f"{uuid.uuid4()}.png"

    image_path = os.path.join(
        temp_directory,
        image_name
    )

    pix = page.get_pixmap(
        dpi=dpi
    )

    pix.save(
        image_path
    )

    return image_path


# ===========================================================
# DELETE TEMP IMAGE
# ===========================================================

def delete_temp_image(image_path):

    try:

        if os.path.exists(image_path):

            os.remove(image_path)

    except Exception:

        pass


# ===========================================================
# OCR SINGLE IMAGE / BATCH
# ===========================================================

def run_paddle_ocr(image_paths):
    """
    Run OCR on one image path or a list of image paths.

    Returns a string when given a single path, and a list of strings
    (one per path) when given a list. A failed image yields "".
    """

    single = isinstance(image_paths, str)

    paths = [image_paths] if single else list(image_paths)

    if not paths:

        return "" if single else []

    # Lazily obtain the shared PaddleOCR instance.
    ocr_engine = get_ocr()
    if ocr_engine is None:
        logger.error("PaddleOCR unavailable — OCR request cannot be fulfilled")
        return "" if single else [""] * len(paths)

    results = []

    # OCR the whole batch in one predict() call; if that fails
    # (e.g. one corrupt image), fall back to per-image predict so a
    # single bad page never discards the rest of the batch.
    try:

        ocr_output = ocr_engine.predict(paths)

    except Exception as e:

        logger.warning("PaddleOCR batch error: %s", e)

        ocr_output = []

        for path in paths:

            try:

                page_result = ocr_engine.predict(path)

                ocr_output.append(
                    page_result[0] if page_result else {}
                )

            except Exception as per_image_error:

                logger.warning("PaddleOCR per-image error: %s", per_image_error)

                ocr_output.append({})

    for page in ocr_output:

        if not page:

            results.append("")

            continue

        rec_texts = page.get(
            "rec_texts",
            []
        )

        results.append(
            clean_text(
                "\n".join(
                    rec_texts
                )
            )
        )

    # Normalize the result list to the input length (defensive).
    if len(results) < len(paths):

        results.extend(
            [""] * (len(paths) - len(results))
        )

    return results[0] if single else results


# ===========================================================
# PDF EXTRACTION (text layer first, OCR only when needed)
# ===========================================================

def extract_pdf(file_path):

    """
    Extract text from a PDF.

    Strategy (huge speed-up for typical healthcare PDFs):
      1. Read the embedded text layer of every page with PyMuPDF
         (milliseconds). Most digital/exported PDFs are done here.
      2. Only pages with no usable text layer (scanned pages) are
         rendered and OCR'd, at a lower DPI and in batches.
    """

    document = None

    try:

        print(f"\nExtracting PDF : {file_path}")

        document = fitz.open(file_path)

        total_pages = len(document)

        print(f"Total Pages : {total_pages}")

        # Pass 1: pull the embedded text layer for every page.
        pages_text = [""] * total_pages

        ocr_pages = []

        for page_number in range(total_pages):

            page = document.load_page(page_number)

            page_text = page.get_text("text")

            page_text = (page_text or "").strip()

            if len(page_text) >= MIN_TEXT_CHARS:

                pages_text[page_number] = page_text

            else:

                ocr_pages.append(page_number)

        print(
            f"Text layer pages : "
            f"{total_pages - len(ocr_pages)} | "
            f"OCR needed : {len(ocr_pages)}"
        )

        # Pass 2: OCR only the pages with no readable text layer.
        if len(ocr_pages) > MAX_OCR_PAGES:

            print(
                f"WARNING: {len(ocr_pages)} scanned pages exceed the "
                f"OCR cap of {MAX_OCR_PAGES}; OCR-ing only the first "
                f"{MAX_OCR_PAGES} pages."
            )

            ocr_pages = ocr_pages[:MAX_OCR_PAGES]

        if ocr_pages:

            for start in range(0, len(ocr_pages), OCR_BATCH_SIZE):

                batch = ocr_pages[
                    start:start + OCR_BATCH_SIZE
                ]

                image_paths = [
                    pdf_page_to_image(
                        document.load_page(page_number)
                    )
                    for page_number in batch
                ]

                try:

                    ocr_texts = run_paddle_ocr(
                        image_paths
                    )

                    for page_number, text in zip(batch, ocr_texts):

                        if text.strip():

                            pages_text[page_number] = text

                finally:

                    for image_path in image_paths:

                        delete_temp_image(image_path)

        final_text = "\n\n".join(
            page_text
            for page_text in pages_text
            if page_text.strip()
        )

        final_text = clean_text(
            final_text
        )

        print(
            f"PDF Extraction Completed "
            f"({len(final_text)} Characters)"
        )

        final_text = validate_extracted_text(
            final_text
        )

        print_ocr_statistics(
            file_path,
            final_text
        )

        return final_text

    except Exception as e:

        print(
            "PDF OCR ERROR:",
            str(e)
        )

        return ""

    finally:

        # Always release the PDF handle, even on errors.
        if document is not None:

            try:

                document.close()

            except Exception:

                pass


# ===========================================================
# IMAGE OCR
# ===========================================================

def extract_image(file_path):

    """
    Extract text from an image using PaddleOCR.
    """

    try:

        print(f"\nOCR Processing Image : {file_path}")

        extracted_text = run_paddle_ocr(
            file_path
        )

        extracted_text = clean_text(
            extracted_text
        )

        print(
            f"Image OCR Completed "
            f"({len(extracted_text)} Characters)"
        )

        extracted_text = validate_extracted_text(
            extracted_text
        )

        print_ocr_statistics(
            file_path,
            extracted_text
        )

        return extracted_text

    except Exception as e:

        print(
            "IMAGE OCR ERROR:",
            str(e)
        )

        return ""


# ===========================================================
# DOCX IMAGE OCR
# ===========================================================

def extract_docx_images(file_path):

    """
    Extract text from images embedded inside a DOCX file.
    Images are OCR'd together in batches for speed.
    """

    extracted_text = []

    temp_directory = tempfile.mkdtemp()

    image_paths = []

    try:

        document = Document(file_path)

        image_index = 1

        for relation in document.part._rels.values():

            if "image" not in relation.target_ref:

                continue

            image = relation.target_part.blob

            image_path = os.path.join(
                temp_directory,
                f"image_{image_index}.png"
            )

            with open(
                image_path,
                "wb"
            ) as file:

                file.write(image)

            image_paths.append(image_path)

            image_index += 1

        # Batch OCR all embedded images.
        for start in range(0, len(image_paths), OCR_BATCH_SIZE):

            batch = image_paths[
                start:start + OCR_BATCH_SIZE
            ]

            texts = run_paddle_ocr(
                batch
            )

            for text in texts:

                if text.strip():

                    extracted_text.append(
                        text
                    )

        shutil.rmtree(
            temp_directory,
            ignore_errors=True
        )

        text = clean_text(
            "\n".join(
                extracted_text
            )
        )

        return validate_extracted_text(
            text
        )

    except Exception as e:

        print(
            "DOCX IMAGE OCR ERROR:",
            str(e)
        )

        shutil.rmtree(
            temp_directory,
            ignore_errors=True
        )

        return ""


# ===========================================================
# OCR VALIDATION
# ===========================================================

def validate_extracted_text(text):

    """
    Validate extracted OCR text.
    """

    if text is None:
        return ""

    text = clean_text(text)

    if len(text.strip()) == 0:
        print("OCR WARNING : No text extracted.")

    return text


# ===========================================================
# OCR STATISTICS
# ===========================================================

def print_ocr_statistics(file_path, extracted_text):

    print("\n===================================")
    print("OCR COMPLETED")
    print("===================================")
    print(f"File : {os.path.basename(file_path)}")
    print(f"Characters Extracted : {len(extracted_text)}")
    print(f"Words Extracted : {len(extracted_text.split())}")
    print("===================================\n")
