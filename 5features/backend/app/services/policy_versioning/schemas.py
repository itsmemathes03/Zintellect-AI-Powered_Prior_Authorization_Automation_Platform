from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .models import PolicyVersionInfo, PolicyComparisonResult, ChangeType, RequirementChange


class PolicyVersionCreateRequest(BaseModel):
    policy_id: str
    version: str
    effective_date: str  # ISO format date string
    payer: str
    procedure: str
    requirements: List[str]


class PolicyVersionResponse(BaseModel):
    policy_id: str
    version: str
    effective_date: str
    payer: str
    procedure: str
    requirements: List[str]


class PolicyComparisonRequest(BaseModel):
    policy_id: str
    base_version: str
    compared_version: str


class PolicyComparisonResponse(BaseModel):
    policy_id: str
    payer: str
    procedure: str
    base_version: str
    compared_version: str
    base_effective_date: str
    compared_effective_date: str
    changes: List[Dict[str, Any]]
    summary: Dict[str, Any]
    impact_assessment: str


class PolicyVersionsResponse(BaseModel):
    policy_id: str
    versions: List[PolicyVersionResponse]