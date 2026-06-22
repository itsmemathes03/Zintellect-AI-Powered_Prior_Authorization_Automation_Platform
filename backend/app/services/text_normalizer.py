import re

MEDICAL_SYNONYMS = {
    "loc": "loss of consciousness",
    "head trauma": "head injury",
    "neuro deficit": "neurological deficit",
    "pt": "physical therapy",
    "ha": "headache",
    "vertigo": "dizziness",
    "physiotherapy": "physical therapy",
    "cranial trauma": "head injury"
}

def normalize_text(text):

    if not text:
        return ""

    text = text.lower()

    # remove punctuation
    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    # normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()

    # synonym normalization
    for short, full in MEDICAL_SYNONYMS.items():
        text = text.replace(short, full)

    return text