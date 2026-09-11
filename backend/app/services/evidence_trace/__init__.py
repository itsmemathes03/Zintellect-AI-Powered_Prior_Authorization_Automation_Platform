"""Evidence-to-Policy Traceability Module."""

__version__ = "1.0.0"
__author__ = "Zintellect AI"
__description__ = "Standalone evidence-to-policy traceability module for healthcare prior authorization systems"

from .service import process_evidence_trace, process_evidence_trace_with_config
from .zintellect_adapter import adapt_zintellect_request
from .schemas import (
    EvidenceToPolicyInput,
    EvidenceToPolicyOutput,
    EvidenceItem,
    PolicyRequirement,
    MatchStatus,
    EvidenceMatch,
    RequirementResult,
    SummaryStatistics
)

__all__ = [
    "process_evidence_trace",
    "process_evidence_trace_with_config",
    "EvidenceToPolicyInput",
    "EvidenceToPolicyOutput",
    "EvidenceItem",
    "PolicyRequirement",
    "MatchStatus",
    "EvidenceMatch",
    "RequirementResult",
    "SummaryStatistics",
    "__version__"
]
