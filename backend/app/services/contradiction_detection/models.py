"""
Pydantic schemas for contradiction detection.

Adapted from the standalone contradiction_detection module.
Preserves the original detection methodology and output contract.
"""

from pydantic import BaseModel, Field
from typing import List, Literal
from enum import Enum


class ClinicalDocument(BaseModel):
    """
    Represents a clinical document with extracted text.
    This module does not perform OCR — text should be pre-extracted.
    """
    document_id: str = Field(..., description="Unique identifier for the document")
    document_name: str = Field(..., description="Human-readable name of the document")
    document_type: str = Field(..., description="Type of document (e.g., 'clinical_note', 'lab_report')")
    text: str = Field(..., description="Extracted text content of the document")


class ContradictionDetectionRequest(BaseModel):
    """
    Request to detect contradictions across multiple clinical documents.
    """
    request_id: str = Field(..., description="Unique identifier for this detection request")
    documents: List[ClinicalDocument] = Field(..., description="List of clinical documents to analyze")


class StatementRef(BaseModel):
    """
    Reference to a specific statement within a document that participates in a contradiction.
    """
    document_id: str = Field(..., description="ID of the document containing the statement")
    document_name: str = Field(..., description="Name of the document containing the statement")
    text: str = Field(..., description="Exact text of the statement as it appears in the document")


class Contradiction(BaseModel):
    """
    Represents a detected contradiction between two statements in different documents.
    """
    topic: str = Field(..., description="Clinical topic or entity that the contradiction concerns")
    severity: Literal["low", "medium", "high"] = Field(..., description="Severity level of the contradiction")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="ENGINEERING confidence score (0.0-1.0) derived from rule/model agreement, "
                    "NOT a clinical or diagnostic judgment. Higher scores indicate stronger evidence "
                    "of contradiction based on the detection pipeline."
    )
    statement_a: StatementRef = Field(..., description="First contradictory statement")
    statement_b: StatementRef = Field(..., description="Second contradictory statement")
    explanation: str = Field(..., description="Human-readable explanation of why these statements contradict")


class Summary(BaseModel):
    """
    Summary statistics of the contradiction detection analysis.
    """
    documents_analyzed: int = Field(..., description="Number of documents analyzed in this request")
    contradictions_detected: int = Field(..., description="Number of contradictions detected")


class ContradictionDetectionResponse(BaseModel):
    """
    Response containing the results of contradiction detection across clinical documents.
    """
    request_id: str = Field(..., description="Echo of the request ID from the input")
    status: Literal["contradiction_detected", "no_contradiction_detected", "uncertain"] = Field(
        ...,
        description="Overall status of the contradiction detection"
    )
    contradictions: List[Contradiction] = Field(
        default_factory=list,
        description="List of detected contradictions (empty if status is no_contradiction_detected or uncertain)"
    )
    summary: Summary = Field(..., description="Summary statistics of the analysis")
