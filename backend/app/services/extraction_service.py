import os
import fitz
import pytesseract

from PIL import Image
from PyPDF2 import PdfReader


# ==========================================
# TXT EXTRACTION
# ==========================================

def extract_txt(file_path):

    with open(
            file_path,
            "r",
            encoding="utf-8"
    ) as file:

        return file.read()


# ==========================================
# DIGITAL PDF EXTRACTION
# ==========================================

def extract_pdf_text(file_path):

    text = ""

    try:

        reader = PdfReader(
            file_path
        )

        for page in reader.pages:

            extracted = (
                page.extract_text()
            )

            if extracted:
                text += extracted + "\n"

    except Exception as e:

        print(
            "PDF ERROR:",
            str(e)
        )

    return text


# ==========================================
# SCANNED PDF OCR
# ==========================================

def extract_scanned_pdf(file_path):

    text = ""

    try:

        document = fitz.open(
            file_path
        )

        for page_number in range(
                len(document)
        ):

            page = document.load_page(
                page_number
            )

            pix = page.get_pixmap()

            image_path = (
                f"temp_page_"
                f"{page_number}.png"
            )

            pix.save(
                image_path
            )

            image = Image.open(
                image_path
            )

            page_text = (
                pytesseract.image_to_string(
                    image
                )
            )

            text += (
                page_text + "\n"
            )

            os.remove(
                image_path
            )

    except Exception as e:

        print(
            "OCR ERROR:",
            str(e)
        )

    return text


# ==========================================
# IMAGE OCR
# ==========================================

def extract_image_text(
        file_path
):

    try:

        image = Image.open(
            file_path
        )

        text = (
            pytesseract.image_to_string(
                image
            )
        )

        return text

    except Exception as e:

        print(
            "IMAGE OCR ERROR:",
            str(e)
        )

        return ""


# ==========================================
# MAIN EXTRACTION
# ==========================================

def extract_text(
        file_path
):

    extension = os.path.splitext(
        file_path
    )[1].lower()

    # TXT
    if extension == ".txt":

        return extract_txt(
            file_path
        )

    # PDF
    elif extension == ".pdf":

        text = extract_pdf_text(
            file_path
        )

        if len(text.strip()) > 50:

            return text

        return extract_scanned_pdf(
            file_path
        )

    # IMAGES
    elif extension in [

        ".png",
        ".jpg",
        ".jpeg"

    ]:

        return extract_image_text(
            file_path
        )

    return ""