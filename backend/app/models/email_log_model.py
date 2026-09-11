from sqlalchemy import Column, Integer, String, DateTime, Text

from datetime import datetime

from app.database.db import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    request_id = Column(String, nullable=True)

    provider_id = Column(String, nullable=False)

    provider_name = Column(String, nullable=False)

    to_email = Column(String, nullable=False)

    doctor_name = Column(String, nullable=True)

    patient_name = Column(String, nullable=False)

    procedure_code = Column(String, nullable=True)

    status = Column(String, nullable=False)

    subject = Column(String, nullable=True)

    sent_at = Column(DateTime, default=datetime.utcnow)
