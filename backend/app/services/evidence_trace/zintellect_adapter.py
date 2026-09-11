"""
Zintellect-specific adapter for the Evidence-to-Policy Traceability module.

Maps existing Zintellect PriorAuthRequest + InsurancePolicy + extracted entities
into the evidence_trace module's input schema.

Uses ACTUAL Zintellect identifiers (policy IDs, versions, request IDs).
Does NOT invent POL-{request_id} or fake document IDs.
"""

import json
from typing import Dict, Any, List, Optional


def adapt_zintellect_request(
    request_id: str,
    policy: Any,
    extracted_entities: Dict[str, Any],
    uploaded_document_types: List[str],
    policy_rules: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Adapt an existing Zintellect PA request into evidence_trace module input.

    Uses real Zintellect identifiers:
    - Actual PriorAuthRequest.id as request_id
    - Actual InsurancePolicy.id as policy.policy_id
    - Actual InsurancePolicy.version as policy.version
    - Actual required_documents / required_conditions / required_evidence
    - Actual extracted clinical entities (diagnosis, symptoms, treatment_history)
    - Actual uploaded document type names as document references

    Args:
        request_id: The actual PriorAuthRequest.id
        policy: The actual InsurancePolicy SQLAlchemy object (or None)
        extracted_entities: Output from ai_service.extract_medical_entities()
        uploaded_document_types: List of classified document type strings
        policy_rules: Output from policy_loader.load_policy()

    Returns:
        Dictionary matching EvidenceToPolicyInput schema
    """
    # ---- Policy metadata (real identifiers) ----
    # Prefer actual InsurancePolicy object; fall back to policy_rules
    policy_id = "unknown"
    policy_version = "1.0"
    if policy is not None:
        policy_id = str(policy.id) if hasattr(policy, 'id') else str(policy.get('policy_id', 'unknown'))
        policy_version = str(policy.version) if hasattr(policy, 'version') else str(policy.get('version', '1.0'))
    else:
        # Fall back to policy_rules (which mirrors InsurancePolicy fields)
        policy_id = str(policy_rules.get('policy_id', 'unknown'))
        policy_version = str(policy_rules.get('version', '1.0'))

    procedure = policy_rules.get('procedure', '')

    # ---- Build requirements from policy_rules ----
    requirements = []
    req_counter = 0

    # required_documents → documentation-type requirements
    required_docs = policy_rules.get('required_documents', [])
    if isinstance(required_docs, str):
        try:
            required_docs = json.loads(required_docs)
        except (json.JSONDecodeError, TypeError):
            required_docs = []
    for doc in required_docs:
        doc_str = str(doc).strip()
        if doc_str and doc_str != '[]':
            requirements.append({
                'requirement_id': f'REQ-DOC-{req_counter:03d}',
                'description': f"Required documentation: {doc_str}",
                'type': 'documentation',
                'weight': 1.0,
                'source_field': 'required_documents',
            })
            req_counter += 1

    # required_conditions → clinical-condition requirements
    required_conds = policy_rules.get('required_conditions', [])
    if isinstance(required_conds, str):
        try:
            required_conds = json.loads(required_conds)
        except (json.JSONDecodeError, TypeError):
            required_conds = []
    for cond in required_conds:
        cond_str = str(cond).strip()
        if cond_str and cond_str != '[]':
            requirements.append({
                'requirement_id': f'REQ-COND-{req_counter:03d}',
                'description': f"Required clinical condition: {cond_str}",
                'type': 'condition',
                'weight': 1.0,
                'source_field': 'required_conditions',
            })
            req_counter += 1

    # required_evidence → evidence-pattern requirements (if present)
    required_ev = policy_rules.get('required_evidence', [])
    if isinstance(required_ev, list):
        for ev_rule in required_ev:
            label = ev_rule.get('label', 'unknown evidence')
            mandatory = ev_rule.get('mandatory', True)
            requirements.append({
                'requirement_id': f'REQ-EV-{req_counter:03d}',
                'description': f"Required evidence: {label}" + (" (mandatory)" if mandatory else " (conditional)"),
                'type': 'evidence',
                'weight': 1.0 if mandatory else 0.5,
                'source_field': 'required_evidence',
            })
            req_counter += 1

    # ---- Build clinical evidence from extracted entities ----
    clinical_evidence = []
    ev_counter = 0

    diagnosis = str(extracted_entities.get('diagnosis', '')).strip()
    if diagnosis:
        clinical_evidence.append({
            'evidence_id': f'E-DX-{ev_counter:03d}',
            'text': diagnosis,
            'document_id': 'extracted_entities',
            'document_name': 'clinical_extraction',
            'page': None,
            'section': 'diagnosis',
            'entity_type': 'diagnosis',
            'entity_value': diagnosis.lower(),
            'confidence': 0.9,
        })
        ev_counter += 1

    symptoms = extracted_entities.get('symptoms', [])
    if isinstance(symptoms, str):
        symptoms = [symptoms] if symptoms else []
    for sym in symptoms:
        sym_str = str(sym).strip()
        if sym_str:
            clinical_evidence.append({
                'evidence_id': f'E-SYM-{ev_counter:03d}',
                'text': sym_str,
                'document_id': 'extracted_entities',
                'document_name': 'clinical_extraction',
                'page': None,
                'section': 'symptoms',
                'entity_type': 'symptom',
                'entity_value': sym_str.lower(),
                'confidence': 0.85,
            })
            ev_counter += 1

    treatment_history = extracted_entities.get('treatment_history', {})
    if isinstance(treatment_history, dict):
        pt = treatment_history.get('physical_therapy', {})
        if isinstance(pt, dict):
            pt_duration = str(pt.get('duration', '')).strip()
            pt_outcome = str(pt.get('outcome', '')).strip()
            pt_exercises = pt.get('exercises', [])
            if pt_duration or pt_outcome:
                pt_text = f"Physical therapy: duration={pt_duration}, outcome={pt_outcome}"
                if pt_exercises:
                    pt_text += f", exercises={', '.join(str(e) for e in pt_exercises)}"
                clinical_evidence.append({
                    'evidence_id': f'E-PT-{ev_counter:03d}',
                    'text': pt_text,
                    'document_id': 'extracted_entities',
                    'document_name': 'clinical_extraction',
                    'page': None,
                    'section': 'treatment_history.physical_therapy',
                    'entity_type': 'treatment',
                    'entity_value': 'physical therapy',
                    'confidence': 0.85,
                })
                ev_counter += 1
    elif isinstance(treatment_history, str) and treatment_history.strip():
        clinical_evidence.append({
            'evidence_id': f'E-TH-{ev_counter:03d}',
            'text': treatment_history.strip(),
            'document_id': 'extracted_entities',
            'document_name': 'clinical_extraction',
            'page': None,
            'section': 'treatment_history',
            'entity_type': 'treatment',
            'entity_value': 'treatment history',
            'confidence': 0.8,
        })
        ev_counter += 1

    medications = extracted_entities.get('medications', [])
    if isinstance(medications, str):
        medications = [medications] if medications else []
    for med in medications:
        med_str = str(med).strip()
        if med_str:
            clinical_evidence.append({
                'evidence_id': f'E-MED-{ev_counter:03d}',
                'text': med_str,
                'document_id': 'extracted_entities',
                'document_name': 'clinical_extraction',
                'page': None,
                'section': 'medications',
                'entity_type': 'medication',
                'entity_value': med_str.lower(),
                'confidence': 0.85,
            })
            ev_counter += 1

    procedure_requested = str(extracted_entities.get('procedure_requested', '')).strip()
    if procedure_requested:
        clinical_evidence.append({
            'evidence_id': f'E-PROC-{ev_counter:03d}',
            'text': f"Procedure requested: {procedure_requested}",
            'document_id': 'extracted_entities',
            'document_name': 'clinical_extraction',
            'page': None,
            'section': 'procedure_requested',
            'entity_type': 'procedure',
            'entity_value': procedure_requested.lower(),
            'confidence': 0.9,
        })
        ev_counter += 1

    # ---- Add uploaded document types as evidence references ----
    # Normalize filenames to snake_case labels that match policy
    # requirement language (e.g. "05_Lab_Results.pdf" → "lab_results").
    for doc_type in uploaded_document_types:
        if doc_type and doc_type.strip():
            # Strip number prefix, extension, convert to snake_case
            import re as _re
            normalized = doc_type.strip()
            # Remove leading numeric prefix like "01_", "05_"
            normalized = _re.sub(r'^\d+_\s*', '', normalized)
            # Remove file extension
            normalized = _re.sub(r'\.[^.]+$', '', normalized)
            # Convert CamelCase/PascalCase to snake_case
            normalized = _re.sub(r'([a-z])([A-Z])', r'\1_\2', normalized)
            normalized = normalized.replace('-', '_').replace(' ', '_').lower()
            normalized = _re.sub(r'_+', '_', normalized).strip('_')

            clinical_evidence.append({
                'evidence_id': f'E-DOC-{ev_counter:03d}',
                'text': f"Uploaded document type: {normalized}",
                'document_id': f'doc_type_{normalized}',
                'document_name': doc_type,
                'page': None,
                'section': 'uploaded_document',
                'entity_type': 'document_type',
                'entity_value': normalized,
                'confidence': 1.0,
            })
            ev_counter += 1

    # ---- Construct final input ----
    input_data = {
        'request_id': request_id,
        'procedure': procedure,
        'policy': {
            'policy_id': policy_id,
            'version': policy_version,
            'requirements': requirements,
        },
        'clinical_evidence': clinical_evidence,
    }

    return input_data
