"""
Negation detection layer for the contradiction detection pipeline.
Implements lightweight negation cue detection using a scope-window approach
similar to NegEx algorithm.

Adapted from the standalone contradiction_detection module.
"""

import re
from typing import List, Tuple, Dict, Any


# Negation cues - words/phrases that indicate negation
NEGATION_CUES = [
    # Direct negations
    r'\bno\b',
    r'\bdenies\b',
    r'\bdenied\b',
    r'\bwithout\b',
    r'\babsent\b',
    r'\bnegative\b',
    r'\bnot\b',

    # Phrasal negations
    r'\bnegative for\b',
    r'\bnot present\b',
    r'\bnot detected\b',
    r'\bnot observed\b',
    r'\bnot reported\b',
    r'\bdoes not report\b',
    r'\bruled out\b',
    r'\brule out\b',
    r'\brules out\b',
    r'\bno evidence of\b',
    r'\bno signs of\b',
    r'\bno indication of\b',
    r'\bfree of\b',
    r'\bwithout evidence of\b',
    r'\bnot consistent with\b',

    # Additional clinical negations
    r'\babsence of\b',
    r'\blacking\b',
    r'\bnon-\b',
    r'\bunremarkable\b',
]


def compile_negation_patterns() -> List[re.Pattern]:
    """Compile negation cue patterns for efficient matching."""
    patterns = []
    for cue in NEGATION_CUES:
        try:
            pattern = re.compile(cue, re.IGNORECASE)
            patterns.append(pattern)
        except re.error:
            continue
    return patterns


NEGATION_PATTERNS = compile_negation_patterns()


def contains_negation(text: str, window_size: int = 5) -> Tuple[bool, List[str]]:
    """
    Detect if text contains negation cues within a scope window.
    """
    if not text or not text.strip():
        return False, []

    tokens = re.findall(r'\b\w+\b', text.lower())
    matched_cues = []

    for i, token in enumerate(tokens):
        token_matched = False
        for pattern in NEGATION_PATTERNS:
            if pattern.fullmatch(token):
                matched_cues.append(token)
                token_matched = True
                break

        if not token_matched and i < len(tokens):
            if i + 1 < len(tokens):
                two_token = f"{tokens[i]} {tokens[i+1]}"
                for pattern in NEGATION_PATTERNS:
                    if pattern.fullmatch(two_token):
                        matched_cues.append(two_token)
                        token_matched = True
                        break

            if not token_matched and i + 2 < len(tokens):
                three_token = f"{tokens[i]} {tokens[i+1]} {tokens[i+2]}"
                for pattern in NEGATION_PATTERNS:
                    if pattern.fullmatch(three_token):
                        matched_cues.append(three_token)
                        token_matched = True
                        break

        if token_matched:
            return True, matched_cues

    return False, matched_cues


def detect_negation_in_sentence(sentence: str) -> Dict[str, Any]:
    """
    Detect negation in a sentence and return detailed information.
    """
    is_negated, cues = contains_negation(sentence)
    polarity = "negated" if is_negated else "affirmed"

    return {
        "text": sentence,
        "is_negated": is_negated,
        "polarity": polarity,
        "negation_cues": cues,
        "confidence": 0.9 if is_negated else 0.8
    }


def batch_detect_negation(sentences: List[str]) -> List[Dict[str, Any]]:
    """Detect negation in multiple sentences."""
    return [detect_negation_in_sentence(sent) for sent in sentences]
