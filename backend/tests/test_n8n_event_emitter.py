"""
n8n Unified Event Emitter — Comprehensive Tests

Tests all 27 events, payload standardization, idempotency,
and fallback handling for the Zintellect AI n8n automation system.

Run: python -m pytest tests/test_n8n_event_emitter.py -v
"""

import os
import sys
import uuid
from unittest.mock import patch, MagicMock

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-n8n-emitter")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.n8n_event_emitter import (
    emit_event,
    dispatch_to_n8n,
    build_envelope,
    _create_local_events,
    _map_event_to_notification,
    Events,
)


# ==========================================
# 1. EVENT NAME CONSTANTS
# ==========================================

class TestEventNames:
    """Verify all 27 event names are defined."""

    def test_all_27_events_defined(self):
        """Events class should define all 27 canonical event names."""
        event_names = [
            Events.PATIENT_REGISTERED,
            Events.PROVIDER_REGISTERED,
            Events.DOCTOR_REGISTERED,
            Events.PRIOR_AUTHORIZATION_CREATED,
            Events.DOCUMENT_UPLOADED,
            Events.DOCUMENT_PROCESSING_STARTED,
            Events.DOCUMENT_PROCESSING_COMPLETED,
            Events.DOCUMENT_QUALITY_FAILED,
            Events.EVIDENCE_EXTRACTION_COMPLETED,
            Events.EVIDENCE_GAP_DETECTED,
            Events.CONTRADICTION_DETECTED,
            Events.AI_RECOMMENDATION_GENERATED,
            Events.AWAITING_HUMAN_REVIEW,
            Events.PRIOR_AUTHORIZATION_APPROVED,
            Events.PRIOR_AUTHORIZATION_REJECTED,
            Events.ADDITIONAL_INFORMATION_REQUESTED,
            Events.ADDITIONAL_INFORMATION_SUBMITTED,
            Events.PRIOR_AUTHORIZATION_RESUBMITTED,
            Events.POLICY_UPLOADED,
            Events.POLICY_UPDATED,
            Events.POLICY_VERSION_CREATED,
            Events.POLICY_CHANGE_DETECTED,
            Events.APPEAL_ANALYSIS_COMPLETED,
            Events.PROVIDER_COMMUNICATION_SENT,
            Events.SLA_WARNING,
            Events.NOTIFICATION_SENT,
            Events.NOTIFICATION_FAILED,
        ]
        assert len(event_names) == 27
        # All should be unique
        assert len(set(event_names)) == 27
        # All should be snake_case
        for name in event_names:
            assert name == name.lower(), f"Event '{name}' should be snake_case"
            assert " " not in name, f"Event '{name}' should not contain spaces"


# ==========================================
# 2. PAYLOAD STANDARDIZATION
# ==========================================

class TestPayloadStandardization:
    """Verify all payloads follow the standardized envelope."""

    def test_envelope_has_required_fields(self):
        """Every envelope must have event, event_id, timestamp, schema_version."""
        envelope = build_envelope(
            event=Events.PRIOR_AUTHORIZATION_APPROVED,
            request_id="test-req-123",
            status="Approved",
        )
        required_fields = [
            "event", "event_id", "timestamp", "environment",
            "source", "entity_type", "entity_id", "request_id",
            "status", "actor_role", "schema_version",
        ]
        for field in required_fields:
            assert field in envelope, f"Missing required field: {field}"

    def test_event_id_is_uuid(self):
        """event_id must be a valid UUID."""
        envelope = build_envelope(event=Events.PATIENT_REGISTERED)
        uuid_obj = uuid.UUID(envelope["event_id"])
        assert str(uuid_obj) == envelope["event_id"]

    def test_timestamp_is_iso8601(self):
        """timestamp must be ISO-8601 format."""
        envelope = build_envelope(event=Events.PATIENT_REGISTERED)
        assert "T" in envelope["timestamp"]
        assert envelope["timestamp"].endswith("Z") or "+" in envelope["timestamp"]

    def test_source_is_zintellect(self):
        """source must be 'zintellect-backend'."""
        envelope = build_envelope(event=Events.PATIENT_REGISTERED)
        assert envelope["source"] == "zintellect-backend"

    def test_schema_version_is_1_0(self):
        """schema_version must be '1.0'."""
        envelope = build_envelope(event=Events.PATIENT_REGISTERED)
        assert envelope["schema_version"] == "1.0"

    def test_no_phi_in_envelope(self):
        """Envelope must not contain PHI fields."""
        envelope = build_envelope(
            event=Events.PRIOR_AUTHORIZATION_APPROVED,
            extra={
                "clinical_text": "Patient has diabetes",  # Should be stripped
                "password": "secret123",  # Should be stripped
                "diagnosis": "E11.9",  # Should be stripped
                "procedure_code": "99213",  # Should be kept (safe)
                "confidence_score": 85.0,  # Should be kept (safe)
            },
        )
        assert "clinical_text" not in envelope
        assert "password" not in envelope
        assert "diagnosis" not in envelope
        assert "procedure_code" in envelope
        assert "confidence_score" in envelope


