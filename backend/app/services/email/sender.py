import asyncio
import logging
from datetime import datetime
from fastapi import BackgroundTasks

from app.services.email.client import send_smtp_email
from app.services.email.renderer import render_template
from app.services.email.config import email_settings
from app.services.email.schemas import (
    PAStatusUpdateContext,
    SLABreachContext,
    WelcomeContext,
    DocumentProcessedContext,
    AdminErrorContext,
)

logger = logging.getLogger(__name__)

_STATUS_SUBJECTS = {
    "Approved": "✅ Approved",
    "Denied": "❌ Denied",
    "Rejected": "❌ Rejected",
    "Pending": "⏳ Pending Review",
    "Manual Review": "⚠️ Manual Review Required",
}


def _send_background(to: str, subject: str, html_body: str):
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(send_smtp_email(to, subject, html_body))
    except Exception as e:
        logger.error("[email] Background send failed: %s", str(e))
    finally:
        loop.close()


def send_pa_status_email(background_tasks: BackgroundTasks, to: str, context: PAStatusUpdateContext):
    html = render_template("pa_status_update.html", context.model_dump())
    prefix = _STATUS_SUBJECTS.get(context.status, "📋 Update")
    subject = f"{prefix} — Request {context.request_id[:8]}"
    background_tasks.add_task(_send_background, to, subject, html)


def send_sla_breach_email(background_tasks: BackgroundTasks, to: str, context: SLABreachContext):
    html = render_template("sla_breach_alert.html", context.model_dump())
    subject = f"🚨 SLA Breach — Request {context.request_id[:8]}"
    background_tasks.add_task(_send_background, to, subject, html)


def send_welcome_email(background_tasks: BackgroundTasks, to: str, context: WelcomeContext):
    html = render_template("welcome.html", context.model_dump())
    subject = "Welcome to Zintellect"
    background_tasks.add_task(_send_background, to, subject, html)


def send_document_processed_email(background_tasks: BackgroundTasks, to: str, context: DocumentProcessedContext):
    html = render_template("document_processed.html", context.model_dump())
    subject = f"📄 Document Processed — {context.procedure_name}"
    background_tasks.add_task(_send_background, to, subject, html)


def send_admin_error_email(background_tasks: BackgroundTasks, to: str, context: AdminErrorContext):
    html = render_template("admin_error_alert.html", context.model_dump())
    subject = f"🔴 System Error — {context.endpoint}"
    background_tasks.add_task(_send_background, to, subject, html)


async def send_test_email(to: str, template_name: str, context: dict) -> bool:
    html = render_template(template_name, context)
    return await send_smtp_email(to, f"Zintellect Test — {template_name}", html)
