"""
Data models for the Evidence-to-Policy Traceability module.
Contains any domain-specific models beyond the schemas.
"""

from typing import List, Optional
from .schemas import EvidenceItem, PolicyRequirement, MatchStatus


class PolicyRequirements:
    """Container for policy requirements with helper methods."""

    def __init__(self, requirements: List[PolicyRequirement]):
        self.requirements = requirements

    def get_by_id(self, requirement_id: str) -> Optional[PolicyRequirement]:
        """Get a requirement by its ID."""
        for req in self.requirements:
            if req.requirement_id == requirement_id:
                return req
        return None

    def __len__(self) -> int:
        return len(self.requirements)

    def __iter__(self):
        return iter(self.requirements)


class ClinicalEvidence:
    """Container for clinical evidence with helper methods."""

    def __init__(self, evidence_items: List[EvidenceItem]):
        self.evidence_items = evidence_items

    def get_by_id(self, evidence_id: str) -> Optional[EvidenceItem]:
        """Get evidence by its ID."""
        for evidence in self.evidence_items:
            if evidence.evidence_id == evidence_id:
                return evidence
        return None

    def filter_by_entity_type(self, entity_type: str) -> List[EvidenceItem]:
        """Filter evidence by entity type."""
        return [e for e in self.evidence_items if e.entity_type == entity_type]

    def __len__(self) -> int:
        return len(self.evidence_items)

    def __iter__(self):
        return iter(self.evidence_items)