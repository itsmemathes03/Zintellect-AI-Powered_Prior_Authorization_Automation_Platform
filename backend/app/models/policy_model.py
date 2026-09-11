from sqlalchemy import Column, String, Text, Integer, DateTime

from datetime import datetime

from app.database.db import Base


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    # Primary Key
    id = Column(String, primary_key=True, index=True)

    # Provider Information
    insurance_provider_id = Column(String, nullable=False)

    insurance_provider = Column(String, nullable=False)

    # Procedure Information
    procedure_name = Column(String, nullable=False)

    # Full Extracted Policy Text
    policy_text = Column(Text, nullable=True)

    # Policy Requirements
    required_documents = Column(Text, nullable=True)

    required_conditions = Column(Text, nullable=True)

    # Original PDF Path
    policy_file_path = Column(String, nullable=True)

    # Status for Admin Approval Workflow
    # pending, approved, rejected
    status = Column(String, default="pending")

    # Admin Approval Details
    approved_by = Column(String, nullable=True)

    approved_at = Column(DateTime, nullable=True)

    rejection_comment = Column(Text, nullable=True)

    # RAG Information
    embedding_status = Column(String, default="Pending")

    total_chunks = Column(Integer, default=0)

    version = Column(String, default="1.0")

    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
