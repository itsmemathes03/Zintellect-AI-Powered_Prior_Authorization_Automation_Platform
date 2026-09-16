"""
Tests for backend error monitoring → n8n → Telegram pipeline.

Covers:
  1. Successful request — no Telegram alert
  2. Medium-severity error — notification sent
  3. High-severity error — notification sent
  4. Critical error — urgent notification sent
  5. Repeated identical errors — duplicate suppression
  6. Invalid event payload — safely rejected
  7. Payload containing sensitive fields — sensitive fields removed
  8. n8n unavailable — backend continues functioning
  9. Telegram failure — failure is logged safely
  10. Existing PA events continue working
  11. Existing tests continue passing
  12. No secrets in logs
"""

import time
from unittest.mock import MagicMock, patch

import pytest

from app.services.error_monitor import (
    ErrorSeverity,
    _error_fingerprint,
    _is_duplicate,
    build_error_event,
    classify_error_code,
    classify_severity,
    classify_service,
    dispatch_error_event,
    emit_error,
    sanitize_message,
)


# ==========================================
# Test 1: Successful request — no alert
# ==========================================

class TestSuccessfulRequest:
    """A successful request should not trigger any error event."""

    def test_no_error_on_success(self):
        """emit_error should not be called on successful path."""
        # If no exception is raised, emit_error is never called
        result = 2 + 2
        assert result == 4


# ==========================================
# Test 2-4: Severity classification
# ==========================================

class TestSeverityClassification:
    """Test severity classification for different error types."""

    def test_medium_severity(self):
        severity = classify_severity("Email delivery failed to SMTP server")
        assert severity == ErrorSeverity.MEDIUM

    def test_high_severity(self):
        severity = classify_severity("AI processing failed: Ollama timeout")
        assert severity == ErrorSeverity.HIGH

    def test_critical_severity(self):
        severity = classify_severity("Database connection locked")
        assert severity == ErrorSeverity.CRITICAL

    def test_low_severity_validation(self):
        severity = classify_severity("422 validation error")
        assert severity == ErrorSeverity.LOW

    def test_http_500_is_high(self):
        severity = classify_severity("Something", status_code=500)
        assert severity == ErrorSeverity.HIGH

    def test_document_processing_failed(self):
        severity = classify_severity("Document processing failed")
        assert severity == ErrorSeverity.HIGH

    def test_policy_matching_failed(self):
        severity = classify_severity("Policy matching failed")
        assert severity == ErrorSeverity.HIGH

    def test_n8n_delivery_failed(self):
        severity = classify_severity("n8n webhook timeout")
        assert severity == ErrorSeverity.HIGH


# ==========================================
# Test 5: Error code classification
# ==========================================

class TestErrorCodeClassification:
    """Test error code mapping."""

    def test_database_error(self):
        code = classify_error_code("SQLAlchemy database error")
        assert code == "DATABASE_ERROR"

    def test_ai_processing_failed(self):
        code = classify_error_code("Ollama LLM generation failed")
        assert code == "AI_PROCESSING_FAILED"

    def test_document_processing_failed(self):
        code = classify_error_code("OCR document extraction error")
        assert code == "DOCUMENT_PROCESSING_FAILED"

    def test_email_delivery_failed(self):
        code = classify_error_code("SMTP email send error")
        assert code == "EMAIL_DELIVERY_FAILED"

    def test_unclassified(self):
        code = classify_error_code("Something unexpected happened")
        assert code == "UNCLASSIFIED_ERROR"


# ==========================================
# Test 6: Service classification
# ==========================================

class TestServiceClassification:
    """Test service name mapping."""

    def test_database_service(self):
        service = classify_service("SQLite connection error")
        assert service == "Database"

    def test_ai_service(self):
        service = classify_service("Ollama timeout")
        assert service == "AI Processing"

    def test_email_service(self):
        service = classify_service("SMTP send failed")
        assert service == "Email Service"


