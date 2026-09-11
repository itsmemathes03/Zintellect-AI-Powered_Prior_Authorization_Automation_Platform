import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.email.schemas import (
    PAStatusUpdateContext,
    SLABreachContext,
    WelcomeContext,
    DocumentProcessedContext,
    AdminErrorContext,
)


class TestEmailSender:
    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_pa_status_email(self, mock_send):
        mock_send.return_value = True
        from app.services.email.sender import send_pa_status_email
        from fastapi import BackgroundTasks

        bg = BackgroundTasks()
        ctx = PAStatusUpdateContext(
            request_id="req-123",
            patient_name="John",
            procedure_name="MRI",
            status="Approved",
        )
        send_pa_status_email(bg, "test@example.com", ctx)
        # BackgroundTasks queues but doesn't execute synchronously
        assert len(bg.tasks) == 1

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_sla_breach_email(self, mock_send):
        mock_send.return_value = True
        from app.services.email.sender import send_sla_breach_email
        from fastapi import BackgroundTasks

        bg = BackgroundTasks()
        ctx = SLABreachContext(
            request_id="req-456",
            patient_name="Jane",
            elapsed_time="25.0 hours",
            sla_deadline="2026-08-20",
        )
        send_sla_breach_email(bg, "admin@test.com", ctx)
        assert len(bg.tasks) == 1

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_welcome_email(self, mock_send):
        mock_send.return_value = True
        from app.services.email.sender import send_welcome_email
        from fastapi import BackgroundTasks

        bg = BackgroundTasks()
        ctx = WelcomeContext(user_name="Dr. Smith", role="doctor", email="doc@test.com")
        send_welcome_email(bg, "doc@test.com", ctx)
        assert len(bg.tasks) == 1

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_document_processed_email(self, mock_send):
        mock_send.return_value = True
        from app.services.email.sender import send_document_processed_email
        from fastapi import BackgroundTasks

        bg = BackgroundTasks()
        ctx = DocumentProcessedContext(
            document_name="notes.pdf",
            procedure_name="MRI",
        )
        send_document_processed_email(bg, "doc@test.com", ctx)
        assert len(bg.tasks) == 1

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_admin_error_email(self, mock_send):
        mock_send.return_value = True
        from app.services.email.sender import send_admin_error_email
        from fastapi import BackgroundTasks

        bg = BackgroundTasks()
        ctx = AdminErrorContext(
            error_summary="Pipeline failed",
            endpoint="/submit-request",
            timestamp="2026-08-23T10:00:00",
        )
        send_admin_error_email(bg, "admin@test.com", ctx)
        assert len(bg.tasks) == 1

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_test_email(self, mock_send):
        mock_send.return_value = True
        import asyncio
        from app.services.email.sender import send_test_email

        result = asyncio.run(send_test_email("test@example.com", "welcome.html", {"user_name": "Test", "role": "doctor", "email": "test@example.com", "base_url": "http://localhost:5173"}))
        assert result is True
        mock_send.assert_called_once()

    @patch("app.services.email.sender.send_smtp_email", new_callable=AsyncMock)
    def test_send_email_logs_failure(self, mock_send):
        mock_send.side_effect = Exception("SMTP connection refused")
        import asyncio
        from app.services.email.sender import send_test_email

        with pytest.raises(Exception, match="SMTP connection refused"):
            asyncio.run(send_test_email("test@example.com", "welcome.html", {"user_name": "Test", "role": "doctor", "email": "test@example.com", "base_url": "http://localhost:5173"}))

    def test_email_settings_fallback(self):
        from app.services.email.config import EmailSettings
        import os
        os.environ["EMAIL_ADDRESS"] = "fallback@test.com"
        os.environ["EMAIL_PASSWORD"] = "testpass"
        settings = EmailSettings()
        assert settings.smtp_username == "fallback@test.com"
        assert settings.enabled is True
        del os.environ["EMAIL_ADDRESS"]
        del os.environ["EMAIL_PASSWORD"]
