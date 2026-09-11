"""
Topic/entity matching layer for the contradiction detection pipeline.
Extracts clinical topics from sentences using keyword/phrase lists and groups
sentences that reference the same topic across documents.

Adapted from the standalone contradiction_detection module.
"""

import re
from typing import List, Dict, Tuple, Set, Any
from collections import defaultdict


# Clinical topic dictionary - maps topic names to lists of keywords/phrases
CLINICAL_TOPICS = {
    # Symptoms
    "numbness": [
        "numb", "numbness", "tingling", "paresthesia",
        "decreased sensation", "loss of sensation", "hypoesthesia"
    ],
    "dizziness": [
        "dizziness", "dizzy", "vertigo", "lightheaded", "lightheadedness",
        "woozy", "unsteady", "balance problems"
    ],
    "headache": [
        "headache", "head pain", "cephalgia", "migraine", "tension headache",
        "cluster headache", "ha", "h/a"
    ],
    "pain": [
        "pain", "ache", "soreness", "tenderness", "discomfort", "aching",
        "throbbing", "sharp pain", "dull pain", "burning"
    ],
    "weakness": [
        "weakness", "weak", "asthenia", "fatigue", "tired", "lethargic",
        "decreased strength", "hypotonia"
    ],
    "fever": [
        "fever", "febrile", "pyrexia", "temperature", "temp >", "temp >= ",
        "high temperature", "elevated temperature"
    ],
    "cough": [
        "cough", "coughing", "pertussis", "productive cough", "dry cough"
    ],
    "shortness_of_breath": [
        "shortness of breath", "sob", "dyspnea", "breathlessness",
        "difficulty breathing", "breath shortness", "can't catch breath"
    ],
    "nausea": [
        "nausea", "nauseous", "queasy", "sick to stomach", "vomiting",
        "emesis", "throwing up"
    ],

    # Body regions/anatomy
    "left_upper_extremity": [
        "left upper extremity", "left arm", "left hand", "left shoulder",
        "left upper limb", "left ue", "left ux"
    ],
    "right_upper_extremity": [
        "right upper extremity", "right arm", "right hand", "right shoulder",
        "right upper limb", "right ue", "right ux"
    ],
    "left_lower_extremity": [
        "left lower extremity", "left leg", "left foot", "left knee",
        "left lower limb", "left ll", "left lx"
    ],
    "right_lower_extremity": [
        "right lower extremity", "right leg", "right foot", "right knee",
        "right lower limb", "right ll", "right lx"
    ],
    "head": ["head", "skull", "cranial", "cephalic"],
    "neck": ["neck", "cervical"],
    "back": ["back", "spine", "vertebral", "dorsal", "lumbar", "thoracic"],
    "chest": ["chest", "thorax", "pectoral", "breast"],
    "abdomen": ["abdomen", "abdominal", "stomach", "belly", "ventral"],

    # Diagnostic tests/procedures
    "mri": ["mri", "magnetic resonance imaging", "nmri"],
    "ct_scan": ["ct", "cat scan", "computed tomography", "ct scan"],
    "xray": ["xray", "x-ray", "radiograph", "plain film"],
    "ultrasound": ["ultrasound", "us", "sonogram", "doppler"],
    "blood_test": [
        "blood test", "blood work", "lab", "labs", "blood draw",
        "venipuncture", "cbc", "bmp", "cmp"
    ],
    "ekg": ["ekg", "ecg", "electrocardiogram"],
    "eeg": ["eeg", "electroencephalogram"],

    # Diagnoses/conditions
    "migraine": ["migraine", "migraines", "hemicrania"],
    "hypertension": ["hypertension", "high blood pressure", "htn", "elevated bp"],
    "diabetes": ["diabetes", "diabetic", "dm", "type 1", "type 2", "t1d", "t2d"],
    "stroke": ["stroke", "cva", "cerebrovascular accident", "brain attack"],
    "infection": ["infection", "infected", "bacterial", "viral", "fungal", "sepsis"],
    "tumor": ["tumor", "neoplasm", "mass", "lesion", "cancer", "malignancy"],
    "fracture": ["fracture", "broken", "fx", "break", "crack"],

    # General findings
    "abnormal": ["abnormal", "abnormality", "abnormal findings", "pathological"],
    "normal": ["normal", "negative", "unremarkable", "within normal limits", "wnl"],
}


