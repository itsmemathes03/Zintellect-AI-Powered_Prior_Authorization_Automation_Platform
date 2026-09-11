"""
n8n Webhook Routes

Internal endpoints that n8n calls back to create notifications
and workflow events.  These are NOT public — they should only
be reachable from the local n8n instance (localhost).
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database.db import SessionLocal
from app.models.notification_model import Notification
from app.models.audit_log_model import AuditLog


router = APIRouter(
    prefix="/internal/n8n",
    tags=["n8n Internal"],
)


# ==========================================
# REQUEST MODELS
# ==========================================


class N8nNotificationRequest(BaseModel):
    """Payload n8n sends to create a notification."""

    user_id: str = Field(min_length=1)
    role: str = Field(default="provider")
    notification_type: str = Field(min_length=1)
    message: str = Field(min_length=1)
    request_id: str | None = None


class N8nEventRequest(BaseModel):
    """Raw PA decision event forwarded by n8n webhook."""

    event: str | None = None
    request_id: str = Field(default="unknown")
    status: str = Field(default="unknown")
    confidence_score: float = 0.0
    insurance_provider: str = ""
    procedure_code: str = ""
    matched_conditions: list = []
    missing_requirements: list = []
    uploaded_document_types: list = []
    processing_time_seconds: float = 0.0
    provider_id: str = ""
    provider_name: str = ""


class N8nAuditRequest(BaseModel):
    """Payload n8n sends to log a workflow event."""

    request_id: str | None = None
    action: str = Field(min_length=1)
    user_id: str = "n8n-workflow"
    role: str = "system"
    description: str = ""
    status: str = "Success"


# ==========================================
# CREATE NOTIFICATION
# ==========================================


@router.post("/notifications")
def create_n8n_notification(body: N8nNotificationRequest):
    """
    Called by n8n to create a notification in the Zintellect DB.
    This reuses the existing Notification model.
    """

    db = SessionLocal()

    try:
        notification = Notification(
            user_id=body.user_id,
            role=body.role,
            notification_type=body.notification_type,
            message=body.message,
            request_id=body.request_id,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        print(
            f"[n8n] Notification created: "
            f"type={body.notification_type} "
            f"request_id={body.request_id}"
        )

        return {
            "status": "Success",
            "notification_id": notification.id,
        }

    except Exception as exc:
        db.rollback()
        print(f"[n8n] Notification error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        db.close()


# ==========================================
# PROCESS PA EVENT (called by n8n webhook)
# ==========================================


@router.post("/process-event")
def process_pa_event(body: N8nEventRequest):
    """
    Called by the n8n webhook to process a PA decision event.
    This endpoint handles all routing logic: creates notifications
    and audit logs based on the decision status.
    """

    db = SessionLocal()

    try:
        status = body.status
        request_id = body.request_id
        provider_id = body.provider_id

        # --- Determine notification type and message ---
        if status == "Approved":
            ntype = "N8N_APPROVED"
            message = (
                f"Prior authorization request {request_id} "
                f"has been APPROVED. "
                f"Confidence: {body.confidence_score}%"
            )
            audit_action = "n8n: Approval workflow completed"
        elif status == "Pending Additional Information":
            ntype = "N8N_MISSING_INFO"
            missing_str = ", ".join(body.missing_requirements)
            message = (
                f"Additional information required for request "
                f"{request_id}. Missing: {missing_str}."
            )
            audit_action = "n8n: Missing-info workflow completed"
        else:
            ntype = "N8N_DENIED"
            message = (
                f"Prior authorization request {request_id} "
                f"has been {status}."
            )
            audit_action = f"n8n: {status} workflow completed"

        # --- Create notification ---
        if provider_id:
            notification = Notification(
                user_id=provider_id,
                role="provider",
                notification_type=ntype,
                message=message,
                request_id=request_id,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            print(f"[n8n] Notification created: {ntype} for {request_id}")

        # --- Create audit log ---
        audit = AuditLog(
            request_id=request_id,
            action=audit_action,
            user_id="n8n-workflow",
            role="system",
            description=message,
            status="Success",
            created_at=datetime.utcnow(),
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        print(f"[n8n] Audit event logged: {audit_action} for {request_id}")

        return {
            "status": "processed",
            "request_id": request_id,
            "notification_type": ntype,
        }

    except Exception as exc:
        db.rollback()
        print(f"[n8n] Process event error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        db.close()


# ==========================================
# LOG WORKFLOW EVENT
# ==========================================


@router.post("/audit")
def create_n8n_audit(body: N8nAuditRequest):
    """
    Called by n8n to log a workflow/audit event.
    This reuses the existing AuditLog model.
    """

    db = SessionLocal()

    try:
        audit = AuditLog(
            request_id=body.request_id,
            action=body.action,
            user_id=body.user_id,
            role=body.role,
            description=body.description,
            status=body.status,
            created_at=datetime.utcnow(),
        )

        db.add(audit)
        db.commit()
        db.refresh(audit)

        print(
            f"[n8n] Audit event logged: "
            f"action={body.action} "
            f"request_id={body.request_id}"
        )

        return {
            "status": "Success",
            "audit_id": audit.id,
        }

    except Exception as exc:
        db.rollback()
        print(f"[n8n] Audit error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        db.close()
