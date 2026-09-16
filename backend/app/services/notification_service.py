from datetime import datetime, timedelta

from app.database.db import SessionLocal
from app.models.notification_model import Notification
from app.models.request_model import PriorAuthRequest
from app.models.user_model import User
from app.services.email.sender import send_sla_breach_email
from app.services.email.schemas import SLABreachContext
from app.services.n8n_event_emitter import emit_event, Events


# ==========================================
# CREATE NOTIFICATION
# ==========================================

def create_notification(
        user_id,
        role,
        notification_type,
        message,
        request_id=None
):

    db = SessionLocal()

    try:

        notification = Notification(
            user_id=user_id,
            role=role,
            notification_type=notification_type,
            message=message,
            request_id=request_id
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        # --- n8n: notification_sent ---
        emit_event(
            event=Events.NOTIFICATION_SENT,
            entity_type="notification",
            entity_id=str(notification.id),
            request_id=request_id or "",
            status="sent",
            actor_role="system",
        )

        return notification

    except Exception as e:

        db.rollback()
        print("Notification Error:", str(e))

        # --- n8n: notification_failed ---
        try:
            emit_event(
                event=Events.NOTIFICATION_FAILED,
                entity_type="notification",
                entity_id="",
                request_id=request_id or "",
                status="failed",
                actor_role="system",
            )
        except Exception:
            pass

        return None

    finally:
        db.close()


# ==========================================
# GET USER NOTIFICATIONS
# ==========================================

def get_notifications(user_id):

    db = SessionLocal()

    try:

        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        return notifications

    finally:
        db.close()


# ==========================================
# MARK AS READ
# ==========================================

def mark_as_read(notification_id):

    db = SessionLocal()

    try:

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

        if not notification:
            return None

        notification.is_read = True

        db.commit()
        db.refresh(notification)

        return notification

    except Exception as e:

        db.rollback()
        print("Mark Read Error:", str(e))
        return None

    finally:
        db.close()


# ==========================================
# DELETE NOTIFICATION
# ==========================================

def delete_notification(notification_id):

    db = SessionLocal()

    try:

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

        if not notification:
            return False

        db.delete(notification)
        db.commit()

        return True

    except Exception as e:

        db.rollback()
        print("Delete Notification Error:", str(e))
        return False

    finally:
        db.close()


# ==========================================
# SLA BREACH CHECK
# ==========================================

def check_sla_breaches():
    """
    Background job: check all requests with sla_deadline approaching or breached.
    Sends SLA_WARNING notifications to the associated provider and emails to admins.
    """

    db = SessionLocal()

    try:
        now = datetime.utcnow()
        approaching_threshold = now + timedelta(hours=2)

        requests = (
            db.query(PriorAuthRequest)
            .filter(
                PriorAuthRequest.sla_deadline.isnot(None),
                PriorAuthRequest.status != "Approved",
                PriorAuthRequest.status != "Rejected",
            )
            .all()
        )

        for req in requests:
            warning_sent = False

            if req.sla_deadline <= now:
                if not any(
                    n.notification_type == "SLA_WARNING" and n.request_id == req.id
                    for n in db.query(Notification).filter(Notification.request_id == req.id).all()
                ):
                    create_notification(
                        user_id=req.provider_id or "provider-abc",
                        role="provider",
                        notification_type="SLA_WARNING",
                        message=f"SLA breached for request {req.id}",
                        request_id=req.id,
                    )
                    # Emit SLA warning event to n8n
                    emit_event(
                        event=Events.SLA_WARNING,
                        entity_type="prior_authorization",
                        entity_id=req.id,
                        request_id=req.id,
                        status="sla_breached",
                        actor_role="system",
                        extra={
                            "sla_deadline": req.sla_deadline.isoformat() if req.sla_deadline else "",
                        },
                    )
                    warning_sent = True

            elif req.sla_deadline <= approaching_threshold:
                if not any(
                    n.notification_type == "SLA_WARNING" and n.request_id == req.id
                    for n in db.query(Notification).filter(Notification.request_id == req.id).all()
                ):
                    create_notification(
                        user_id=req.provider_id or "provider-abc",
                        role="provider",
                        notification_type="SLA_WARNING",
                        message=f"SLA approaching for request {req.id} (deadline: {req.sla_deadline})",
                        request_id=req.id,
                    )
                    # Emit SLA warning event to n8n
                    emit_event(
                        event=Events.SLA_WARNING,
                        entity_type="prior_authorization",
                        entity_id=req.id,
                        request_id=req.id,
                        status="sla_approaching",
                        actor_role="system",
                        extra={
                            "sla_deadline": req.sla_deadline.isoformat() if req.sla_deadline else "",
                        },
                    )
                    warning_sent = True

            # Send SLA breach email to admins
            if warning_sent:
                admin_users = db.query(User).filter(User.role == "Admin", User.is_active == True).all()
                elapsed = now - req.created_at if req.created_at else timedelta(0)
                hours, remainder = divmod(int(elapsed.total_seconds()), 3600)
                minutes = remainder // 60
                elapsed_str = f"{hours}h {minutes}m" if hours else f"{minutes}m"

                for admin in admin_users:
                    try:
                        import asyncio
                        from app.services.email.client import send_smtp_email
                        from app.services.email.renderer import render_template

                        ctx = SLABreachContext(
                            request_id=req.id,
                            patient_name=req.patient_name or "Unknown",
                            elapsed_time=elapsed_str,
                            sla_deadline=req.sla_deadline.isoformat() if req.sla_deadline else "N/A",
                        )
                        html = render_template("sla_breach_alert.html", ctx.model_dump())
                        subject = f"🚨 SLA Breach — Request {req.id[:8]}"

                        loop = asyncio.new_event_loop()
                        try:
                            loop.run_until_complete(send_smtp_email(admin.email, subject, html))
                        finally:
                            loop.close()
                    except Exception as email_err:
                        print(f"SLA breach email failed for {admin.email}: {email_err}")

        if warning_sent:
            print(f"SLA breach check completed at {now}: warnings sent for requests")

    except Exception as e:
        print(f"SLA breach check error: {str(e)}")

    finally:
        db.close()