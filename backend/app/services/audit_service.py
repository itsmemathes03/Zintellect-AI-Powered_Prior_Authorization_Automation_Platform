from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.database.db import SessionLocal
from app.models.audit_log_model import AuditLog


# ==========================================
# VALIDATED AUDIT PAYLOAD (Pydantic boundary)
# ==========================================
# All audit writes go through this model so a field-name
# mismatch (the historical performed_by/user_id drift)
# fails loudly here instead of silently corrupting rows.

class AuditLogCreate(BaseModel):

    # Column names mirror AuditLog exactly to prevent drift.
    request_id: str | None = None

    action: str = Field(min_length=1)

    user_id: str = "AI System"

    role: str | None = None

    description: str = ""

    ip_address: str | None = None

    status: str = "Success"


def new_audit_entry(data: AuditLogCreate) -> AuditLog:
    """
    Build an (uncommitted) AuditLog ORM row from a validated
    payload. For callers with an active session.
    """

    return AuditLog(

        request_id=data.request_id,

        action=data.action,

        user_id=data.user_id,

        role=data.role,

        description=data.description,

        ip_address=data.ip_address,

        status=data.status,

        created_at=datetime.utcnow()
    )


# ==========================================
# CREATE AUDIT LOG
# ==========================================

def create_audit_log(
        request_id,
        action,
        performed_by,
        details=""
):

    db = SessionLocal()

    try:

        data = AuditLogCreate(
            request_id=request_id,
            action=action,
            user_id=performed_by if performed_by else "AI System",
            description=details or "",
        )

        audit = new_audit_entry(data)

        db.add(audit)

        db.commit()

        db.refresh(audit)

        return audit

    except Exception as error:

        print(
            "AUDIT LOG ERROR:",
            str(error)
        )

        db.rollback()

        return None

    finally:

        db.close()


# ==========================================
# GET AUDIT LOGS
# ==========================================

def get_request_audit_logs(
        request_id
):

    db = SessionLocal()

    try:

        return (

            db.query(
                AuditLog
            )

            .filter(
                AuditLog.request_id
                ==
                request_id
            )

            .all()
        )

    finally:

        db.close()