# ==========================================
# 3. DISPATCH AND FALLBACK
# ==========================================

class TestDispatchAndFallback:
    """Test dispatch_to_n8n and fallback behavior."""

    def test_dispatch_success(self):
        """Successful dispatch returns True."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        with patch("app.services.n8n_event_emitter.httpx.post", return_value=mock_response):
            result = dispatch_to_n8n({"event": "test", "event_id": "123"})
            assert result is True

    def test_dispatch_http_error(self):
        """HTTP error returns False."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        with patch("app.services.n8n_event_emitter.httpx.post", return_value=mock_response):
            result = dispatch_to_n8n({"event": "test", "event_id": "123"})
            assert result is False

    def test_dispatch_timeout(self):
        """Timeout returns False (never raises)."""
        import httpx
        with patch("app.services.n8n_event_emitter.httpx.post", side_effect=httpx.TimeoutException("timeout")):
            result = dispatch_to_n8n({"event": "test", "event_id": "123"})
            assert result is False

    def test_dispatch_connection_refused(self):
        """Connection refused returns False (never raises)."""
        import httpx
        with patch("app.services.n8n_event_emitter.httpx.post", side_effect=httpx.ConnectError("refused")):
            result = dispatch_to_n8n({"event": "test", "event_id": "123"})
            assert result is False

    def test_emit_event_calls_dispatch(self):
        """emit_event calls dispatch_to_n8n."""
        with patch("app.services.n8n_event_emitter.dispatch_to_n8n", return_value=True) as mock_dispatch:
            with patch("app.services.n8n_event_emitter._create_local_events") as mock_local:
                payload = emit_event(event=Events.PATIENT_REGISTERED, entity_id="pat-123")
                mock_dispatch.assert_called_once()
                mock_local.assert_not_called()  # No fallback on success

    def test_emit_event_fallback_on_failure(self):
        """emit_event creates local events when dispatch fails."""
        with patch("app.services.n8n_event_emitter.dispatch_to_n8n", return_value=False):
            with patch("app.services.n8n_event_emitter._create_local_events") as mock_local:
                emit_event(event=Events.PATIENT_REGISTERED, entity_id="pat-456")
                mock_local.assert_called_once()


# ==========================================
# 4. EVENT-TO-NOTIFICATION MAPPING
# ==========================================

class TestEventNotificationMapping:
    """Test _map_event_to_notification for all event types."""

    def test_patient_registered(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.PATIENT_REGISTERED,
            {"request_id": "", "patient_id": "p1", "insurance_provider": "BCBS"},
        )
        assert ntype == "PATIENT_REGISTERED"
        assert "BCBS" in msg

    def test_provider_registered(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.PROVIDER_REGISTERED,
            {"request_id": "", "provider_id": "prov1"},
        )
        assert ntype == "PROVIDER_REGISTERED"

    def test_doctor_registered(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.DOCTOR_REGISTERED,
            {"request_id": "", "doctor_id": "doc1"},
        )
        assert ntype == "DOCTOR_REGISTERED"

    def test_pa_approved(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.PRIOR_AUTHORIZATION_APPROVED,
            {"request_id": "req1", "status": "Approved"},
        )
        assert ntype == "N8N_APPROVED"
        assert "APPROVED" in msg or "Approved" in msg

    def test_pa_rejected(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.PRIOR_AUTHORIZATION_REJECTED,
            {"request_id": "req1", "status": "Rejected"},
        )
        assert ntype == "N8N_DENIED"

    def test_additional_info_requested(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.ADDITIONAL_INFORMATION_REQUESTED,
            {"request_id": "req1"},
        )
        assert ntype == "N8N_MISSING_INFO"

    def test_policy_uploaded(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.POLICY_UPLOADED,
            {"request_id": "", "policy_id": "pol1", "procedure_name": "MRI"},
        )
        assert ntype == "POLICY_UPLOADED"

    def test_sla_warning(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.SLA_WARNING,
            {"request_id": "req1"},
        )
        assert ntype == "SLA_WARNING"

    def test_evidence_gap(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.EVIDENCE_GAP_DETECTED,
            {"request_id": "req1"},
        )
        assert ntype == "EVIDENCE_GAP"

    def test_contradiction_detected(self):
        ntype, msg, action, desc = _map_event_to_notification(
            Events.CONTRADICTION_DETECTED,
            {"request_id": "req1"},
        )
        assert ntype == "CONTRADICTION"


# ==========================================
# 5. BACKWARD COMPATIBILITY
# ==========================================

