from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import Dict, Any
from ..services.evidence_extraction.service import EvidenceExtractionService, create_evidence_extraction_service
from ..services.evidence_extraction.schemas import EvidenceExtractionRequest, EvidenceExtractionResponse
from ..services.auth_middleware import verify_jwt_token
from app.services.n8n_event_emitter import emit_event, Events

router = APIRouter(
    prefix="/api/evidence-extraction",
    tags=["evidence-extraction"],
)

@router.post("/extract", response_model=EvidenceExtractionResponse)
async def extract_evidence(
    request: EvidenceExtractionRequest,
    service: EvidenceExtractionService = Depends(create_evidence_extraction_service),
    payload: dict = Depends(verify_jwt_token),
):
    """
    Extract evidence from a document.

    Returns 404 if the document does not exist.  Unknown documents must
    NOT be treated as genuine medical evidence.
    """
    try:
        result = await service.extract_evidence(request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    # --- n8n: evidence_extraction_completed ---
    emit_event(
        event=Events.EVIDENCE_EXTRACTION_COMPLETED,
        entity_type="prior_authorization",
        entity_id=request.document_id,
        status="completed",
        actor_role="system",
        extra={},
    )

    return result