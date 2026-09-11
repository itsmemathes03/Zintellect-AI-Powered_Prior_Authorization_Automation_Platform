"""
Evidence-to-Policy Traceability Routes (Phase 1)

Provides:
  GET  /api/evidence-trace/{request_id} — evidence-to-policy traceability for a PA request

This is a READ-ONLY, SUPPLEMENTARY feature. It does NOT approve, reject,
or override any PA request.  It returns per-requirement traceability
information computed dynamically from the existing PA request data.

The existing PA workflow (policy_matcher, ai_service, xai_service, HITL)
is completely unaffected.
"""

from fastapi import APIRouter, HTTPException, Depends, Query

from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.models.request_model import PriorAuthRequest
from app.models.policy_model import InsurancePolicy
from app.services.auth_middleware import require_role
from app.services.evidence_trace.service import process_evidence_trace
from app.services.evidence_trace.zintellect_adapter import adapt_zintellect_request

router = APIRouter(prefix="/api/evidence-trace", tags=["Evidence Traceability"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================================
# EVIDENCE-TO-POLICY TRACEABILITY
# ==========================================================================


@router.get("/{request_id}")
def get_evidence_trace(
    request_id: str,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    """
    Compute evidence-to-policy traceability for a completed PA request.

    Returns per-requirement matching results:
    - requirement_id, description, type
    - status (matched/missing/uncertain/contradicted)
    - confidence score
    - supporting evidence with source document, page, section
    - human-readable explanation
    - summary statistics

    This endpoint is READ-ONLY and does NOT modify the PA request,
    authorization recommendation, or any existing workflow state.
    """

    # ---- Look up the PA request ----
    req = (
        db.query(PriorAuthRequest)
        .filter(PriorAuthRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # ---- Look up the insurance policy ----
    # Use the most recent policy for this provider (any status).
    # Evidence traceability is supplementary and needs the policy
    # requirements regardless of approval status.
    policy = None
    if req.insurance_provider:
        from sqlalchemy import desc as _desc
        policy = (
            db.query(InsurancePolicy)
            .filter(
                InsurancePolicy.insurance_provider == req.insurance_provider,
            )
            .order_by(_desc(InsurancePolicy.created_at))
            .first()
        )

    # ---- Reconstruct extracted entities from stored fields ----
    # The request stores diagnosis, clinical_notes, procedure_code.
    # We reconstruct a minimal entity dict compatible with the adapter.
    extracted_entities = {
        "diagnosis": req.diagnosis or "",
        "symptoms": [],
        "medications": [],
        "treatment_history": {},
        "procedure_requested": req.procedure_code or "",
        "full_clinical_text": req.clinical_notes or "",
    }

    # Parse uploaded_files for document type references
    uploaded_document_types = []
    if req.uploaded_files:
        try:
            import json
            uploaded_document_types = json.loads(req.uploaded_files)
        except (json.JSONDecodeError, TypeError):
            uploaded_document_types = []

    # ---- Reconstruct policy_rules from the policy object ----
    policy_rules = {
        "procedure": policy.procedure_name if policy else req.procedure_code or "unknown",
        "policy_id": str(policy.id) if policy else "unknown",
        "version": str(policy.version) if policy else "1.0",
        "required_documents": [],
        "required_conditions": [],
        "required_evidence": [],
        "policy_text": policy.policy_text if policy else "",
        "match_score": 1.0 if policy else 0.0,
    }

    if policy:
        import json as _json
        try:
            policy_rules["required_documents"] = _json.loads(policy.required_documents) if policy.required_documents else []
        except (_json.JSONDecodeError, TypeError):
            policy_rules["required_documents"] = []
        try:
            policy_rules["required_conditions"] = _json.loads(policy.required_conditions) if policy.required_conditions else []
        except (_json.JSONDecodeError, TypeError):
            policy_rules["required_conditions"] = []

    # ---- Adapt to evidence_trace input format ----
    module_input = adapt_zintellect_request(
        request_id=request_id,
        policy=policy,
        extracted_entities=extracted_entities,
        uploaded_document_types=uploaded_document_types,
        policy_rules=policy_rules,
    )

    # ---- Process with evidence_trace engine ----
    result = process_evidence_trace(module_input)

    # ---- Return result (read-only, no state mutation) ----
    # Include policy metadata since the engine output doesn't echo it.
    result["policy_metadata"] = {
        "policy_id": module_input["policy"].get("policy_id", "unknown"),
        "version": module_input["policy"].get("version", "1.0"),
        "procedure": module_input.get("procedure", ""),
        "insurance_provider": req.insurance_provider or "",
    }
    return {
        "status": "Success",
        "request_id": request_id,
        "evidence_traceability": result,
    }
