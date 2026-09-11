import re


# ==========================================
# PHI MASKING
# ==========================================

def deidentify_text(text):

    if not text:
        return ""

    # --------------------------------------
    # Patient Name
    # --------------------------------------

    text = re.sub(
        r'Patient Name\s*:.*',
        'Patient Name: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # DOB
    # --------------------------------------

    text = re.sub(
        r'DOB\s*:.*',
        'DOB: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r'\b\d{2}[/-]\d{2}[/-]\d{4}\b',
        '[DOB]',
        text
    )

    # --------------------------------------
    # Phone Number
    # --------------------------------------

    text = re.sub(
        r'\b\d{10}\b',
        '[PHONE]',
        text
    )

    text = re.sub(
        r'\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b',
        '[PHONE]',
        text
    )

    # --------------------------------------
    # Email
    # --------------------------------------

    text = re.sub(
        r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
        '[EMAIL]',
        text
    )

    # --------------------------------------
    # SSN
    # --------------------------------------

    text = re.sub(
        r'\b\d{3}-\d{2}-\d{4}\b',
        '[SSN]',
        text
    )

    # --------------------------------------
    # Insurance ID
    # --------------------------------------

    text = re.sub(
        r'Insurance ID\s*:.*',
        'Insurance ID: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # Policy Number
    # --------------------------------------

    text = re.sub(
        r'Policy Number\s*:.*',
        'Policy Number: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # Medical Record Number
    # --------------------------------------

    text = re.sub(
        r'MRN\s*:.*',
        'MRN: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # Member ID
    # --------------------------------------

    text = re.sub(
        r'Member ID\s*:.*',
        'Member ID: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # Claim Number
    # --------------------------------------

    text = re.sub(
        r'Claim Number\s*:.*',
        'Claim Number: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    # --------------------------------------
    # Address
    # --------------------------------------

    text = re.sub(
        r'Address\s*:.*',
        'Address: [REDACTED]',
        text,
        flags=re.IGNORECASE
    )

    return text