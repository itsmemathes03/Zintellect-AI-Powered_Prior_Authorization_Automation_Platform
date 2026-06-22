from sqlalchemy import Column, String, Float, DateTime, Text

from datetime import datetime

from app.database.db import Base


class PriorAuthRequest(Base):
    __tablename__ = "prior_auth_requests"

    # Request ID
    id = Column(String, primary_key=True, index=True)

    # Patient Information
    patient_name = Column(String)
    patient_id = Column(String)

    # Doctor Information
    doctor_name = Column(String)

    # Insurance Information
    insurance_provider = Column(String)

    # Clinical Information
    diagnosis = Column(Text)
    clinical_notes = Column(Text)

    # Procedure Information
    procedure_code = Column(String)

    # Uploaded Files
    uploaded_files = Column(Text)

    # AI Decision Status
    status = Column(String, default="Submitted")

    processing_stage = Column(String, default="Pending")

    # AI Confidence
    confidence_score = Column(Float, default=0.0)

    # Critical / High / Medium / Low
    urgency_level = Column(String, default="Medium")

    # XAI Information
    xai_reasoning = Column(Text)

    matched_policy_clause = Column(Text)

    missing_documents = Column(Text)

    # Document Similarity
    similarity_score = Column(Float, default=0.0)

    duplicate_request_id = Column(String, nullable=True)

    duplicate_flag = Column(String, default="None")

    # SLA Tracking
    sla_deadline = Column(DateTime)

    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
