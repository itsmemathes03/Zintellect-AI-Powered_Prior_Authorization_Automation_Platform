"""
API schemas for the Request Prioritization service.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .models import PriorityLevel, RiskFactor, PrioritizationInput, RiskAssessment, PrioritizationResult
from datetime import datetime


class PrioritizationRequest(BaseModel):
    """Request to prioritize a PA request."""
    request_id: str
    patient_id: str
    provider_id: str
    procedure_code: str
    procedure_name: str
    urgency_indication: Optional[str] = None
    clinical_information: Optional[str] = None
    requested_service_date: Optional[datetime] = None
    insurance_info: Optional[Dict[str, Any]] = None
    # Additional fields can be added as needed


class PrioritizationResponse(BaseModel):
    """Response from prioritizing a PA request."""
    request_id: str
    priority_level: str  # We'll use string for simplicity in API, but we can also use the enum
    priority_score: float
    risk_assessments: List[Dict[str, Any]]  # List of risk assessments as dicts
    recommended_action: str
    estimated_processing_time: Optional[int] = None
    sla_deadline: Optional[datetime] = None
    assessment_timestamp: datetime