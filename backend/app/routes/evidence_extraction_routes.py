from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import Dict, Any
from ..services.evidence_extraction.service import EvidenceExtractionService, create_evidence_extraction_service
from ..services.evidence_extraction.schemas import EvidenceExtractionRequest, EvidenceExtractionResponse

# Placeholder for authentication and RBAC dependencies
async def get_current_user():
    # Placeholder: in reality, this would validate the token and return user info
    return {"user_id": "placeholder", "roles": ["provider", "admin"]}

router = APIRouter(
    prefix="/api/evidence-extraction",
    tags=["evidence-extraction"],
    dependencies=[Depends(get_current_user)]  # All routes require authentication
)

@router.post("/extract", response_model=EvidenceExtractionResponse)
async def extract_evidence(
    request: EvidenceExtractionRequest,
    service: EvidenceExtractionService = Depends(create_evidence_extraction_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Extract evidence from a document.
    """
    result = await service.extract_evidence(request)
    return result