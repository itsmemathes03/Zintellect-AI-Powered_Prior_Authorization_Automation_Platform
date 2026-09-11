from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from datetime import datetime

from app.database.db import Base


class AuthorizationStage(Base):
    __tablename__ = "authorization_stages"

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

    # Stage Name
    # Example:
    # Upload, OCR, PHI, Classification,
    # Chunking, Embedding, Retrieval,
    # RAG, Matching, Scoring, XAI
    stage_name = Column(
        String,
        nullable=False
    )

    # Pending, Processing,
    # Completed, Failed
    status = Column(
        String,
        default="Pending"
    )

    # Progress Percentage
    # 0 - 100
    progress = Column(
        Integer,
        default=0
    )

    # Optional message
    # Example:
    # "OCR extraction completed"
    message = Column(
        String,
        nullable=True
    )

    # Stage start time
    started_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Stage completion time
    completed_at = Column(
        DateTime,
        nullable=True
    )