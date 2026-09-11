import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.services.email.config import email_settings

logger = logging.getLogger(__name__)


async def send_smtp_email(to: str, subject: str, html_body: str) -> bool:
    if not email_settings.enabled:
        logger.warning("[email] SMTP not configured — skipping send to %s", to)
        return False

    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{email_settings.smtp_from_name} <{email_settings.smtp_from_email}>"
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(email_settings.smtp_host, email_settings.smtp_port)
        server.starttls()
        server.login(email_settings.smtp_username, email_settings.smtp_app_password)
        server.sendmail(email_settings.smtp_from_email, to, message.as_string())
        server.quit()

        logger.info("[email] Sent to %s — subject: %s", to, subject)
        return True

    except Exception as e:
        logger.error("[email] Failed to send to %s: %s", to, str(e))
        return False
