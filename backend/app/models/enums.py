from enum import Enum


class RequestStatus(str, Enum):
    SUBMITTED = "Submitted"
    PROCESSING = "Processing"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    PENDING_ADDITIONAL_INFO = "Pending Additional Information"
    MANUAL_REVIEW = "Manual Review"
    AWAITING_REVIEW = "Awaiting Review"


class RequestDecision(str, Enum):
    """Final decision values a provider may set on a request."""

    APPROVED = "Approved"
    REJECTED = "Rejected"


class PolicyStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProcessingStage(str, Enum):
    PENDING = "Pending"
    UPLOAD = "Upload"
    OCR = "OCR"
    PHI = "PHI"
    CLASSIFICATION = "Classification"
    CHUNKING = "Chunking"
    EMBEDDING = "Embedding"
    RETRIEVAL = "Retrieval"
    RAG = "RAG"
    MATCHING = "Matching"
    SCORING = "Scoring"
    XAI = "XAI"
    COMPLETED = "Completed"
    FAILED = "Failed"


class UrgencyLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class DuplicateFlag(str, Enum):
    NONE = "None"
    DUPLICATE = "Duplicate"
    POTENTIAL_DUPLICATE = "Potential Duplicate"


class EmbeddingStatus(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class CoverageStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"


class NotificationType(str, Enum):
    REQUEST_SUBMITTED = "REQUEST_SUBMITTED"
    DOCUMENT_MISSING = "DOCUMENT_MISSING"
    AI_DECISION_READY = "AI_DECISION_READY"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SLA_WARNING = "SLA_WARNING"


class AuditStatus(str, Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    PROCESSING = "Processing"


class FileProcessingStatus(str, Enum):
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    DELETED = "Deleted"


class StageStatus(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