def build_topic_patterns() -> Dict[str, List[re.Pattern]]:
    """Build compiled regex patterns for each clinical topic."""
    topic_patterns = {}
    for topic, keywords in CLINICAL_TOPICS.items():
        patterns = []
        for keyword in keywords:
            escaped_keyword = re.escape(keyword)
            pattern = rf'\b{escaped_keyword}\b'
            try:
                compiled_pattern = re.compile(pattern, re.IGNORECASE)
                patterns.append(compiled_pattern)
            except re.error:
                continue
        topic_patterns[topic] = patterns
    return topic_patterns


TOPIC_PATTERNS = build_topic_patterns()


def extract_topics_from_text(text: str) -> List[Tuple[str, str, Tuple[int, int]]]:
    """Extract clinical topics from text and return matches with context."""
    if not text or not text.strip():
        return []

    matches = []
    for topic, patterns in TOPIC_PATTERNS.items():
        for pattern in patterns:
            for match in pattern.finditer(text):
                matched_text = match.group()
                start_offset = match.start()
                end_offset = match.end()
                matches.append((topic, matched_text, (start_offset, end_offset)))

    unique_matches = []
    seen_positions = set()
    for topic, matched_text, (start, end) in matches:
        position_key = (start, end)
        if position_key not in seen_positions:
            seen_positions.add(position_key)
            unique_matches.append((topic, matched_text, (start, end)))

    return unique_matches


def get_sentence_topics(normalized_sentences: List[Tuple[str, str, int, int]]) -> List[Dict[str, Any]]:
    """
    Extract topics from a list of normalized sentences.
    """
    sentence_topics = []
    for normalized_sent, original_sent, start_offset, end_offset in normalized_sentences:
        topics = extract_topics_from_text(normalized_sent)
        original_topics = extract_topics_from_text(original_sent)

        sentence_info = {
            "normalized_text": normalized_sent,
            "original_text": original_sent,
            "start_offset": start_offset,
            "end_offset": end_offset,
            "topics": [topic for topic, _, _ in topics],
            "topic_details": [
                {
                    "topic": topic,
                    "matched_text": matched_text,
                    "start_offset": topic_start,
                    "end_offset": topic_end
                }
                for topic, matched_text, (topic_start, topic_end) in original_topics
            ]
        }
        sentence_topics.append(sentence_info)

    return sentence_topics


def find_topic_matches_across_documents(
    all_documents_data: List[Tuple[str, List[Dict[str, Any]]]]
) -> List[Dict[str, Any]]:
    """
    Find sentences across different documents that mention the same topics.
    """
    topic_to_sentences = defaultdict(list)

    for doc_id, sentence_data in all_documents_data:
        for sentence in sentence_data:
            for topic in sentence["topics"]:
                topic_to_sentences[topic].append({
                    "document_id": doc_id,
                    "sentence": sentence
                })

    cross_document_matches = []
    for topic, sentences in topic_to_sentences.items():
        docs_mentioning_topic = set(s["document_id"] for s in sentences)
        if len(docs_mentioning_topic) >= 2:
            cross_document_matches.append({
                "topic": topic,
                "mentions": sentences
            })

    return cross_document_matches


def get_topic_confidence(sentence: Dict[str, Any], topic: str) -> float:
    """Calculate confidence score for a topic mention in a sentence."""
    topic_details = sentence.get("topic_details", [])

    for detail in topic_details:
        if detail["topic"] == topic:
            matched_text = detail["matched_text"].lower()
            canonical_keywords = CLINICAL_TOPICS.get(topic, [])
            if matched_text in [kw.lower() for kw in canonical_keywords]:
                return 0.9
            elif any(kw.lower() in matched_text for kw in canonical_keywords):
                return 0.85
            else:
                return 0.8

    return 0.75
