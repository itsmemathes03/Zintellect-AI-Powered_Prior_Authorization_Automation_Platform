from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from datetime import datetime

from app.database.db import Base


class UploadedFile(Base):

    __tablename__ = "uploaded_files"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    # Prior Authorization Request ID
    request_id = Column(
        String,
        ForeignKey("prior_auth_requests.id"),
        nullable=False
    )

    # Original File Name
    file_name = Column(
        String,
        nullable=False
    )

    # File Type
    # pdf, txt, png, jpg
    file_type = Column(
        String,
        nullable=False
    )

    # SHA256 Hash
    hash_value = Column(
        String,
        nullable=True
    )

    # Processing Status
    # Processing
    # Completed
    # Failed
    # Deleted
    processing_status = Column(
        String,
        default="Processing"
    )

    # Upload Time
    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # File Deletion Time
    deleted_at = Column(
        DateTime,
        nullable=True
    )