class TestBackwardCompatibility:
    """Verify notify_n8n, notify_patient_registered, notify_policy_uploaded still work."""

    def test_notify_n8n_emits_approved(self):
        """notify_n8n with Approved status emits PRIOR_AUTHORIZATION_APPROVED."""
        with patch("app.services.n8n_event_emitter.emit_event") as mock_emit:
            from app.services.n8n_event_emitter import notify_n8n
            notify_n8n(
                request_id="req-123",
                status="Approved",
                provider_id="prov-1",
            )
            mock_emit.assert_called_once()
            call_kwargs = mock_emit.call_args
            assert call_kwargs[1]["event"] == Events.PRIOR_AUTHORIZATION_APPROVED

    def test_notify_n8n_emits_rejected(self):
        """notify_n8n with Rejected status emits PRIOR_AUTHORIZATION_REJECTED."""
        with patch("app.services.n8n_event_emitter.emit_event") as mock_emit:
            from app.services.n8n_event_emitter import notify_n8n
            notify_n8n(
                request_id="req-456",
                status="Rejected",
                provider_id="prov-2",
            )
            call_kwargs = mock_emit.call_args
            assert call_kwargs[1]["event"] == Events.PRIOR_AUTHORIZATION_REJECTED

    def test_notify_patient_registered(self):
        """notify_patient_registered emits PATIENT_REGISTERED."""
        with patch("app.services.n8n_event_emitter.emit_event") as mock_emit:
            from app.services.n8n_event_emitter import notify_patient_registered
            notify_patient_registered(
                patient_id="pat-1",
                patient_name="Test Patient",
                insurance_provider="BCBS",
            )
            call_kwargs = mock_emit.call_args
            assert call_kwargs[1]["event"] == Events.PATIENT_REGISTERED

    def test_notify_policy_uploaded(self):
        """notify_policy_uploaded emits POLICY_UPLOADED."""
        with patch("app.services.n8n_event_emitter.emit_event") as mock_emit:
            from app.services.n8n_event_emitter import notify_policy_uploaded
            notify_policy_uploaded(
                policy_id="pol-1",
                provider_id="prov-1",
                insurance_provider="Aetna",
                procedure_name="MRI Brain",
            )
            call_kwargs = mock_emit.call_args
            assert call_kwargs[1]["event"] == Events.POLICY_UPLOADED


# ==========================================
# 6. DUPLICATE EVENT SAFETY
# ==========================================

class TestDuplicateEventSafety:
    """Verify duplicate events are handled safely."""

    def test_two_dispatches_with_different_event_ids(self):
        """Each emit_event call generates a unique event_id."""
        payloads = []
        for _ in range(5):
            with patch("app.services.n8n_event_emitter.dispatch_to_n8n", return_value=True) as mock:
                emit_event(event=Events.PATIENT_REGISTERED, entity_id="pat-1")
                call_args = mock.call_args[0][0]
                payloads.append(call_args["event_id"])

        # All event_ids should be unique
        assert len(set(payloads)) == 5


# ==========================================
# 7. HUMAN DECISION EVENTS
# ==========================================

class TestHumanDecisionEvents:
    """Verify human decision events follow HCI-03 rules."""

    def test_approved_event_has_reviewer_id(self):
        """Approval event must include reviewer_id."""
        envelope = build_envelope(
            event=Events.PRIOR_AUTHORIZATION_APPROVED,
            request_id="req-1",
            status="Approved",
            actor_role="provider",
            extra={"reviewer_id": "reviewer-1", "review_notes": "Looks good"},
        )
        assert envelope.get("reviewer_id") == "reviewer-1"
        assert envelope.get("review_notes") == "Looks good"

    def test_rejected_event_has_reason(self):
        """Rejection event must include review_notes."""
        envelope = build_envelope(
            event=Events.PRIOR_AUTHORIZATION_REJECTED,
            request_id="req-2",
            status="Rejected",
            actor_role="provider",
            extra={"reviewer_id": "reviewer-1", "review_notes": "Missing prior imaging"},
        )
        assert envelope.get("review_notes") == "Missing prior imaging"

    def test_request_info_event_not_rejection(self):
        """Request Info event should NOT be classified as rejection."""
        ntype, msg, action, desc = _map_event_to_notification(
            Events.ADDITIONAL_INFORMATION_REQUESTED,
            {"request_id": "req-3"},
        )
        assert ntype == "N8N_MISSING_INFO"
        assert "denied" not in ntype.lower()
        assert "rejected" not in ntype.lower()


# ==========================================
# 8. PHI SECURITY AUDIT
# ==========================================

class TestPHISecurity:
    """Verify no PHI leaks into event payloads."""

    PHI_FIELDS = [
        "clinical_text", "ocr_text", "medical_history", "diagnosis_details",
        "password", "secret_key", "jwt_token", "api_key", "smtp_password",
        "full_patient_name", "social_security", "ssn",
    ]

    def test_no_phi_in_envelope(self):
        """Envelope builder strips PHI fields."""
        for phi_field in self.PHI_FIELDS:
            envelope = build_envelope(
                event=Events.PATIENT_REGISTERED,
                extra={phi_field: "SENSITIVE_DATA"},
            )
            assert phi_field not in envelope, f"PHI field '{phi_field}' leaked into envelope"

    def test_safe_fields_preserved(self):
        """Safe metadata fields should be preserved."""
        envelope = build_envelope(
            event=Events.PRIOR_AUTHORIZATION_APPROVED,
            extra={
                "procedure_code": "99213",
                "confidence_score": 85.0,
                "insurance_provider": "BCBS",
            },
        )
        assert envelope.get("procedure_code") == "99213"
        assert envelope.get("confidence_score") == 85.0
        assert envelope.get("insurance_provider") == "BCBS"
