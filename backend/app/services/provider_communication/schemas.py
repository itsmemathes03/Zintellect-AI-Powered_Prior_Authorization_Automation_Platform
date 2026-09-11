"""
API schemas for the Provider Communication service.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .models import CommunicationChannel, CommunicationStatus, TemplateType, CommunicationRecord, CommunicationRequest, CommunicationResponse
from datetime import datetime


class CommunicationRequestSchema(BaseModel):
    """Request to send a communication to a provider."""
    request_id: str
    provider_id: str
    template_type: str  # We'll use string for simplicity in API, but we can also use the enum
    channel: str  # Similarly for channel
    context: Dict[str, Any]  # Data to fill in the template
    template_id: Optional[str] = None


class CommunicationResponseSchema(BaseModel):
    """Response from sending a communication."""
    communication_id: str
    request_id: str
    provider_id: str
    channel: str
    status: str
    subject: str
    body: str
    sent_at: Optional[datetime] = None