from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class Doctor(Base):

    __tablename__ = "doctors"

    # Primary Key
    id = Column(
        String,
        primary_key=True,
        index=True
    )

    # Doctor Information
    doctor_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    # Professional Information
    hospital_name = Column(
        String,
        nullable=True
    )

    specialization = Column(
        String,
        nullable=True
    )

    license_number = Column(
        String,
        unique=True,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    # Account Information
    role = Column(
        String,
        default="Doctor"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    last_login = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )