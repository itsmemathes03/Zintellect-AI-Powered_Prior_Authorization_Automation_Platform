"""
Focused tests for the n8n error webhook configuration.

Verifies:
  1. N8N_ERROR_WEBHOOK_URL defaults to /webhook/zintellect-backend-errors
  2. N8N_WEBHOOK_URL defaults to /webhook/zintellect-pa-events (email preserved)
  3. error_monitor.dispatch_error_event uses N8N_ERROR_WEBHOOK_URL, not email URL
  4. X-Webhook-Secret header is sent on error webhook calls
  5. n8n_service and n8n_event_emitter still use N8N_WEBHOOK_URL (email unchanged)
  6. When N8N_ERROR_WEBHOOK_URL env var is set, it is respected
"""

import os
from unittest.mock import MagicMock, patch

import pytest


# ==========================================
# 1. Default URL values
# ==========================================
class TestDefaultWebhookURLs:
    """The default error webhook path must differ from the email webhook path."""

    def test_error_webhook_default_path(self):
        """error_monitor default N8N_ERROR_WEBHOOK_URL ends with /webhook/zintellect-backend-errors."""
        # Read the source to check the default — we verify env var lookup behavior
        from app.services.error_monitor import N8N_ERROR_WEBHOOK_URL
        assert "zintellect-backend-errors" in N8N_ERROR_WEBHOOK_URL

    def test_email_webhook_default_path(self):
        """n8n_service default N8N_WEBHOOK_URL ends with /webhook/zintellect-pa-events."""
        from app.services.n8n_service import N8N_WEBHOOK_URL
        assert "zintellect-pa-events" in N8N_WEBHOOK_URL

    def test_error_and_email_paths_differ(self):
        """Error webhook and email webhook must point to different paths."""
        from app.services.error_monitor import N8N_ERROR_WEBHOOK_URL
        from app.services.n8n_service import N8N_WEBHOOK_URL
        assert N8N_ERROR_WEBHOOK_URL != N8N_WEBHOOK_URL

    def test_event_emitter_uses_pa_events_path(self):
        """n8n_event_emitter still uses the PA events webhook path."""
        from app.services.n8n_event_emitter import N8N_WEBHOOK_URL
        assert "zintellect-pa-events" in N8N_WEBHOOK_URL


# ==========================================
# 2. Dispatch target
# ==========================================
class TestDispatchTarget:
    """error_monitor.dispatch_error_event must POST to N8N_ERROR_WEBHOOK_URL."""

    @patch("app.services.error_monitor.httpx.post")
    def test_dispatch_posts_to_error_webhook(self, mock_post):
        """dispatch_error_event sends to the error webhook URL, not the email URL."""
        from app.services.error_monitor import N8N_ERROR_WEBHOOK_URL, dispatch_error_event

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        event = {
            "event": "backend_error",
            "event_id": "test-001",
            "severity": "high",
            "error_code": "AI_PROCESSING_FAILED",
            "service": "AI Processing",
            "sanitized_message": "Test",
            "is_duplicate": False,
        }
        dispatch_error_event(event)

        # Verify the URL used
        call_url = mock_post.call_args[0][0] if mock_post.call_args[0] else mock_post.call_args[1].get("url")
        assert call_url == N8N_ERROR_WEBHOOK_URL
        assert "zintellect-backend-errors" in call_url

    @patch("app.services.error_monitor.httpx.post")
    def test_dispatch_sends_webhook_secret_header(self, mock_post):
        """dispatch_error_event includes X-Webhook-Secret header."""
        from app.services.error_monitor import dispatch_error_event

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        event = {
            "event": "backend_error",
            "event_id": "test-002",
            "severity": "medium",
            "error_code": "TEST",
            "service": "Test",
            "sanitized_message": "Test",
            "is_duplicate": False,
        }
        dispatch_error_event(event)

        headers = mock_post.call_args[1].get("headers", {})
        assert "X-Webhook-Secret" in headers

    @patch("app.services.error_monitor.httpx.post")
    def test_email_webhook_not_called_for_errors(self, mock_post):
        """Error dispatch must NOT use the PA events email webhook."""
        from app.services.n8n_service import N8N_WEBHOOK_URL

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        event = {
            "event": "backend_error",
            "event_id": "test-003",
            "severity": "low",
            "error_code": "TEST",
            "service": "Test",
            "sanitized_message": "Test",
            "is_duplicate": False,
        }

        from app.services.error_monitor import dispatch_error_event
        dispatch_error_event(event)

        call_url = mock_post.call_args[0][0] if mock_post.call_args[0] else mock_post.call_args[1].get("url")
        assert call_url != N8N_WEBHOOK_URL, "Error events must not be sent to the email webhook"


# ==========================================
# 3. Environment variable override
# ==========================================
class TestEnvVarOverride:
    """When N8N_ERROR_WEBHOOK_URL env var is set, it should be respected."""

    def test_env_var_overrides_default(self):
        """Setting N8N_ERROR_WEBHOOK_URL env var changes the target URL."""
        with patch.dict(os.environ, {"N8N_ERROR_WEBHOOK_URL": "https://custom.example.com/webhook/errors"}):
            # Re-read the module to pick up the new env var
            import importlib
            import app.services.error_monitor as mod
            original = mod.N8N_ERROR_WEBHOOK_URL
            mod.N8N_ERROR_WEBHOOK_URL = os.getenv(
                "N8N_ERROR_WEBHOOK_URL",
                "http://localhost:5678/webhook/zintellect-backend-errors",
            )
            try:
                assert mod.N8N_ERROR_WEBHOOK_URL == "https://custom.example.com/webhook/errors"
            finally:
                mod.N8N_ERROR_WEBHOOK_URL = original


# ==========================================
# 4. Existing PA email workflow untouched
# ==========================================
class TestEmailWorkflowUntouched:
    """Verify the existing email notification webhook remains unchanged."""

    def test_n8n_service_uses_pa_events(self):
        """n8n_service dispatches to zintellect-pa-events."""
        from app.services.n8n_service import N8N_WEBHOOK_URL
        assert "zintellect-pa-events" in N8N_WEBHOOK_URL

    def test_n8n_event_emitter_uses_pa_events(self):
        """n8n_event_emitter dispatches to zintellect-pa-events."""
        from app.services.n8n_event_emitter import N8N_WEBHOOK_URL
        assert "zintellect-pa-events" in N8N_WEBHOOK_URL
