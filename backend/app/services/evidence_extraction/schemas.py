"""
API schemas for the Evidence Extraction service.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .models import EvidenceType, ExtractedEvidence, ExtractionResult
from datetime import datetime


class EvidenceExtractionRequest(BaseModel):
    """Request to extract evidence from a document."""
    document_id: str
    # In a real system, we might have the document content or a reference to it.
    # For now, we assume the adapter will fetch the document content.
    # We can also include options for the extraction process.
    options: Optional[Dict[str, Any]] = None


class EvidenceExtractionResponse(BaseModel):
    """Response from extracting evidence from a document."""
    document_id: str
    document_name: str
    extracted_evidence: List[Dict[str, Any]]  # We'll use dict for flexibility in API
    extraction_timestamp: datetime
    overall_confidence: float
    total_evidence_count: int
    evidence_by_type: Dict[str, int]