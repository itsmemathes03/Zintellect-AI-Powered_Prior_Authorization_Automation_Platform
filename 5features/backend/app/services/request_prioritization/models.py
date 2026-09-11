"""
Data models for the Request Prioritization service.
"""
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class PriorityLevel(str, Enum):
    """Priority levels for PA requests."""
    URGENT = "URGENT"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RiskFactor(str, Enum):
    """Types of risk factors that can affect prioritization."""
    PROCEDURE_COMPLEXITY = "PROCEDURE_COMPLEXITY"
    PATIENT_HISTORY = "PATIENT_HISTORY"
    PROVIDER_HISTORY = "PROVIDER_HISTORY"
    TIME_SENSITIVITY = "TIME_SENSITIVITY"
    RESOURCE_AVAILABILITY = "RESOURCE_AVAILABILITY"


class PrioritizationInput(BaseModel):
    """Input data for prioritizing a PA request."""
    request_id: str
    patient_id: str
    provider_id: str
    procedure_code: str
    procedure_name: str
    urgency_indication: Optional[str] = None  # From referring provider
    clinical_information: Optional[str] = None
    requested_service_date: Optional[datetime] = None
    insurance_info: Optional[Dict[str, Any]] = None


class RiskAssessment(BaseModel):
    """Assessment of risk factors for a request."""
    risk_factor: RiskFactor
    score: float  # 0.0 to 1.0, where 1.0 is highest risk
    description: str
    contributing_factors: Optional[List[str]] = None


class PrioritizationResult(BaseModel):
    """Result of prioritizing a PA request."""
    request_id: str
    priority_level: PriorityLevel
    priority_score: float  # 0.0 to 1.0, where 1.0 is highest priority
    risk_assessments: List[RiskAssessment]
    recommended_action: str
    estimated_processing_time: Optional[int] = None  # in hours
    sla_deadline: Optional[datetime] = None
    assessment_timestamp: datetime