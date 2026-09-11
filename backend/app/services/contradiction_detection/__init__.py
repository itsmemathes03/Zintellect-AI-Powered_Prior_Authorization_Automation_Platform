"""
Contradiction Detection Service

Standalone backend analysis service for detecting contradictions
across clinical documents in the Prior Authorization workflow.

This is an ANALYSIS capability only. It does NOT:
- Approve, reject, or deny PA requests
- Modify authorization decisions
- Replace RAG, policy matching, or evidence traceability
- Persist data (stateless in Phase 1)

Usage:
    from app.services.contradiction_detection import detect_contradictions, adapt_zintellect_request
"""

from .detector import detect_contradictions, ContradictionDetector
from .adapter import adapt_zintellect_request
from .models import (
    ClinicalDocument,
    ContradictionDetectionRequest,
    ContradictionDetectionResponse,
)

__all__ = [
    "detect_contradictions",
    "ContradictionDetector",
    "adapt_zintellect_request",
    "ClinicalDocument",
    "ContradictionDetectionRequest",
    "ContradictionDetectionResponse",
]
