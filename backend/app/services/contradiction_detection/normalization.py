"""
Text normalization layer for the contradiction detection pipeline.
Handles sentence splitting, lowercase conversion, and basic text cleanup.
Always preserves original text for evidence — normalization is only for internal matching.

Adapted from the standalone contradiction_detection module.
"""

import re
from typing import List, Tuple


def normalize_text(text: str) -> str:
    """
    Normalize text for comparison purposes while preserving original for evidence.
    """
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'([.,;:])([^\s])', r'\1 \2', text)
    text = text.strip()
    return text


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using a simple rule-based approach.
    """
    if not text.strip():
        return []

    abbreviations = {
        'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
        'hr', 'min', 'sec', 'mg', 'ml', 'kg', 'cm', 'mm', 'bp', 'icu', 'er', 'or',
        'pt', 'px', 'ds', 'dt', 'rx', 'tx', 'hx', 'bx', 'fx', 'nx'
    }

    sentences = []
    current = ""
    tokens = re.findall(r'\S+|\s+', text)

    i = 0
    while i < len(tokens):
        token = tokens[i]
        current += token

        if token.endswith(('.', '!', '?')):
            word_part = token.rstrip('.!?')
            if word_part.lower() in abbreviations and i + 1 < len(tokens):
                next_token = tokens[i + 1].strip()
                if next_token and next_token[0].isupper():
                    sentences.append(current.strip())
                    current = ""
            else:
                sentences.append(current.strip())
                current = ""

        i += 1

    if current.strip():
        sentences.append(current.strip())

    sentences = [s for s in sentences if s]
    return sentences


def extract_sentences_with_offsets(text: str) -> List[Tuple[str, int, int]]:
    """
    Extract sentences from text along with their character offsets.
    """
    if not text.strip():
        return []

    sentences = split_into_sentences(text)
    sentences_with_offsets = []
    search_pos = 0

    for sentence in sentences:
        pos = text.find(sentence, search_pos)
        if pos == -1:
            pos = text.lower().find(sentence.lower(), search_pos)

        if pos != -1:
            end_pos = pos + len(sentence)
            sentences_with_offsets.append((sentence, pos, end_pos))
            search_pos = end_pos
        else:
            sentences_with_offsets.append((sentence, search_pos, search_pos + len(sentence)))
            search_pos += len(sentence)

    return sentences_with_offsets


def get_normalized_sentences(document_text: str) -> List[Tuple[str, str, int, int]]:
    """
    Get normalized sentences from document text along with original text and offsets.

    Returns:
        List of tuples (normalized_sentence, original_sentence, start_offset, end_offset)
    """
    original_sentences_with_offsets = extract_sentences_with_offsets(document_text)

    normalized_sentences = []
    for original_sentence, start_offset, end_offset in original_sentences_with_offsets:
        normalized = normalize_text(original_sentence)
        normalized_sentences.append((normalized, original_sentence, start_offset, end_offset))

    return normalized_sentences
