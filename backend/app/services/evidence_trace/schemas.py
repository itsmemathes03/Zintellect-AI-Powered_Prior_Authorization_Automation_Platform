"""
Schema definitions for the Evidence-to-Policy Traceability module.
Defines input and output data structures using Pydantic models.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class MatchStatus(str, Enum):
    """Status of evidence matching for a policy requirement."""
    MATCHED = "matched"
    MISSING = "missing"
    UNCERTAIN = "uncertain"
    CONTRADICTED = "contradicted"


class EvidenceItem(BaseModel):
    """Represents a piece of clinical evidence extracted from documents."""
    evidence_id: str = Field(..., description="Unique identifier for the evidence")
    text: str = Field(..., description="The actual evidence text")
    document_id: str = Field(..., description="Identifier of the source document")
    document_name: str = Field(..., description="Name of the source document")
    page: Optional[int] = Field(None, description="Page number where evidence was found")
    section: Optional[str] = Field(None, description="Section or subsection where evidence was found")
    entity_type: Optional[str] = Field(None, description="Type of medical entity (symptom, condition, procedure, etc.)")
    entity_value: Optional[str] = Field(None, description="Normalized value of the medical entity")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the evidence extraction (0-1)")


class PolicyRequirement(BaseModel):
    """Represents a single requirement from an insurance policy."""
    requirement_id: str = Field(..., description="Unique identifier for the requirement")
    description: str = Field(..., description="Description of the requirement")
    type: Optional[str] = Field(None, description="Type of requirement (condition, documentation, etc.)")
    weight: Optional[float] = Field(1.0, ge=0.0, le=1.0, description="Weight/importance of the requirement")


class EvidenceToPolicyInput(BaseModel):
    """Input schema for the Evidence-to-Policy Traceability module."""
    request_id: str = Field(..., description="Unique identifier for the prior authorization request")
    procedure: Optional[str] = Field(None, description="Medical procedure being authorized")
    policy: Dict[str, Any] = Field(..., description="Policy information including requirements")
    clinical_evidence: List[EvidenceItem] = Field(default_factory=list, description="List of extracted clinical evidence")


class EvidenceMatch(BaseModel):
    """Represents evidence that supports a policy requirement."""
    evidence_id: str = Field(..., description="Unique identifier for the evidence")
    text: str = Field(..., description="The actual evidence text")
    document_id: str = Field(..., description="Identifier of the source document")
    document_name: str = Field(..., description="Name of the source document")
    page: Optional[int] = Field(None, description="Page number where evidence was found")
    section: Optional[str] = Field(None, description="Section or subsection where evidence was found")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the evidence")


class RequirementResult(BaseModel):
    """Result for a single policy requirement after evidence matching."""
    requirement_id: str = Field(..., description="Unique identifier for the requirement")
    requirement: str = Field(..., description="Description of the requirement")
    status: MatchStatus = Field(..., description="Match status (matched, missing, uncertain, contradicted)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the match decision (0-1)")
    evidence: List[EvidenceMatch] = Field(default_factory=list, description="List of supporting evidence")
    explanation: str = Field(..., description="Human-readable explanation of the matching decision")


class SummaryStatistics(BaseModel):
    """Summary statistics for the evidence-to-policy traceability results."""
    total_requirements: int = Field(..., ge=0, description="Total number of policy requirements")
    matched: int = Field(..., ge=0, description="Number of requirements matched with evidence")
    missing: int = Field(..., ge=0, description="Number of requirements with missing evidence")
    uncertain: int = Field(..., ge=0, description="Number of requirements with uncertain evidence")
    contradicted: int = Field(..., ge=0, description="Number of requirements with contradictory evidence")


class EvidenceToPolicyOutput(BaseModel):
    """Output schema for the Evidence-to-Policy Traceability module."""
    request_id: str = Field(..., description="Unique identifier for the prior authorization request")
    feature: str = Field(default="evidence_to_policy_trace", description="Identifier for this feature")
    results: List[RequirementResult] = Field(..., description="Results for each policy requirement")
    summary: SummaryStatistics = Field(..., description="Summary statistics of the matching process")
