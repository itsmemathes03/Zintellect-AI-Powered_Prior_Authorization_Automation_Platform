"""
Contradiction Detection Routes (Phase 1)

Provides:
  POST /api/contradictions/detect — detect contradictions across clinical documents
  POST /api/contradictions/detect/{request_id} — detect contradictions for a PA request

This is a READ-ONLY, SUPPLEMENTARY feature. It does NOT approve, reject,
or override any PA request. It returns contradiction analysis results
for human review.

The existing PA workflow (policy_matcher, ai_service, xai_service, HITL)
is completely unaffected.
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.models.request_model import PriorAuthRequest
from app.services.auth_middleware import require_role
from app.services.contradiction_detection.models import (
    ContradictionDetectionRequest,
    ContradictionDetectionResponse,
)
from app.services.contradiction_detection.detector import detect_contradictions
from app.services.contradiction_detection.adapter import adapt_zintellect_request
from app.services.n8n_event_emitter import emit_event, Events

router = APIRouter(prefix="/api/contradictions", tags=["Contradiction Detection"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================================
# DETECT CONTRADICTIONS FOR A PA REQUEST
# ==========================================================================


@router.post("/detect/{request_id}")
def detect_for_pa_request(
    request_id: str,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    """
    Detect contradictions across clinical documents for an existing PA request.

    Uses the actual clinical notes and uploaded file metadata from the PA request.
    Returns structured contradiction analysis for human review.

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
        raise HTTPException(status_code=404, detail="PA request not found")

    # ---- Parse uploaded files metadata ----
    uploaded_files = []
    if req.uploaded_files:
        try:
            uploaded_files = json.loads(req.uploaded_files)
        except (json.JSONDecodeError, TypeError):
            uploaded_files = []

    # ---- Parse clinical notes ----
    clinical_notes = req.clinical_notes or ""
    if not clinical_notes.strip():
        raise HTTPException(
            status_code=400,
            detail="PA request has no clinical notes for contradiction analysis"
        )

    # ---- Adapt to contradiction detection input ----
    adapter_input = adapt_zintellect_request(
        request_id=request_id,
        clinical_notes=clinical_notes,
        diagnosis=req.diagnosis or "",
        procedure_code=req.procedure_code or "",
        uploaded_files=uploaded_files if uploaded_files else None,
    )

    # ---- Validate we have at least 2 documents ----
    if len(adapter_input.get("documents", [])) < 2:
        # Single document — contradiction detection needs at least 2
        # Return a clear "no contradiction" result
        from app.services.contradiction_detection.models import Summary
        return {
            "status": "Success",
            "request_id": request_id,
            "contradiction_analysis": {
                "request_id": request_id,
                "status": "no_contradiction_detected",
                "contradictions": [],
                "summary": {
                    "documents_analyzed": len(adapter_input.get("documents", [])),
                    "contradictions_detected": 0,
                },
                "note": "Contradiction detection requires at least 2 clinical documents. "
                        "Only 1 document was available for this request.",
            },
        }

    # ---- Run contradiction detection ----
    try:
        detection_request = ContradictionDetectionRequest(**adapter_input)
        result = detect_contradictions(detection_request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Contradiction detection failed: {str(e)}"
        )

    # --- n8n: contradiction_detected (only when real contradictions exist) ---
    result_dump = result.model_dump()
    contradictions = result_dump.get("contradictions", [])
    if contradictions and len(contradictions) > 0:
        emit_event(
            event=Events.CONTRADICTION_DETECTED,
            entity_type="prior_authorization",
            entity_id=request_id,
            request_id=request_id,
            status="contradiction_found",
            actor_role="system",
            extra={
                "contradiction_count": len(contradictions),
            },
        )

    # ---- Return result (read-only, no state mutation) ----
    return {
        "status": "Success",
        "request_id": request_id,
        "contradiction_analysis": result_dump,
    }


# ==========================================================================
# DETECT CONTRADICTIONS FROM RAW INPUT
# ==========================================================================


@router.post("/detect")
def detect_from_input(
    request: ContradictionDetectionRequest,
    payload: dict = Depends(require_role("provider")),
):
    """
    Detect contradictions across clinical documents provided directly.

    Accepts a ContradictionDetectionRequest with pre-extracted document text.
    Returns structured contradiction analysis for human review.

    This endpoint is READ-ONLY and does NOT modify any PA request,
    authorization recommendation, or any existing workflow state.

    Confidence scores are ENGINEERING CONFIDENCE estimates, NOT clinical
    or diagnostic judgments.
    """

    # ---- Validate minimum documents ----
    if len(request.documents) < 2:
        return {
            "status": "Success",
            "contradiction_analysis": {
                "request_id": request.request_id,
                "status": "no_contradiction_detected",
                "contradictions": [],
                "summary": {
                    "documents_analyzed": len(request.documents),
                    "contradictions_detected": 0,
                },
                "note": "Contradiction detection requires at least 2 clinical documents.",
            },
        }

    # ---- Run contradiction detection ----
    try:
        result = detect_contradictions(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Contradiction detection failed: {str(e)}"
        )

    return {
        "status": "Success",
        "contradiction_analysis": result.model_dump(),
    }