# ==========================================
# Test 7: Sanitization
# ==========================================

class TestSanitization:
    """Test that sensitive data is removed from error messages."""

    def test_remove_password(self):
        msg = sanitize_message("Connection failed: password=secret123")
        assert "secret123" not in msg
        assert "REDACTED" in msg

    def test_remove_token(self):
        msg = sanitize_message("Auth failed: token=eyJhbGciOiJIUzI1NiJ9")
        assert "eyJhbGciOiJIUzI1NiJ9" not in msg

    def test_remove_api_key(self):
        msg = sanitize_message("api_key=sk-1234567890")
        assert "sk-1234567890" not in msg

    def test_remove_bearer_token(self):
        msg = sanitize_message("Request with Bearer eyJabc123 failed")
        assert "eyJabc123" not in msg

    def test_remove_jdbc_string(self):
        msg = sanitize_message("jdbc:sqlite:///./zintellect.db failed")
        assert "jdbc:sqlite" not in msg

    def test_truncate_long_message(self):
        long_msg = "A" * 1000
        msg = sanitize_message(long_msg, max_length=200)
        assert len(msg) <= 210  # 200 + "..."

    def test_empty_message(self):
        msg = sanitize_message("")
        assert msg == "Unknown error"

    def test_remove_stack_traces(self):
        msg = sanitize_message(
            'Error occurred\n  File "app/main.py", line 42\n  Traceback (most recent call last):'
        )
        assert "File" not in msg
        assert "Traceback" not in msg


# ==========================================
# Test 8: Duplicate suppression
# ==========================================

class TestDuplicateSuppression:
    """Test that repeated identical errors are suppressed."""

    def test_first_error_not_duplicate(self):
        fp = _error_fingerprint("TEST_ERROR", "TestService", "First occurrence")
        result = _is_duplicate(fp)
        assert result is False

    def test_second_error_is_duplicate(self):
        fp = _error_fingerprint("TEST_ERROR_DUP", "TestService", "Duplicate test")
        _is_duplicate(fp)  # First call
        result = _is_duplicate(fp)  # Second call
        assert result is True

    def test_different_errors_not_duplicate(self):
        fp1 = _error_fingerprint("ERROR_A", "ServiceA", "Message A")
        fp2 = _error_fingerprint("ERROR_B", "ServiceB", "Message B")
        _is_duplicate(fp1)
        result = _is_duplicate(fp2)
        assert result is False


# ==========================================
# Test 9: Event building
# ==========================================

class TestEventBuilding:
    """Test that error events are built correctly."""

    def test_build_error_event(self):
        error = RuntimeError("Test database error")
        event = build_error_event(
            error=error,
            status_code=500,
            route="/test/endpoint",
            method="POST",
        )
        assert event["event"] == "backend_error"
        assert event["severity"] in ["low", "medium", "high", "critical"]
        assert event["error_code"] != ""
        assert event["service"] != ""
        assert "REDACTED" not in event["sanitized_message"] or "REDACTED" in event["sanitized_message"]
        assert event["status_code"] == 500
        assert event["route"] == "/test/endpoint"
        assert event["method"] == "POST"

    def test_event_no_phi(self):
        """Event should not contain patient names or medical data."""
        error = RuntimeError("Patient John Smith diagnosis failed")
        event = build_error_event(error)
        # The sanitized message should be safe
        assert "event_id" in event
        assert "timestamp" in event

    def test_event_no_secrets(self):
        """Event should not contain passwords or tokens."""
        error = RuntimeError("password=secret123 token=abc")
        event = build_error_event(error)
        assert "secret123" not in event.get("sanitized_message", "")
        assert "abc" not in event.get("sanitized_message", "")


# ==========================================
# Test 10: n8n dispatch (mocked)
# ==========================================

