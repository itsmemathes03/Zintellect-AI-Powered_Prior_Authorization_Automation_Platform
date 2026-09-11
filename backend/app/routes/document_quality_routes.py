from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import List, Optional
from ..services.document_quality.service import DocumentQualityService, create_document_quality_service
from ..services.document_quality.schemas import DocumentQualityCheckResponse
from ..services.document_quality.models import DocumentQualityResult
from ..services.auth_middleware import verify_jwt_token

# Placeholder for authentication and RBAC dependencies
# In a real implementation, these would be imported from the auth module
async def get_current_user(token: dict = Depends(verify_jwt_token)):
    # In reality, this would validate the token and return user info
    # For now, we'll extract user info from the token
    return {"user_id": token.get("sub", "placeholder"), "roles": token.get("roles", ["provider"])}

async def check_document_access(document_id: str, current_user: dict = Depends(get_current_user)):
    # Placeholder: in reality, this would check if the user has access to the document
    # For now, we'll allow access
    pass

router = APIRouter(
    prefix="/api/document-quality",
    tags=["document-quality"],
    dependencies=[Depends(get_current_user)]  # All routes require authentication
)


@router.post("/check/{request_id}", response_model=DocumentQualityCheckResponse)
async def check_document_quality(
    request_id: str = Path(..., description="The ID of the prior authorization request"),
    document_id: Optional[str] = None,
    service: DocumentQualityService = Depends(create_document_quality_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Run document quality check for a specific request.
    If document_id is not provided, it will check all documents in the request.
    For simplicity, we assume one document per request in this endpoint.
    In a batch scenario, we might have a different endpoint or use query parameters.
    """
    # In a real implementation, we would get the document_id from the request
    # For now, we'll use the request_id as the document_id for simplicity
    # In a real system, we would query the request to get associated documents
    if document_id is None:
        document_id = request_id

    # Perform the quality check
    result: DocumentQualityResult = await service.check_document_quality(
        document_id=document_id,
        request_id=request_id
    )

    # Convert to response model
    return DocumentQualityCheckResponse(
        document_id=result.document_id,
        document_name=result.document_name,
        quality_status=result.quality_status,
        overall_quality=result.overall_quality,
        ocr_quality=result.ocr_quality,
        page_count=result.page_count,
        blank_pages=result.blank_pages,
        possible_missing_pages=result.possible_missing_pages,
        duplicate_status=result.duplicate_status,
        detected_document_type=result.detected_document_type,
        warnings=result.warnings,
        recommended_action=result.recommended_action
    )


@router.get("/{request_id}", response_model=DocumentQualityCheckResponse)
async def get_document_quality(
    request_id: str = Path(..., description="The ID of the prior authorization request"),
    service: DocumentQualityService = Depends(create_document_quality_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Get the latest document quality check results for a request.
    """
    # In a real implementation, we would retrieve stored results
    # For now, we'll run a fresh check (same as POST)
    if request_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request ID is required"
        )

    # Perform the quality check
    result: DocumentQualityResult = await service.check_document_quality(
        document_id=request_id,
        request_id=request_id
    )

    # Convert to response model
    return DocumentQualityCheckResponse(
        document_id=result.document_id,
        document_name=result.document_name,
        quality_status=result.quality_status,
        overall_quality=result.overall_quality,
        ocr_quality=result.ocr_quality,
        page_count=result.page_count,
        blank_pages=result.blank_pages,
        possible_missing_pages=result.possible_missing_pages,
        duplicate_status=result.duplicate_status,
        detected_document_type=result.detected_document_type,
        warnings=result.warnings,
        recommended_action=result.recommended_action
    )