"""
Utility functions for the Evidence-to-Policy Traceability module.
Contains helper functions for data processing, validation, and formatting.
"""

import json
import logging
from typing import Any, Dict, List
from .schemas import EvidenceToPolicyInput, EvidenceToPolicyOutput


# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def setup_logging(level: int = logging.INFO) -> None:
    """
    Set up logging configuration for the module.

    Args:
        level: Logging level (default: INFO)
    """
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(level)


def validate_input_schema(input_data: Dict[str, Any]) -> bool:
    """
    Validate that input data conforms to the expected schema.

    Args:
        input_data: Input data to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        EvidenceToPolicyInput(**input_data)
        return True
    except Exception as e:
        logger.warning(f"Input validation failed: {str(e)}")
        return False


def validate_output_schema(output_data: Dict[str, Any]) -> bool:
    """
    Validate that output data conforms to the expected schema.

    Args:
        output_data: Output data to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        EvidenceToPolicyOutput(**output_data)
        return True
    except Exception as e:
        logger.warning(f"Output validation failed: {str(e)}")
        return False


def load_json_file(file_path: str) -> Dict[str, Any]:
    """
    Load JSON data from a file.

    Args:
        file_path: Path to the JSON file

    Returns:
        Dictionary containing the JSON data
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in file {file_path}: {str(e)}")
        raise


def save_json_file(data: Dict[str, Any], file_path: str) -> None:
    """
    Save data as JSON to a file.

    Args:
        data: Data to save
        file_path: Path where to save the JSON file
    """
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Data saved to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save data to {file_path}: {str(e)}")
        raise


def calculate_evidence_coverage(evidence_list: List[Dict[str, Any]]) -> float:
    """
    Calculate coverage score based on evidence confidence scores.

    Args:
        evidence_list: List of evidence dictionaries

    Returns:
        Average confidence score (0-1)
    """
    if not evidence_list:
        return 0.0

    total_confidence = sum(ev.get('confidence', 0.0) for ev in evidence_list)
    return total_confidence / len(evidence_list)


def filter_evidence_by_confidence(evidence_list: List[Dict[str, Any]],
                                min_confidence: float = 0.0) -> List[Dict[str, Any]]:
    """
    Filter evidence items by minimum confidence threshold.

    Args:
        evidence_list: List of evidence dictionaries
        min_confidence: Minimum confidence threshold (0-1)

    Returns:
        Filtered list of evidence dictionaries
    """
    return [ev for ev in evidence_list if ev.get('confidence', 0.0) >= min_confidence]


def group_evidence_by_document(evidence_list: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Group evidence items by document ID.

    Args:
        evidence_list: List of evidence dictionaries

    Returns:
        Dictionary mapping document IDs to lists of evidence
    """
    grouped = {}
    for evidence in evidence_list:
        doc_id = evidence.get('document_id', 'unknown')
        if doc_id not in grouped:
            grouped[doc_id] = []
        grouped[doc_id].append(evidence)
    return grouped


def sanitize_text_for_logging(text: str, max_length: int = 100) -> str:
    """
    Sanitize text for logging by truncating and removing potentially sensitive content.

    Args:
        text: Text to sanitize
        max_length: Maximum length of returned text

    Returns:
        Sanitized text safe for logging
    """
    if not text:
        return ""

    # Truncate if too long
    if len(text) > max_length:
        text = text[:max_length] + "..."

    # Remove potential PHI patterns (simplified)
    # In a real system, you'd use more sophisticated PHI detection
    import re
    # Remove patterns that look like names, IDs, etc.
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)  # SSN-like
    text = re.sub(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD]', text)  # Credit card-like
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)  # Email

    return text