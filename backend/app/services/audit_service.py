from datetime import datetime

from app.database.db import SessionLocal
from app.models.audit_log_model import AuditLog


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

        audit = AuditLog(

            request_id=request_id,

            action=action,

            performed_by=performed_by,

            details=details,

            created_at=datetime.utcnow()
        )

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