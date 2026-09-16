from __future__ import annotations

"""
n8n Workflow Automation Service

Dispatches events to a single n8n webhook after the core FastAPI
pipeline completes.  This is fire-and-forget: n8n failure never
blocks or degrades the prior-authorization response.

Supported events:
  - prior_authorization_decision  (PA final human decision)
  - patient_registered            (new patient account)
  - policy_uploaded               (new insurance policy)

Architecture:
  FastAPI (source of truth)  ->  HTTP POST  ->  n8n Webhook
                                                |
                                      Event-type routing
                                                |
                                      Notifications / Audit events

When n8n is unreachable the backend falls back to creating
notification + audit records locally so the workflow always
completes.  Exactly ONE notification and ONE audit entry are
created per event regardless of whether n8n is available.
"""

import os
import uuid
from datetime import datetime, timezone

import httpx

# ==========================================
# CONFIGURATION
# ==========================================

N8N_WEBHOOK_URL = os.getenv(
    "N8N_WEBHOOK_URL",
    "http://localhost:5678/webhook/zintellect-pa-events",
)

# Short timeout so a slow/n8n-down never delays the response.
N8N_TIMEOUT_SECONDS = float(
    os.getenv("N8N_TIMEOUT_SECONDS", "5")
)


# ==========================================
# DISPATCH (fire-and-forget)
# ==========================================

def dispatch_to_n8n(payload: dict) -> bool:
    """
    POST the event payload to the n8n webhook.

    Returns True on success, False on failure.
    Never raises — failures are logged and swallowed.
    """

    try:
        response = httpx.post(
            N8N_WEBHOOK_URL,
            json=payload,
            timeout=N8N_TIMEOUT_SECONDS,
        )
        if response.status_code < 300:
            print(
                f"[n8n] Event dispatched OK — "
                f"event={payload.get('event')} "
                f"request_id={payload.get('request_id', '')} "
                f"patient_id={payload.get('patient_id', '')} "
                f"policy_id={payload.get('policy_id', '')}"
            )
            return True
        else:
            print(
                f"[n8n] Webhook returned {response.status_code}: "
                f"{response.text[:200]}"
            )
            return False

    except httpx.TimeoutException:
        print(
            f"[n8n] Timeout after {N8N_TIMEOUT_SECONDS}s — "
            f"event={payload.get('event', '?')}"
        )
        return False

    except httpx.ConnectError:
        print(
            "[n8n] Connection refused — n8n may not be running. "
            "Falling back to local event creation."
        )
        return False

    except Exception as exc:
        print(f"[n8n] Dispatch error: {exc}")
        return False


# ==========================================
# LOCAL FALLBACK — NOTIFICATION + AUDIT
# ==========================================

def _create_local_events(payload: dict):
    """
    Create notification and audit log entries directly in the DB.

    This is a FALLBACK used only when the n8n webhook dispatch
    fails.  It ensures the workflow completes locally regardless
    of n8n availability.  Exactly one notification and one audit
    entry are created per event.
    """

    try:
        from app.database.db import SessionLocal
        from app.models.notification_model import Notification
        from app.models.audit_log_model import AuditLog

        db = SessionLocal()

        event_type = payload.get("event", "unknown")

        # ------------------------------------------
        # PA DECISION FALLBACK
        # ------------------------------------------
        if event_type == "prior_authorization_decision":
            status = payload.get("status", "unknown")
            request_id = payload.get("request_id", "unknown")
            provider_id = payload.get("provider_id", "")
            confidence = payload.get("confidence_score", 0)
            missing = payload.get("missing_requirements", [])

            if status == "Approved":
                ntype = "N8N_APPROVED"
                message = (
                    f"Prior authorization request {request_id} "
                    f"has been APPROVED. "
                    f"Confidence: {confidence}%"
                )
                audit_action = "n8n: Approval workflow completed"
            elif status == "Pending Additional Information":
                ntype = "N8N_MISSING_INFO"
                missing_str = ", ".join(missing) if missing else "none"
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

            if provider_id:
                notification = Notification(
                    user_id=provider_id,
                    role="provider",
                    notification_type=ntype,
                    message=message,
                    request_id=request_id,
                )
                db.add(notification)
                print(f"[n8n] Fallback notification created: {ntype} for {request_id}")

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
            print(f"[n8n] Fallback audit logged: {audit_action} for {request_id}")

        # ------------------------------------------
        # PATIENT REGISTERED FALLBACK
        # ------------------------------------------
        elif event_type == "patient_registered":
            patient_id = payload.get("patient_id", "unknown")
            provider_name = payload.get("insurance_provider", "")

            notification = Notification(
                user_id="system",
                role="system",
                notification_type="PATIENT_REGISTERED",
                message=f"New patient registered (ID: {patient_id}). Insurance: {provider_name}.",
                request_id=None,
            )
            db.add(notification)
            print(f"[n8n] Fallback notification created: PATIENT_REGISTERED for {patient_id}")

            audit = AuditLog(
                request_id=None,
                action="n8n: Patient registered",
                user_id="n8n-workflow",
                role="system",
                description=f"Patient {patient_id} registered with {provider_name}.",
                status="Success",
                created_at=datetime.utcnow(),
            )
            db.add(audit)
            print(f"[n8n] Fallback audit logged: Patient registered for {patient_id}")

        # ------------------------------------------
        # POLICY UPLOADED FALLBACK
        # ------------------------------------------
        elif event_type == "policy_uploaded":
            policy_id = payload.get("policy_id", "unknown")
            provider_id = payload.get("provider_id", "")
            procedure = payload.get("procedure_name", "")

            notification = Notification(
                user_id=provider_id or "system",
                role="provider",
                notification_type="POLICY_UPLOADED",
                message=f"New policy uploaded (ID: {policy_id}). Procedure: {procedure}.",
                request_id=None,
            )
            db.add(notification)
            print(f"[n8n] Fallback notification created: POLICY_UPLOADED for {policy_id}")

            audit = AuditLog(
                request_id=None,
                action="n8n: Policy uploaded",
                user_id="n8n-workflow",
                role="system",
                description=f"Policy {policy_id} uploaded for procedure {procedure}.",
                status="Success",
                created_at=datetime.utcnow(),
            )
            db.add(audit)
            print(f"[n8n] Fallback audit logged: Policy uploaded for {policy_id}")

        else:
            print(f"[n8n] Unknown event type '{event_type}' — skipping local fallback")

        db.commit()
        db.close()

    except Exception as exc:
        print(f"[n8n] Local event creation error: {exc}")
        try:
            db.rollback()
            db.close()
        except Exception:
            pass


