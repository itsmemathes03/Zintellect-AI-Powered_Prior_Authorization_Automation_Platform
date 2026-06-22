from sqlalchemy import Column, String, Boolean, DateTime, Text

from datetime import datetime

from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(String, primary_key=True, index=True)

    # Basic Information
    username = Column(String, nullable=True)

    email = Column(String, unique=True, nullable=False, index=True)

    password_hash = Column(String, nullable=False)

    # Role: Doctor, Provider, Patient, Admin
    role = Column(String, nullable=False, index=True)

    # Profile Information
    first_name = Column(String, nullable=True)

    last_name = Column(String, nullable=True)

    phone = Column(String, nullable=True)

    address = Column(Text, nullable=True)

    # Doctor Specific
    hospital_name = Column(String, nullable=True)

    specialization = Column(String, nullable=True)

    license_number = Column(String, nullable=True)

    # Provider Specific
    provider_name = Column(String, nullable=True)

    # Patient Specific
    member_id = Column(String, nullable=True)

    insurance_provider_id = Column(String, nullable=True)

    date_of_birth = Column(DateTime, nullable=True)

    # Account Status
    is_active = Column(Boolean, default=True)

    is_verified = Column(Boolean, default=False)

    # Login Tracking
    last_login = Column(DateTime, nullable=True)

    # Password Reset
    reset_token = Column(String, nullable=True)

    reset_token_expires = Column(DateTime, nullable=True)

    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
