from __future__ import annotations

from pydantic import BaseModel


class PAStatusUpdateContext(BaseModel):
    request_id: str
    patient_name: str
    procedure_name: str
    status: str
    notes: str | None = None
    view_url: str | None = None


class SLABreachContext(BaseModel):
    request_id: str
    patient_name: str
    elapsed_time: str
    sla_deadline: str
    dashboard_url: str | None = None


class WelcomeContext(BaseModel):
    user_name: str
    role: str
    email: str
    base_url: str | None = None


class DocumentProcessedContext(BaseModel):
    document_name: str
    procedure_name: str
    extracted_fields: dict | None = None
    review_url: str | None = None


class AdminErrorContext(BaseModel):
    endpoint: str
    error_summary: str
    timestamp: str
    error_details_url: str | None = None
