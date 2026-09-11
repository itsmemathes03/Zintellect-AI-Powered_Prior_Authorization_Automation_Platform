from pydantic import BaseModel
from typing import Optional


class PAStatusUpdateContext(BaseModel):
    request_id: str
    patient_name: str
    procedure_name: str
    status: str  # Approved, Denied, Pending, Manual Review
    reason: Optional[str] = ""
    doctor_name: Optional[str] = ""
    base_url: str = "http://localhost:5173"


class SLABreachContext(BaseModel):
    request_id: str
    patient_name: str
    procedure_name: str
    elapsed_hours: float
    sla_deadline: str
    base_url: str = "http://localhost:5173"


class WelcomeContext(BaseModel):
    user_name: str
    role: str
    email: str
    base_url: str = "http://localhost:5173"


class DocumentProcessedContext(BaseModel):
    request_id: str
    patient_name: str
    document_name: str
    procedure_name: str
    extracted_fields: dict = {}
    base_url: str = "http://localhost:5173"


class AdminErrorContext(BaseModel):
    error_summary: str
    endpoint: str
    timestamp: str
    base_url: str = "http://localhost:5173"
