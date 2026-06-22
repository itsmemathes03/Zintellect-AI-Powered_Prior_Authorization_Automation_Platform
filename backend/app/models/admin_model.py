from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class Admin(Base):

    __tablename__ = "admins"

    # Primary Key
    id = Column(
        String,
        primary_key=True,
        index=True
    )

    # Admin Information
    username = Column(
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

    phone = Column(
        String,
        nullable=True
    )

    # Role Information
    role = Column(
        String,
        default="Admin"
    )

    # Account Status
    is_active = Column(
        Boolean,
        default=True
    )

    # Login Tracking
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