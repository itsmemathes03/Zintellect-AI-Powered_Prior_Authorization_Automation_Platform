from pydantic import BaseModel
from typing import List, Optional
from .models import DocumentQualityStatus, DocumentQualityResult


class DocumentQualityCheckRequest(BaseModel):
    document_id: str
    # In a real implementation, this might contain file data or reference to stored file
    # For now, we'll assume the document is accessible via the document_id


class DocumentQualityCheckResponse(BaseModel):
    document_id: str
    document_name: str
    quality_status: DocumentQualityStatus
    overall_quality: float
    ocr_quality: Optional[float] = None
    page_count: int
    blank_pages: List[int]
    possible_missing_pages: List[int]
    duplicate_status: str
    detected_document_type: str
    warnings: List[str]
    recommended_action: str