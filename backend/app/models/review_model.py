from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey

from datetime import datetime

from app.database.db import Base


class HumanReview(Base):
    __tablename__ = "human_reviews"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Related Request ID
    request_id = Column(
        String,
        ForeignKey("prior_auth_requests.id"),
        nullable=False,
        index=True,
    )

    # Reviewer Identity (nullable until human review is completed)
    reviewer_id = Column(String, nullable=True)
    reviewer_role = Column(String, nullable=True)

    # AI Recommendation (preserved, never overwritten)
    ai_recommendation = Column(String, nullable=True)
    ai_confidence_score = Column(Float, default=0.0)
    ai_xai_reasoning = Column(Text, nullable=True)
    ai_matched_policy_clause = Column(Text, nullable=True)
    ai_missing_documents = Column(Text, nullable=True)

    # Human Decision
    human_decision = Column(String, nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Audit Fields
    created_at = Column(DateTime, default=datetime.utcnow)
