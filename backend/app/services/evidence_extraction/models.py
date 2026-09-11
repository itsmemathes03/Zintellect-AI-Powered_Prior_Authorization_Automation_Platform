"""
Data models for the Evidence Extraction service.
"""
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class EvidenceType(str, Enum):
    """Types of evidence that can be extracted."""
    ICD_CODE = "ICD_CODE"
    CPT_CODE = "CPT_CODE"
    HCPCS_CODE = "HCPCS_CODE"
    MEDICATION = "MEDICATION"
    LAB_RESULT = "LAB_RESULT"
    VITAL_SIGN = "VITAL_SIGN"
    CLINICAL_NOTE = "CLINICAL_NOTE"
    IMAGING_REPORT = "IMAGING_REPORT"
    PATHOLOGY_REPORT = "PATHOLOGY_REPORT"
    OTHER = "OTHER"


class ExtractedEvidence(BaseModel):
    """A piece of evidence extracted from a document."""
    evidence_id: str
    evidence_type: EvidenceType
    value: str
    confidence: float  # 0.0 to 1.0
    location: Optional[Dict[str, Any]] = None  # e.g., page number, bounding box
    metadata: Optional[Dict[str, Any]] = None


class ExtractionResult(BaseModel):
    """Result of extracting evidence from a document."""
    document_id: str
    document_name: str
    extracted_evidence: List[ExtractedEvidence]
    extraction_timestamp: datetime
    overall_confidence: float  # Average confidence of all extracted evidence
    total_evidence_count: int
    evidence_by_type: Dict[str, int]  # Count of each evidence type