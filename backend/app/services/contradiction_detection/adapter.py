"""
Zintellect-specific adapter for the Contradiction Detection module.

Translates existing PriorAuthRequest data into ContradictionDetectionRequest format.
Uses ACTUAL Zintellect identifiers (PA request IDs, document IDs, file names).

This adapter does NOT modify the PA request, authorization status,
or any existing workflow state. It only reads existing data.

Adapted from the standalone contradiction_detection module.
"""

import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def adapt_zintellect_request(
    request_id: str,
    clinical_notes: str,
    diagnosis: str = "",
    procedure_code: str = "",
    uploaded_files: Optional[List[Dict[str, Any]]] = None,
    extracted_entities: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Adapt an existing Zintellect PA request into ContradictionDetectionRequest format.

    Uses real Zintellect data:
    - Actual PriorAuthRequest.id as request_id
    - Actual clinical_notes text (pre-extracted by OCR/extraction pipeline)
    - Actual uploaded file metadata for document identification
    - Actual extracted clinical entities if available

    The contradiction detector expects pre-extracted text, so we pass
    the clinical_notes directly (already processed by OCR/extraction).

    Args:
        request_id: The actual PriorAuthRequest.id
        clinical_notes: The actual clinical text from the PA request
        diagnosis: The actual diagnosis (for context)
        procedure_code: The actual procedure code (for context)
        uploaded_files: List of uploaded file metadata dicts from the PA request
        extracted_entities: Output from ai_service.extract_medical_entities()

    Returns:
        Dictionary matching ContradictionDetectionRequest schema
    """
    documents = []

    # ---- Primary document: Clinical notes ----
    # The clinical_notes field contains the pre-extracted text from OCR.
    # This is the primary source for contradiction detection.
    if clinical_notes and clinical_notes.strip():
        # Try to split by document type if uploaded_files metadata is available
        doc_segments = _split_clinical_notes_by_source(
            clinical_notes, uploaded_files
        )

        for i, segment in enumerate(doc_segments):
            documents.append({
                "document_id": segment.get("document_id", f"DOC-{i:03d}"),
                "document_name": segment.get("document_name", f"Clinical Document {i+1}"),
                "document_type": segment.get("document_type", "clinical_note"),
                "text": segment["text"],
            })

    # ---- Fallback: If no documents created, use full clinical notes ----
    if not documents and clinical_notes and clinical_notes.strip():
        documents.append({
            "document_id": "DOC-001",
            "document_name": "Clinical Notes",
            "document_type": "clinical_note",
            "text": clinical_notes.strip(),
        })

    # ---- Construct the request ----
    request_data = {
        "request_id": request_id,
        "documents": documents,
    }

    return request_data


def _split_clinical_notes_by_source(
    clinical_notes: str,
    uploaded_files: Optional[List[Dict[str, Any]]]
) -> List[Dict[str, Any]]:
    """
    Attempt to split clinical notes into per-document segments.

    If uploaded_files metadata is available and contains multiple files,
    we try to split the clinical text by document type markers or headers.

    If splitting is not possible (single document, no markers), returns
    the full text as a single document.

    Args:
        clinical_notes: The full clinical text
        uploaded_files: List of uploaded file metadata dicts

    Returns:
        List of document segment dicts with document_id, document_name, document_type, text
    """
    if not uploaded_files or len(uploaded_files) <= 1:
        # Single document or no metadata — return as-is
        return [{
            "document_id": "DOC-001",
            "document_name": "Clinical Notes",
            "document_type": "clinical_note",
            "text": clinical_notes.strip(),
        }]

    # Multiple files — try to split by section markers in the clinical text
    # Common markers: "=== DOCUMENT 1 ===", "--- Note 1 ---", or file name references
    segments = []

    # Try splitting on common section delimiters
    import re
    section_pattern = r'(?:={3,}|-{3,}|#{2,})\s*(?:Document|Note|File|Report|Section)\s*\d+'
    splits = re.split(f'({section_pattern})', clinical_notes, flags=re.IGNORECASE)

    if len(splits) > 1:
        # We found section markers — split accordingly
        current_text = ""
        for part in splits:
            if re.match(section_pattern, part, re.IGNORECASE):
                if current_text.strip():
                    segments.append(current_text.strip())
                current_text = ""
            else:
                current_text += part
        if current_text.strip():
            segments.append(current_text.strip())
    else:
        # No section markers found — use full text as single document
        segments = [clinical_notes.strip()]

    # Map segments to uploaded file metadata
    result = []
    for i, text_segment in enumerate(segments):
        if i < len(uploaded_files):
            file_meta = uploaded_files[i]
            doc_name = file_meta.get("file_name", file_meta.get("name", f"Document {i+1}"))
            doc_id = file_meta.get("document_id", file_meta.get("id", f"DOC-{i+1:03d}"))
            doc_type = file_meta.get("document_type", file_meta.get("type", "clinical_note"))
        else:
            doc_name = f"Document {i+1}"
            doc_id = f"DOC-{i+1:03d}"
            doc_type = "clinical_note"

        result.append({
            "document_id": str(doc_id),
            "document_name": str(doc_name),
            "document_type": str(doc_type),
            "text": text_segment,
        })

    return result


def adapt_from_entities(
    request_id: str,
    extracted_entities: Dict[str, Any],
    uploaded_files: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Adapt extracted clinical entities into ContradictionDetectionRequest.

    This is an alternative adapter that works with structured entity data
    rather than raw clinical text. Useful when the AI extraction has already
    processed the documents.

    Args:
        request_id: The actual PriorAuthRequest.id
        extracted_entities: Output from ai_service.extract_medical_entities()
        uploaded_files: List of uploaded file metadata dicts

    Returns:
        Dictionary matching ContradictionDetectionRequest schema
    """
    documents = []

    # Build clinical text from entities
    clinical_text_parts = []

    diagnosis = extracted_entities.get("diagnosis", "")
    if diagnosis:
        clinical_text_parts.append(f"Diagnosis: {diagnosis}")

    symptoms = extracted_entities.get("symptoms", [])
    if symptoms:
        if isinstance(symptoms, list):
            clinical_text_parts.append(f"Symptoms: {', '.join(str(s) for s in symptoms)}")
        else:
            clinical_text_parts.append(f"Symptoms: {symptoms}")

    medications = extracted_entities.get("medications", [])
    if medications:
        if isinstance(medications, list):
            clinical_text_parts.append(f"Medications: {', '.join(str(m) for m in medications)}")
        else:
            clinical_text_parts.append(f"Medications: {medications}")

    treatment_history = extracted_entities.get("treatment_history", {})
    if isinstance(treatment_history, dict):
        pt = treatment_history.get("physical_therapy", {})
        if isinstance(pt, dict):
            duration = pt.get("duration", "")
            outcome = pt.get("outcome", "")
            if duration or outcome:
                clinical_text_parts.append(
                    f"Physical therapy: duration={duration}, outcome={outcome}"
                )

    procedure = extracted_entities.get("procedure_requested", "")
    if procedure:
        clinical_text_parts.append(f"Procedure requested: {procedure}")

    full_text = ". ".join(clinical_text_parts)

    if full_text.strip():
        documents.append({
            "document_id": "ENTITIES-001",
            "document_name": "Extracted Clinical Entities",
            "document_type": "extracted_entities",
            "text": full_text.strip(),
        })

    # Also add raw clinical text if available
    full_clinical_text = extracted_entities.get("full_clinical_text", "")
    if full_clinical_text and full_clinical_text.strip():
        documents.append({
            "document_id": "RAW-001",
            "document_name": "Raw Clinical Text",
            "document_type": "clinical_note",
            "text": full_clinical_text.strip(),
        })

    return {
        "request_id": request_id,
        "documents": documents,
    }
