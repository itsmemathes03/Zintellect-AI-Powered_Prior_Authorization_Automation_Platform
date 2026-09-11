"""
Service layer for the Evidence-to-Policy Traceability module.
Provides the main interface for processing evidence-to-policy traceability requests.
"""

from typing import Dict, Any
from .engine import EvidenceToPolicyEngine
from .schemas import EvidenceToPolicyInput, EvidenceToPolicyOutput


def process_evidence_trace(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main interface function for the Evidence-to-Policy Traceability module.

    Args:
        input_data: Dictionary containing the input data matching EvidenceToPolicyInput schema

    Returns:
        Dictionary containing the output data matching EvidenceToPolicyOutput schema

    Example:
        >>> input_data = {
        ...     "request_id": "PA-TEST-001",
        ...     "procedure": "MRI Brain Scan",
        ...     "policy": {
        ...         "policy_id": "POL-001",
        ...         "version": "1.0",
        ...         "requirements": [
        ...             {
        ...                 "requirement_id": "REQ-001",
        ...                 "description": "Clinical indication must be documented",
        ...                 "type": "condition"
        ...             }
        ...         ]
        ...     },
        ...     "clinical_evidence": [
        ...         {
        ...             "evidence_id": "E-001",
        ...             "text": "Patient reports recurrent headaches.",
        ...             "document_id": "DOC-001",
        ...             "document_name": "clinical_notes.pdf",
        ...             "page": 2,
        ...             "entity_type": "symptom",
        ...             "entity_value": "recurrent headaches",
        ...             "confidence": 0.94
        ...         }
        ...     ]
        ... }
        >>> result = process_evidence_trace(input_data)
    """
    # Validate input using Pydantic model (optional but recommended for development)
    # In production, you might want to skip this for performance
    try:
        validated_input = EvidenceToPolicyInput(**input_data)
    except Exception as e:
        # If validation fails, we still try to process but log the issue
        # In a production system, you might want to return a structured error
        pass

    # Initialize the engine
    engine = EvidenceToPolicyEngine(similarity_threshold=0.6)

    # Process the evidence-to-policy traceability
    result = engine.process_evidence_to_policy(input_data)

    return result


def process_evidence_trace_with_config(input_data: Dict[str, Any], similarity_threshold: float = 0.6) -> Dict[str, Any]:
    """
    Process evidence-to-policy traceability with configurable similarity threshold.

    Args:
        input_data: Dictionary containing the input data
        similarity_threshold: Threshold for considering evidence as matching (0-1)

    Returns:
        Dictionary containing the output data
    """
    engine = EvidenceToPolicyEngine(similarity_threshold=similarity_threshold)
    result = engine.process_evidence_to_policy(input_data)
    return result