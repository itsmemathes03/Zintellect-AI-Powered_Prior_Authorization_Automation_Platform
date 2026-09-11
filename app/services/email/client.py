import logging
from tenacity import retry, stop_after_attempt, wait_exponential, before_sleep_log
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.services.email.config import email_settings

logger = logging.getLogger(__name__)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def send_smtp_email(to: str, subject: str, html_body: str) -> bool:
    if not email_settings.enabled:
        logger.warning("[email] SMTP not configured — skipping send to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{email_settings.smtp_from_name} <{email_settings.smtp_from_email}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=email_settings.smtp_host,
            port=email_settings.smtp_port,
            start_tls=True,
            username=email_settings.smtp_username,
            password=email_settings.smtp_app_password,
        )
        logger.info("[email] Sent to %s — subject: %s", to, subject)
        return True
    except Exception as e:
        logger.error("[email] Failed to send to %s — %s", to, str(e))
        raise
