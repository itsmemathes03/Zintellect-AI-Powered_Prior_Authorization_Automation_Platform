from enum import Enum
from pydantic import BaseModel
from typing import List, Optional


class DocumentQualityStatus(str, Enum):
    GOOD = "GOOD"
    WARNING = "WARNING"
    FAIL = "FAIL"


class PageCheckResult(BaseModel):
    page_number: int
    is_blank: bool
    ocr_confidence: Optional[float] = None
    is_readable: bool


class DocumentQualityResult(BaseModel):
    document_id: str
    document_name: str
    quality_status: DocumentQualityStatus
    overall_quality: float  # score from 0 to 100
    ocr_quality: Optional[float] = None  # average OCR confidence across pages
    page_count: int
    blank_pages: List[int]  # list of page numbers that are blank
    possible_missing_pages: List[int]  # list of page numbers that are missing (if we can detect)
    duplicate_status: str  # e.g., "UNIQUE", "DUPLICATE", "NEAR_DUPLICATE"
    detected_document_type: str
    warnings: List[str]
    recommended_action: str