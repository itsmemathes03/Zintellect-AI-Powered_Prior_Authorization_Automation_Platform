"""
Configuration module for the contradiction detection pipeline.
Centralizes thresholds, feature flags, and model names.

Adapted from the standalone contradiction_detection module.
"""

from typing import Dict, Any
import os


# Detection thresholds
NEGATION_WINDOW_SIZE = 5  # Tokens to check after negation cue
SEMANTIC_SIMILARITY_THRESHOLD = 0.75  # Threshold for considering texts semantically equivalent
SEMANTIC_OPPOSITION_THRESHOLD = 0.25  # Threshold for considering texts potentially opposed

# Topic matching
MIN_TOPIC_CONFIDENCE = 0.6  # Minimum confidence for topic matches to be considered

# Contradiction detection thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.90   # Strong contradiction
MEDIUM_CONFIDENCE_THRESHOLD = 0.75 # Likely contradiction
LOW_CONFIDENCE_THRESHOLD = 0.50    # Possible contradiction (below this -> uncertain)

# Severity mapping - maps topics to severity levels
TOPIC_SEVERITY_MAP = {
    # High severity - diagnosis conflicts, critical findings
    "migraine": "high",
    "hypertension": "high",
    "diabetes": "high",
    "stroke": "high",
    "infection": "high",
    "tumor": "high",
    "fracture": "high",
    "abnormal": "high",

    # Medium severity - neurological/physical exam findings, symptom conflicts
    "numbness": "medium",
    "dizziness": "medium",
    "headache": "medium",
    "pain": "medium",
    "weakness": "medium",
    "fever": "medium",
    "cough": "medium",
    "shortness_of_breath": "medium",
    "nausea": "medium",

    # Diagnostic tests/procedures — medium severity
    "mri": "medium",
    "ct_scan": "medium",
    "xray": "medium",
    "ultrasound": "medium",
    "blood_test": "medium",
    "ekg": "medium",
    "eeg": "medium",

    # Body regions — low severity
    "left_upper_extremity": "low",
    "right_upper_extremity": "low",
    "left_lower_extremity": "low",
    "right_lower_extremity": "low",
    "head": "low",
    "neck": "low",
    "back": "low",
    "chest": "low",
    "abdomen": "low",
}

# Default severity for topics not explicitly mapped
DEFAULT_TOPIC_SEVERITY = "low"

# LLM Reasoning Configuration (optional, disabled by default)
ENABLE_LLM_REASONING = False  # Set to True to enable LLM reasoning layer
LLM_PROVIDER = "anthropic"    # Options: "anthropic", "openai"
LLM_MODEL = None              # None uses provider default
LLM_API_KEY = None            # If None, tries to get from environment variable

# Environmental variable names for API keys
ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY"
OPENAI_API_KEY_ENV = "OPENAI_API_KEY"

# Sentence transformer model for semantic matching
SEMANTIC_MODEL_NAME = "all-MiniLM-L6-v2"

# Feature flags
ENABLE_NEGATION_DETECTION = True
ENABLE_TOPIC_MATCHING = True
ENABLE_SEMANTIC_MATCHING = True
ENABLE_LLM_REASONING_FALLBACK = True  # Use LLM as fallback when deterministic layers uncertain


def get_config() -> Dict[str, Any]:
    """
    Get the current configuration as a dictionary.
    """
    api_key = LLM_API_KEY
    if api_key is None and LLM_PROVIDER == "anthropic":
        api_key = os.environ.get(ANTHROPIC_API_KEY_ENV)
    elif api_key is None and LLM_PROVIDER == "openai":
        api_key = os.environ.get(OPENAI_API_KEY_ENV)

    return {
        "NEGATION_WINDOW_SIZE": NEGATION_WINDOW_SIZE,
        "SEMANTIC_SIMILARITY_THRESHOLD": SEMANTIC_SIMILARITY_THRESHOLD,
        "SEMANTIC_OPPOSITION_THRESHOLD": SEMANTIC_OPPOSITION_THRESHOLD,
        "MIN_TOPIC_CONFIDENCE": MIN_TOPIC_CONFIDENCE,
        "HIGH_CONFIDENCE_THRESHOLD": HIGH_CONFIDENCE_THRESHOLD,
        "MEDIUM_CONFIDENCE_THRESHOLD": MEDIUM_CONFIDENCE_THRESHOLD,
        "LOW_CONFIDENCE_THRESHOLD": LOW_CONFIDENCE_THRESHOLD,
        "TOPIC_SEVERITY_MAP": TOPIC_SEVERITY_MAP.copy(),
        "DEFAULT_TOPIC_SEVERITY": DEFAULT_TOPIC_SEVERITY,
        "ENABLE_LLM_REASONING": ENABLE_LLM_REASONING,
        "LLM_PROVIDER": LLM_PROVIDER,
        "LLM_MODEL": LLM_MODEL,
        "LLM_API_KEY": api_key,
        "SEMANTIC_MODEL_NAME": SEMANTIC_MODEL_NAME,
        "ENABLE_NEGATION_DETECTION": ENABLE_NEGATION_DETECTION,
        "ENABLE_TOPIC_MATCHING": ENABLE_TOPIC_MATCHING,
        "ENABLE_SEMANTIC_MATCHING": ENABLE_SEMANTIC_MATCHING,
        "ENABLE_LLM_REASONING_FALLBACK": ENABLE_LLM_REASONING_FALLBACK,
    }


def get_topic_severity(topic: str) -> str:
    """Get severity level for a topic."""
    return TOPIC_SEVERITY_MAP.get(topic, DEFAULT_TOPIC_SEVERITY)


def is_llm_reasoning_enabled() -> bool:
    """Check if LLM reasoning is enabled."""
    return ENABLE_LLM_REASONING