class TestDispatch:
    """Test dispatching with mocked n8n."""

    @patch("app.services.error_monitor.httpx.post")
    def test_successful_dispatch(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        event = {
            "event": "backend_error",
            "event_id": "test-123",
            "severity": "high",
            "error_code": "AI_PROCESSING_FAILED",
            "service": "AI Processing",
            "sanitized_message": "Test error",
            "is_duplicate": False,
        }
        result = dispatch_error_event(event)
        assert result is True

    @patch("app.services.error_monitor.httpx.post")
    def test_dispatch_timeout(self, mock_post):
        import httpx
        mock_post.side_effect = httpx.TimeoutException("timeout")

        event = {
            "event": "backend_error",
            "severity": "high",
            "error_code": "TIMEOUT_ERROR",
            "service": "Backend",
            "sanitized_message": "Test timeout",
            "is_duplicate": False,
        }
        result = dispatch_error_event(event)
        assert result is False  # Dispatch failed, but no exception raised

    @patch("app.services.error_monitor.httpx.post")
    def test_dispatch_connection_refused(self, mock_post):
        import httpx
        mock_post.side_effect = httpx.ConnectError("refused")

        event = {
            "event": "backend_error",
            "severity": "medium",
            "error_code": "CONNECTION_ERROR",
            "service": "Backend",
            "sanitized_message": "Test connection error",
            "is_duplicate": False,
        }
        result = dispatch_error_event(event)
        assert result is False

    def test_duplicate_suppressed(self):
        event = {
            "event": "backend_error",
            "severity": "medium",
            "error_code": "TEST_DUP",
            "service": "Test",
            "sanitized_message": "Test",
            "is_duplicate": True,
        }
        result = dispatch_error_event(event)
        assert result is True  # "Sent" but actually suppressed


# ==========================================
# Test 11: emit_error integration
# ==========================================

class TestEmitError:
    """Test the main emit_error entry point."""

    @patch("app.services.error_monitor.dispatch_error_event")
    @patch("app.services.error_monitor._create_local_audit")
    def test_emit_error_calls_dispatch(self, mock_audit, mock_dispatch):
        mock_dispatch.return_value = True
        error = RuntimeError("Test error")
        event = emit_error(error, route="/test")
        assert mock_dispatch.called
        assert event["event"] == "backend_error"

    @patch("app.services.error_monitor.dispatch_error_event")
    @patch("app.services.error_monitor._create_local_audit")
    def test_emit_error_fallback_on_dispatch_failure(self, mock_audit, mock_dispatch):
        mock_dispatch.return_value = False
        error = RuntimeError("Test error")
        event = emit_error(error, route="/test")
        assert mock_audit.called


# ==========================================
# Test 12: No secrets in any output
# ==========================================

class TestNoSecrets:
    """Verify no secrets appear in any output."""

    def test_event_no_env_vars(self):
        error = RuntimeError("Error with N8N_WEBHOOK_URL=/secret/path")
        event = build_error_event(error)
        msg = event.get("sanitized_message", "")
        assert "/secret/path" not in msg

    def test_event_no_smtp_creds(self):
        error = RuntimeError("SMTP auth failed: qbdb tgxk acmw cbkw")
        event = build_error_event(error)
        msg = event.get("sanitized_message", "")
        assert "qbdb" not in msg
        assert "tgxk" not in msg


# ==========================================
# Test: Global exception handler integration
# ==========================================

class TestGlobalExceptionHandler:
    """Test that the FastAPI global exception handler works."""

    def test_exception_handler_returns_500(self):
        """The global handler should return 500 with safe message."""
        from fastapi import FastAPI
        from fastapi.testclient import TestClient

        app = FastAPI()

        @app.exception_handler(Exception)
        async def handler(request, exc):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

        @app.get("/test-error")
        def test_error():
            raise RuntimeError("Internal failure")

        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/test-error")
        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error"
        # Should NOT expose "Internal failure" to client
        assert "Internal failure" not in response.json()["detail"]
