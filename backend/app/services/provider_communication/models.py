"""
Data models for the Provider Communication service.
"""
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class CommunicationChannel(str, Enum):
    """Channels through which we can communicate with providers."""
    PORTAL = "PORTAL"
    EMAIL = "EMAIL"
    FAX = "FAX"
    SMS = "SMS"


class CommunicationStatus(str, Enum):
    """Status of a communication attempt."""
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    READ = "READ"  # For portal messages, if read by provider


class TemplateType(str, Enum):
    """Types of communication templates."""
    QUALITY_ISSUE = "QUALITY_ISSUE"
    MISSING_INFORMATION = "MISSING_INFORMATION"
    APPROVAL = "APPROVAL"
    DENIAL = "DENIAL"
    STATUS_UPDATE = "STATUS_UPDATE"
    REQUEST_FOR_CLARIFICATION = "REQUEST_FOR_CLARIFICATION"


class CommunicationTemplate(BaseModel):
    """A template for generating communications."""
    template_id: str
    template_type: TemplateType
    subject: str
    body: str
    channels: List[CommunicationChannel]  # Which channels this template can be used for
    variables: List[str]  # Variables that can be substituted in the template, e.g., [patient_name, procedure_name]


class CommunicationRecord(BaseModel):
    """A record of a communication attempt."""
    communication_id: str
    request_id: str
    provider_id: str
    template_used: Optional[str] = None  # template_id if a template was used
    channel: CommunicationChannel
    status: CommunicationStatus
    subject: str
    body: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class CommunicationRequest(BaseModel):
    """Request to send a communication to a provider."""
    request_id: str
    provider_id: str
    template_type: TemplateType
    channel: CommunicationChannel
    context: Dict[str, Any]  # Data to fill in the template, e.g., {"patient_name": "John Doe", "procedure_name": "Knee Replacement"}
    # Optional: specific template_id to use, otherwise we'll select one based on type and channel
    template_id: Optional[str] = None


class CommunicationResponse(BaseModel):
    """Response from sending a communication."""
    communication_id: str
    request_id: str
    provider_id: str
    channel: CommunicationChannel
    status: CommunicationStatus
    subject: str
    body: str
    sent_at: Optional[datetime] = None
    # We might not return the full body in the response for security, but for simplicity we do.