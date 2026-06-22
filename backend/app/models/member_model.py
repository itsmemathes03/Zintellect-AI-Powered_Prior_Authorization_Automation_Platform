from sqlalchemy import (
    Column,
    String,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class InsuranceMember(Base):

    __tablename__ = "insurance_members"

    # Primary Key
    id = Column(
        String,
        primary_key=True,
        index=True
    )

    # Insurance Provider Information
    insurance_provider_id = Column(
        String,
        nullable=False
    )

    insurance_provider = Column(
        String,
        nullable=False
    )

    # Patient Information
    patient_name = Column(
        String,
        nullable=False
    )

    patient_email = Column(
        String,
        unique=True,
        nullable=False
    )

    phone = Column(
        String,
        nullable=True
    )

    date_of_birth = Column(
        String,
        nullable=True
    )

    gender = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    # Insurance Details
    insurance_id = Column(
        String,
        unique=True,
        nullable=False
    )

    policy_number = Column(
        String,
        nullable=False
    )

    coverage_status = Column(
        String,
        default="Active"
    )

    # Audit Fields
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )