from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChangeType(str, Enum):
    ADDED = "ADDED"
    REMOVED = "REMOVED"
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"


class RequirementChange(BaseModel):
    requirement_id: str
    change_type: ChangeType
    old_text: Optional[str] = None
    new_text: Optional[str] = None
    section: Optional[str] = None  # e.g., "documentation", "clinical_criteria"


class PolicyVersionInfo(BaseModel):
    policy_id: str
    version: str
    effective_date: datetime
    payer: str
    procedure: str
    requirements: List[str]  # List of requirement texts
    requirement_map: Dict[str, str]  # requirement_id -> requirement_text


class PolicyComparisonResult(BaseModel):
    policy_id: str
    payer: str
    procedure: str
    base_version: str
    compared_version: str
    base_effective_date: datetime
    compared_effective_date: datetime
    changes: List[RequirementChange]
    summary: Dict[str, Any]  # Summary statistics
    impact_assessment: str  # High-level impact description