# ==========================================
# EVENT PAYLOAD BUILDERS
# ==========================================

def build_pa_event(
    request_id: str,
    status: str,
    confidence_score: float,
    insurance_provider: str,
    procedure_code: str,
    matched_conditions: list,
    missing_requirements: list,
    uploaded_document_types: list,
    processing_time_seconds: float,
    provider_id: str = "",
    provider_name: str = "",
):
    """Return a JSON-serialisable dict for PA decision events."""

    return {
        "event": "prior_authorization_decision",
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id,
        "status": status,
        "confidence_score": confidence_score,
        "insurance_provider": insurance_provider,
        "procedure_code": procedure_code,
        "matched_conditions": matched_conditions,
        "missing_requirements": missing_requirements,
        "uploaded_document_types": uploaded_document_types,
        "processing_time_seconds": processing_time_seconds,
        "provider_id": provider_id,
        "provider_name": provider_name,
    }


def build_patient_registered_event(
    patient_id: str,
    patient_name: str,
    insurance_provider: str,
    insurance_id: str = "",
):
    """Return a JSON-serialisable dict for patient registration events.

    PHI-minimized: only IDs and names needed for notification routing.
    """

    return {
        "event": "patient_registered",
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "patient_id": patient_id,
        "patient_name": patient_name,
        "insurance_provider": insurance_provider,
        "insurance_id": insurance_id,
        "status": "registered",
    }


def build_policy_uploaded_event(
    policy_id: str,
    provider_id: str,
    insurance_provider: str,
    procedure_name: str,
    required_documents: list | None = None,
    required_conditions: list | None = None,
):
    """Return a JSON-serialisable dict for policy upload events.

    PHI-minimized: only IDs and procedure name.  No PDF content,
    no policy text, no clinical details.
    """

    return {
        "event": "policy_uploaded",
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "policy_id": policy_id,
        "provider_id": provider_id,
        "insurance_provider": insurance_provider,
        "procedure_name": procedure_name,
        "required_documents_count": len(required_documents or []),
        "required_conditions_count": len(required_conditions or []),
        "status": "uploaded",
    }


# ==========================================
# HIGH-LEVEL ENTRY POINTS
# ==========================================

def notify_n8n(
    request_id: str,
    status: str,
    confidence_score: float = 0.0,
    insurance_provider: str = "",
    procedure_code: str = "",
    matched_conditions: list | None = None,
    missing_requirements: list | None = None,
    uploaded_document_types: list | None = None,
    processing_time_seconds: float = 0.0,
    provider_id: str = "",
    provider_name: str = "",
):
    """
    Build a PA decision event, dispatch to n8n, and handle fallback.

    Exactly ONE notification and ONE audit entry are created:
      - If n8n is available: n8n processes the event and creates
        notification + audit via internal callback.
      - If n8n is unavailable: the local fallback creates
        notification + audit directly.

    This eliminates the duplicate-notification bug.
    """

    payload = build_pa_event(
        request_id=request_id,
        status=status,
        confidence_score=confidence_score,
        insurance_provider=insurance_provider,
        procedure_code=procedure_code,
        matched_conditions=matched_conditions or [],
        missing_requirements=missing_requirements or [],
        uploaded_document_types=uploaded_document_types or [],
        processing_time_seconds=processing_time_seconds,
        provider_id=provider_id,
        provider_name=provider_name,
    )

    # Dispatch to n8n (best-effort)
    n8n_ok = dispatch_to_n8n(payload)

    # Only create local events if n8n dispatch failed (fallback).
    # If n8n is running, it will create notification + audit via
    # the internal callback routes.
    if not n8n_ok:
        _create_local_events(payload)


def notify_patient_registered(
    patient_id: str,
    patient_name: str,
    insurance_provider: str,
    insurance_id: str = "",
):
    """
    Build a patient_registered event, dispatch to n8n, and handle
    fallback.  Never blocks the registration response.
    """

    payload = build_patient_registered_event(
        patient_id=patient_id,
        patient_name=patient_name,
        insurance_provider=insurance_provider,
        insurance_id=insurance_id,
    )

    n8n_ok = dispatch_to_n8n(payload)

    if not n8n_ok:
        _create_local_events(payload)


def notify_policy_uploaded(
    policy_id: str,
    provider_id: str,
    insurance_provider: str,
    procedure_name: str,
    required_documents: list | None = None,
    required_conditions: list | None = None,
):
    """
    Build a policy_uploaded event, dispatch to n8n, and handle
    fallback.  Never blocks the policy upload response.
    """

    payload = build_policy_uploaded_event(
        policy_id=policy_id,
        provider_id=provider_id,
        insurance_provider=insurance_provider,
        procedure_name=procedure_name,
        required_documents=required_documents,
        required_conditions=required_conditions,
    )

    n8n_ok = dispatch_to_n8n(payload)

    if not n8n_ok:
        _create_local_events(payload)
