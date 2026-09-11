import re


def clean_text(text: str) -> str:
    """
    Clean OCR extracted text.
    """

    if not text:
        return ""

    # Remove multiple spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Remove multiple blank lines
    text = re.sub(r"\n+", "\n", text)

    # Remove unwanted characters
    text = text.replace("\x0c", "")

    # Trim whitespace
    text = text.strip()

    return text