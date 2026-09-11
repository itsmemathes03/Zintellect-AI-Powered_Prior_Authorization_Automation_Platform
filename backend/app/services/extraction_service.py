import os
import hashlib
import threading

from docx import Document

from app.services.ocr_service import (
    extract_pdf,
    extract_image,
    extract_docx_images
)

from app.services.text_cleaner import clean_text


# ==========================================
# EXTRACTION CACHE
# ==========================================
#
# Extracted text is cached by the file's SHA-256 hash. This makes
# repeated uploads of the same file, and the duplicate/similarity
# check (which re-extracts the same files), instant instead of
# running the full extraction pipeline twice.

_TEXT_CACHE = {}

_TEXT_CACHE_MAX = 256

_CACHE_LOCK = threading.Lock()


def _file_sha256(file_path):

    digest = hashlib.sha256()

    try:

        with open(
            file_path,
            "rb"
        ) as file:

            for chunk in iter(
                lambda: file.read(65536),
                b""
            ):

                digest.update(chunk)

        return digest.hexdigest()

    except Exception:

        return None


def _cache_get(digest):

    with _CACHE_LOCK:

        text = _TEXT_CACHE.get(digest)

        if text is not None:

            # True LRU via re-insertion (move_to_end is unavailable in
            # some embedded Python builds).
            _TEXT_CACHE.pop(digest, None)
            _TEXT_CACHE[digest] = text

        return text


def _cache_put(digest, text):

    with _CACHE_LOCK:

        if len(_TEXT_CACHE) >= _TEXT_CACHE_MAX:

            _TEXT_CACHE.pop(
                next(iter(_TEXT_CACHE)),
                None
            )

        _TEXT_CACHE[digest] = text


# ==========================================
# TXT EXTRACTION
# ==========================================

def extract_txt(file_path):

    with open(
        file_path,
        "r",
        encoding="utf-8",
        errors="ignore"
    ) as file:

        return clean_text(file.read())


# ==========================================
# DOCX EXTRACTION
# ==========================================

def extract_docx(file_path):

    try:

        document = Document(file_path)

        extracted_text = []

        # Paragraphs
        for paragraph in document.paragraphs:

            if paragraph.text.strip():
                extracted_text.append(
                    paragraph.text.strip()
                )

        # Tables
        for table in document.tables:

            for row in table.rows:

                row_text = []

                for cell in row.cells:

                    value = cell.text.strip()

                    if value:
                        row_text.append(value)

                if row_text:

                    extracted_text.append(
                        " | ".join(row_text)
                    )

        # Images inside DOCX
        image_text = extract_docx_images(file_path)

        if image_text:

            extracted_text.append(image_text)

        return clean_text(
            "\n".join(extracted_text)
        )

    except Exception as e:

        print("DOCX ERROR:", str(e))

        return ""


# ==========================================
# MAIN EXTRACTION
# ==========================================

# Very large extracted texts are not cached, to bound memory.
_MAX_CACHED_TEXT_LEN = 200_000


def extract_text(file_path):

    extension = os.path.splitext(
        file_path
    )[1].lower()

    # Fast path: return cached text when this exact file has already
    # been extracted (avoids duplicate OCR/extraction work). The key
    # includes the extension so identical bytes uploaded under different
    # file formats never share a cache entry.
    digest = _file_sha256(file_path)

    if digest:

        cached = _cache_get((digest, extension))

        if cached is not None:

            return cached

    if extension == ".pdf":

        result = extract_pdf(file_path)

    elif extension in [

        ".png",
        ".jpg",
        ".jpeg",
        ".bmp",
        ".tiff",
        ".tif",
        ".webp"

    ]:

        result = extract_image(file_path)

    elif extension == ".docx":

        result = extract_docx(file_path)

    elif extension == ".txt":

        result = extract_txt(file_path)

    else:

        print(
            f"Unsupported file format: {extension}"
        )

        result = ""

    # Only cache successful, non-trivial extractions; oversized texts
    # are skipped to keep memory bounded.
    if (
        digest
        and result
        and len(result) <= _MAX_CACHED_TEXT_LEN
    ):

        _cache_put((digest, extension), result)

    return result
