"""
Human-in-the-Loop Review Routes (HCI-03)

Provides:
  GET  /review/queue          — requests awaiting human review
  GET  /review/{request_id}   — review workspace for one request
  POST /review/{request_id}/decide — submit human decision

The AI recommendation is preserved in the HumanReview record and
in PriorAuthRequest.ai_recommendation.  The human decision does NOT
overwrite the AI recommendation.

n8n receives the final human decision ONLY (from this router), never
the AI recommendation.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.db import SessionLocal
from app.models.request_model import PriorAuthRequest
from app.models.review_model import HumanReview
from app.models.enums import RequestStatus
from app.services.auth_middleware import require_role
from app.services.audit_service import create_audit_log
from app.services.n8n_service import notify_n8n
from app.services.n8n_event_emitter import emit_event, Events

router = APIRouter(prefix="/review", tags=["Review (HCI-03)"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================================
# REQUEST / RESPONSE MODELS
# ==========================================================================


class ReviewDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(Approved|Rejected|Request Info)$")
    notes: str | None = None


class ReviewQueueItem(BaseModel):
    id: str
    patient_name: str
    procedure_code: str
    diagnosis: str
    insurance_provider: str
    confidence_score: float
    ai_recommendation: str
    missing_documents: str | None
    created_at: str | None


class ReviewQueueResponse(BaseModel):
    items: list[ReviewQueueItem]
    total: int
    page: int
    page_size: int


# ==========================================================================
# REVIEW QUEUE
# ==========================================================================


@router.get("/queue")
def get_review_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    """
    Return requests with status "Awaiting Review" for the authenticated
    provider/insurance company.
    """
    provider_name = payload.get("name", "")

    query = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"),
            PriorAuthRequest.status == RequestStatus.AWAITING_REVIEW.value,
        )
        .order_by(desc(PriorAuthRequest.created_at))
    )

    total = query.count()
    items = (
        query.offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for r in items:
        result.append(
            ReviewQueueItem(
                id=r.id,
                patient_name=r.patient_name or "",
                procedure_code=r.procedure_code or "",
                diagnosis=r.diagnosis or "",
                insurance_provider=r.insurance_provider or "",
                confidence_score=r.confidence_score,
                ai_recommendation=r.ai_recommendation or "Unknown",
                missing_documents=r.missing_documents,
                created_at=r.created_at.isoformat() if r.created_at else None,
            )
        )

    return {
        "items": [i.model_dump() for i in result],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ==========================================================================
# REVIEW DETAIL
# ==========================================================================


@router.get("/{request_id}")
def get_review_detail(
    request_id: str,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    """
    Return the review workspace for a single request:
      - request information
      - uploaded documents
      - AI recommendation + evidence
      - existing clinical information
    """
    provider_name = payload.get("name", "")

    req = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.id == request_id,
            PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"),
        )
        .first()
    )

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != RequestStatus.AWAITING_REVIEW.value:
        raise HTTPException(
            status_code=400,
            detail=f"Request is not in Awaiting Review status (current status: {req.status}).",
        )

    return {
        "id": req.id,
        "patient_name": req.patient_name,
        "patient_id": req.patient_id,
        "doctor_name": req.doctor_name,
        "insurance_provider": req.insurance_provider,
        "diagnosis": req.diagnosis,
        "clinical_notes": req.clinical_notes,
        "procedure_code": req.procedure_code,
        "uploaded_files": req.uploaded_files,
        "urgency_level": req.urgency_level,
        "status": req.status,
        "confidence_score": req.confidence_score,
        "ai_recommendation": req.ai_recommendation,
        "xai_reasoning": req.xai_reasoning,
        "matched_policy_clause": req.matched_policy_clause,
        "missing_documents": req.missing_documents,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "updated_at": req.updated_at.isoformat() if req.updated_at else None,
    }


# ==========================================================================
# HUMAN DECISION
# ==========================================================================


@router.post("/{request_id}/decide")
def submit_human_decision(
    request_id: str,
    body: ReviewDecisionRequest,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    """
    Submit a human decision for a request in Awaiting Review.

    Approved  → request.status = "Approved"
    Rejected  → request.status = "Rejected"
    Request Info → request.status = "Pending Additional Information"

    A HumanReview record is created preserving the original AI
    recommendation, AI confidence, AI reasoning, matched policy, and
    missing documents.  The AI recommendation is NOT overwritten.

    An AuditLog entry is created.  n8n receives the final human decision
    via notify_n8n (the existing workflow is reused — no n8n changes).
    """
    provider_name = payload.get("name", "Insurance Provider")
    reviewer_id = payload.get("sub", "")
    reviewer_role = "provider"

    req = (
        db.query(PriorAuthRequest)
        .filter(PriorAuthRequest.id == request_id)
        .first()
    )

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != RequestStatus.AWAITING_REVIEW.value:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Request {request_id} is not in Awaiting Review status "
                f"(current status: {req.status}).  Only requests awaiting "
                f"human review can be decided here."
            ),
        )

    # Guard against double decision: if a HumanReview already exists for
    # this request, reject the duplicate.
    existing_review = (
        db.query(HumanReview)
        .filter(HumanReview.request_id == request_id)
        .first()
    )
    if existing_review:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Request {request_id} has already been reviewed "
                f"(human_decision: {existing_review.human_decision})."
            ),
        )

    # Map the human decision to the final request status.
    decision = body.decision
    if decision == "Approved":
        final_status = RequestStatus.APPROVED.value
    elif decision == "Rejected":
        final_status = RequestStatus.REJECTED.value
    elif decision == "Request Info":
        final_status = RequestStatus.PENDING_ADDITIONAL_INFO.value
    else:
        # Should never reach here due to the regex pattern on the model.
        raise HTTPException(status_code=400, detail="Invalid decision value.")

    # Create the HumanReview record — preserve the AI recommendation.
    review = HumanReview(
        request_id=request_id,
        reviewer_id=reviewer_id,
        reviewer_role=reviewer_role,
        ai_recommendation=req.ai_recommendation,
        ai_confidence_score=req.confidence_score,
        ai_xai_reasoning=req.xai_reasoning,
        ai_matched_policy_clause=req.matched_policy_clause,
        ai_missing_documents=req.missing_documents,
        human_decision=decision,
        review_notes=body.notes or "",
        reviewed_at=datetime.utcnow(),
    )
    db.add(review)

    # Update the request status to the final decision.
    req.status = final_status
    req.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(review)

    # AuditLog entry for the human decision (single rich entry).
    # n8n's _create_local_events creates a separate generic workflow
    # completion event — this is intentional and clearly distinct.
    audit_action = f"Human Review Decision: {decision}"
    audit_description = (
        f"Reviewer {reviewer_id} ({reviewer_role}) reviewed request "
        f"{request_id}.  AI recommended: {req.ai_recommendation} "
        f"(confidence: {req.confidence_score}).  "
        f"Human decision: {decision}."
    )
    if body.notes:
        audit_description += f"  Reviewer notes: {body.notes}."

    create_audit_log(
        request_id=request_id,
        action=audit_action,
        performed_by=reviewer_id,
        details=audit_description,
    )

    # Dispatch the FINAL n8n event — only after the human decision is
    # successfully persisted.  n8n handles:
    #   - External webhook dispatch (fire-and-forget)
    #   - Its own local Notification + AuditLog via _create_local_events
    #   - Patient/provider email via the n8n workflow
    # Do NOT send duplicate direct emails here — n8n is the single
    # final-decision notification/email path.

    # Map decision to specific event name
    if decision == "Approved":
        event_name = Events.PRIOR_AUTHORIZATION_APPROVED
    elif decision == "Rejected":
        event_name = Events.PRIOR_AUTHORIZATION_REJECTED
    else:
        event_name = Events.ADDITIONAL_INFORMATION_REQUESTED

    emit_event(
        event=event_name,
        entity_type="prior_authorization",
        entity_id=request_id,
        request_id=request_id,
        status=final_status,
        actor_role="provider",
        extra={
            "confidence_score": req.confidence_score,
            "insurance_provider": req.insurance_provider or "",
            "procedure_code": req.procedure_code or "",
            "provider_id": reviewer_id,
            "provider_name": provider_name,
            "reviewer_id": reviewer_id,
            "review_notes": body.notes or "",
        },
    )

    return {
        "status": "Success",
        "message": f"Request {decision}",
        "request_id": request_id,
        "human_decision": decision,
        "review_id": review.id,
    }
