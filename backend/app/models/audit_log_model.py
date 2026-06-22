from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    # User performing the action
    user_id = Column(
        String,
        nullable=True
    )

    # User role
    # Provider, Doctor, Patient, Admin, AI System
    role = Column(
        String,
        nullable=True
    )

    # Related Request ID
    request_id = Column(
        String,
        nullable=True
    )

    # Action performed
    action = Column(
        String,
        nullable=False
    )

    # Additional details
    description = Column(
        String,
        nullable=True
    )

    # User IP Address
    ip_address = Column(
        String,
        nullable=True
    )

    # Status
    # Success, Failed, Processing
    status = Column(
        String,
        default="Success"
    )

    # Timestamp
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )