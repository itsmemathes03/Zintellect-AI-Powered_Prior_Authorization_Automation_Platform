from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from datetime import datetime

from app.database.db import Base


class Notification(Base):

    __tablename__ = "notifications"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    # User ID
    # Can be Provider, Doctor, Patient, Admin
    user_id = Column(
        String,
        nullable=False
    )

    # User Role
    role = Column(
        String,
        nullable=False
    )

    # Notification Type
    # REQUEST_SUBMITTED
    # DOCUMENT_MISSING
    # AI_DECISION_READY
    # APPROVED
    # REJECTED
    # SLA_WARNING
    notification_type = Column(
        String,
        nullable=False
    )

    # Notification Message
    message = Column(
        String,
        nullable=False
    )

    # Request ID (optional)
    request_id = Column(
        String,
        nullable=True
    )

    # Read Status
    is_read = Column(
        Boolean,
        default=False
    )

    # Notification Creation Time
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )