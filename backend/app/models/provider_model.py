from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class InsuranceProvider(Base):

    __tablename__ = "insurance_providers"

    # Primary Key
    id = Column(
        String,
        primary_key=True,
        index=True
    )

    # Provider Information
    provider_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    # Store hashed password only
    password_hash = Column(
        String,
        nullable=False
    )

    phone = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    # Role for RBAC
    role = Column(
        String,
        default="Provider"
    )

    # Account Status
    is_active = Column(
        Boolean,
        default=True
    )

    # Last Login Tracking
    last_login = Column(
        DateTime,
        nullable=True
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