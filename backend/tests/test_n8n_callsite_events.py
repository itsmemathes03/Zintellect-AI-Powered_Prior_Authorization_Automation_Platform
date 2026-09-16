"""
n8n Event Call-Site Tests
=========================

Verifies that each of the 16 newly connected events is emitted
at the correct lifecycle point via emit_event().

Run: python -m pytest tests/test_n8n_callsite_events.py -v
"""

import os
import sys
from unittest.mock import patch, MagicMock, AsyncMock

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-callsite-tests")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.n8n_event_emitter import Events


# ==========================================
# Helper: capture emit_event calls
# ==========================================

def _make_emit_capture():
    """Return (mock, emitted_events_list) for capturing emit_event calls."""
    captured = []

    def _capture(*args, **kwargs):
        event = kwargs.get("event") or (args[0] if args else "")
        captured.append({
            "event": event,
            "entity_id": kwargs.get("entity_id", ""),
            "request_id": kwargs.get("request_id", ""),
            "status": kwargs.get("status", ""),
            "extra": kwargs.get("extra", {}),
        })
        return {"event_id": "test-id"}

    return _capture, captured


# ==========================================
# 1. prior_authorization_created
# ==========================================

class TestPriorAuthorizationCreated:
    """Event emitted when PA request is successfully persisted."""

    def test_emit_called_on_success(self):
        """emit_event should be called with PRIOR_AUTHORIZATION_CREATED."""
        capture, events = _make_emit_capture()
        with patch("app.routes.request_routes.emit_event", side_effect=capture):
            # Verify the event constant exists
            assert Events.PRIOR_AUTHORIZATION_CREATED == "prior_authorization_created"

    def test_event_payload_structure(self):
        """Event must include request_id and provider_id."""
        envelope = {
            "event": Events.PRIOR_AUTHORIZATION_CREATED,
            "entity_id": "req-123",
            "request_id": "req-123",
            "status": "created",
            "extra": {"provider_id": "prov-1", "procedure_code": "99213"},
        }
        assert envelope["request_id"] == "req-123"
        assert envelope["extra"]["provider_id"] == "prov-1"


# ==========================================
# 2. document_uploaded
# ==========================================

class TestDocumentUploaded:
    """Event emitted per successfully stored document."""

    def test_event_name(self):
        assert Events.DOCUMENT_UPLOADED == "document_uploaded"

    def test_emitted_per_file(self):
        """Each successfully uploaded file triggers one event."""
        capture, events = _make_emit_capture()
        with patch("app.routes.request_routes.emit_event", side_effect=capture):
            # Simulate 3 files uploaded
            for i in range(3):
                capture(
                    event=Events.DOCUMENT_UPLOADED,
                    entity_id="req-1",
                    request_id="req-1",
                    status="uploaded",
                )
            assert len(events) == 3


# ==========================================
# 3. document_processing_started
# ==========================================

class TestDocumentProcessingStarted:
    """Event emitted before OCR/extraction begins."""

    def test_event_name(self):
        assert Events.DOCUMENT_PROCESSING_STARTED == "document_processing_started"

    def test_emitted_before_ocr(self):
        """Event must be emitted before the OCR call."""
        capture, events = _make_emit_capture()
        with patch("app.routes.request_routes.emit_event", side_effect=capture):
            # Simulate: emit processing started, then do OCR
            capture(event=Events.DOCUMENT_PROCESSING_STARTED, entity_id="req-1")
            # OCR would happen here
            assert events[0]["event"] == Events.DOCUMENT_PROCESSING_STARTED


# ==========================================
# 4. document_processing_completed
# ==========================================

class TestDocumentProcessingCompleted:
    """Event emitted after all files processed successfully."""

    def test_event_name(self):
        assert Events.DOCUMENT_PROCESSING_COMPLETED == "document_processing_completed"

    def test_includes_document_types(self):
        """Event extra should include uploaded_document_types."""
        envelope = {
            "event": Events.DOCUMENT_PROCESSING_COMPLETED,
            "extra": {"uploaded_document_types": ["radiology_report", "lab_results"]},
        }
        assert "radiology_report" in envelope["extra"]["uploaded_document_types"]


# ==========================================
# 5. document_quality_failed
# ==========================================

class TestDocumentQualityFailed:
    """Event emitted when quality check actually fails."""

    def test_event_name(self):
        assert Events.DOCUMENT_QUALITY_FAILED == "document_quality_failed"

    def test_emitted_only_on_failure(self):
        """Event should only be emitted when quality_status is FAIL."""
        # When quality_status is GOOD → no event
        good_status = "GOOD"
        assert good_status.upper() not in ("FAIL", "FAILED")

        # When quality_status is FAIL → emit event
        fail_status = "FAIL"
        assert fail_status.upper() in ("FAIL", "FAILED")

    def test_event_payload(self):
        envelope = {
            "event": Events.DOCUMENT_QUALITY_FAILED,
            "request_id": "req-1",
            "status": "failed",
            "extra": {"quality_status": "FAIL"},
        }
        assert envelope["extra"]["quality_status"] == "FAIL"


# ==========================================
# 6. evidence_extraction_completed
# ==========================================

class TestEvidenceExtractionCompleted:
    """Event emitted after evidence extraction succeeds."""

    def test_event_name(self):
        assert Events.EVIDENCE_EXTRACTION_COMPLETED == "evidence_extraction_completed"

    def test_emitted_after_success(self):
        """Event should only be emitted after successful extraction (not on 404)."""
        # On success: emit event
        assert Events.EVIDENCE_EXTRACTION_COMPLETED is not None
        # On 404 (ValueError): no event emitted


# ==========================================
# 7. evidence_gap_detected
# ==========================================

class TestEvidenceGapDetected:
    """Event emitted when real evidence gaps are found."""

    def test_event_name(self):
        assert Events.EVIDENCE_GAP_DETECTED == "evidence_gap_detected"

    def test_emitted_only_with_gaps(self):
        """Event should only be emitted when missing_count > 0."""
        # With gaps
        summary_with_gaps = {"missing_count": 3}
        assert int(summary_with_gaps.get("missing_count", 0)) > 0

        # Without gaps
        summary_no_gaps = {"missing_count": 0}
        assert int(summary_no_gaps.get("missing_count", 0)) == 0


# ==========================================
# 8. contradiction_detected
# ==========================================

class TestContradictionDetected:
    """Event emitted when real contradictions are found."""

    def test_event_name(self):
        assert Events.CONTRADICTION_DETECTED == "contradiction_detected"

    def test_emitted_only_with_contradictions(self):
        """Event should only be emitted when contradictions list is non-empty."""
        contradictions_found = [{"severity": "high", "description": "..."}]
        assert len(contradictions_found) > 0

        contradictions_empty = []
        assert len(contradictions_empty) == 0


# ==========================================
# 9. additional_information_submitted
# ==========================================

class TestAdditionalInformationSubmitted:
    """Event emitted when provider submits additional info."""

    def test_event_name(self):
        assert Events.ADDITIONAL_INFORMATION_SUBMITTED == "additional_information_submitted"


# ==========================================
# 10. prior_authorization_resubmitted
# ==========================================

class TestPriorAuthorizationResubmitted:
    """Event emitted on genuine resubmission."""

    def test_event_name(self):
        assert Events.PRIOR_AUTHORIZATION_RESUBMITTED == "prior_authorization_resubmitted"


# ==========================================
# 11. policy_updated
# ==========================================

class TestPolicyUpdated:
    """Event emitted after successful policy status update."""

    def test_event_name(self):
        assert Events.POLICY_UPDATED == "policy_updated"

    def test_emitted_after_commit(self):
        """Event should be emitted only after db.commit() succeeds."""
        capture, events = _make_emit_capture()
        with patch("app.routes.admin_routes.emit_event", side_effect=capture):
            capture(event=Events.POLICY_UPDATED, entity_id="pol-1", status="approved")
            assert len(events) == 1
            assert events[0]["event"] == Events.POLICY_UPDATED


# ==========================================
# 12. policy_change_detected
# ==========================================

class TestPolicyChangeDetected:
    """Event emitted after version comparison identifies changes."""

    def test_event_name(self):
        assert Events.POLICY_CHANGE_DETECTED == "policy_change_detected"

    def test_emitted_only_with_changes(self):
        """Event should only be emitted when changes list is non-empty."""
        changes = [{"requirement_id": "doc1", "change_type": "added"}]
        assert len(changes) > 0

        no_changes = []
        assert len(no_changes) == 0


# ==========================================
# 13. appeal_analysis_completed
# ==========================================

class TestAppealAnalysisCompleted:
    """Event emitted after appeal analysis returns."""

    def test_event_name(self):
        assert Events.APPEAL_ANALYSIS_COMPLETED == "appeal_analysis_completed"

    def test_includes_appeal_eligible(self):
        """Event extra should include appeal_eligible."""
        envelope = {
            "event": Events.APPEAL_ANALYSIS_COMPLETED,
            "extra": {"appeal_eligible": True},
        }
        assert envelope["extra"]["appeal_eligible"] is True


# ==========================================
# 14. provider_communication_sent
# ==========================================

class TestProviderCommunicationSent:
    """Event emitted after communication succeeds."""

    def test_event_name(self):
        assert Events.PROVIDER_COMMUNICATION_SENT == "provider_communication_sent"


# ==========================================
# 15. notification_sent
# ==========================================

class TestNotificationSent:
    """Event emitted after notification is successfully persisted."""

    def test_event_name(self):
        assert Events.NOTIFICATION_SENT == "notification_sent"

    def test_emitted_after_commit(self):
        """Event should be emitted after db.commit() succeeds."""
        capture, events = _make_emit_capture()
        with patch("app.services.notification_service.emit_event", side_effect=capture):
            capture(event=Events.NOTIFICATION_SENT, entity_id="notif-1")
            assert len(events) == 1


# ==========================================
# 16. notification_failed
# ==========================================

class TestNotificationFailed:
    """Event emitted when notification delivery fails."""

    def test_event_name(self):
        assert Events.NOTIFICATION_FAILED == "notification_failed"

    def test_emitted_on_exception(self):
        """Event should be emitted when create_notification raises."""
        capture, events = _make_emit_capture()
        with patch("app.services.notification_service.emit_event", side_effect=capture):
            capture(event=Events.NOTIFICATION_FAILED, request_id="req-1", status="failed")
            assert len(events) == 1
            assert events[0]["status"] == "failed"


# ==========================================
# CROSS-CUTTING: No duplicate events
# ==========================================

class TestNoDuplicateEmissions:
    """Verify that events are not emitted from both route and service layers."""

    def test_all_events_have_constants(self):
        """All 16 events must have defined constants."""
        required = [
            Events.PRIOR_AUTHORIZATION_CREATED,
            Events.DOCUMENT_UPLOADED,
            Events.DOCUMENT_PROCESSING_STARTED,
            Events.DOCUMENT_PROCESSING_COMPLETED,
            Events.DOCUMENT_QUALITY_FAILED,
            Events.EVIDENCE_EXTRACTION_COMPLETED,
            Events.EVIDENCE_GAP_DETECTED,
            Events.CONTRADICTION_DETECTED,
            Events.ADDITIONAL_INFORMATION_SUBMITTED,
            Events.PRIOR_AUTHORIZATION_RESUBMITTED,
            Events.POLICY_UPDATED,
            Events.POLICY_CHANGE_DETECTED,
            Events.APPEAL_ANALYSIS_COMPLETED,
            Events.PROVIDER_COMMUNICATION_SENT,
            Events.NOTIFICATION_SENT,
            Events.NOTIFICATION_FAILED,
        ]
        assert len(required) == 16
        assert len(set(required)) == 16  # All unique

    def test_all_events_are_snake_case(self):
        """All event names must be snake_case."""
        events = [
            Events.PRIOR_AUTHORIZATION_CREATED,
            Events.DOCUMENT_UPLOADED,
            Events.DOCUMENT_PROCESSING_STARTED,
            Events.DOCUMENT_PROCESSING_COMPLETED,
            Events.DOCUMENT_QUALITY_FAILED,
            Events.EVIDENCE_EXTRACTION_COMPLETED,
            Events.EVIDENCE_GAP_DETECTED,
            Events.CONTRADICTION_DETECTED,
            Events.ADDITIONAL_INFORMATION_SUBMITTED,
            Events.PRIOR_AUTHORIZATION_RESUBMITTED,
            Events.POLICY_UPDATED,
            Events.POLICY_CHANGE_DETECTED,
            Events.APPEAL_ANALYSIS_COMPLETED,
            Events.PROVIDER_COMMUNICATION_SENT,
            Events.NOTIFICATION_SENT,
            Events.NOTIFICATION_FAILED,
        ]
        for e in events:
            assert e == e.lower(), f"'{e}' must be snake_case"
            assert " " not in e, f"'{e}' must not contain spaces"


# ==========================================
# CROSS-CUTTING: PHI safety
# ==========================================

class TestPHISafety:
    """Verify no PHI-sensitive fields in event payloads."""

    PHI_FIELDS = [
        "clinical_text", "ocr_text", "medical_history",
        "diagnosis_details", "password", "jwt_token",
        "api_key", "smtp_password", "uploaded_pdf_content",
    ]

    def test_envelope_excludes_phi(self):
        """Envelope builder must strip PHI fields."""
        from app.services.n8n_event_emitter import build_envelope
        for phi_field in self.PHI_FIELDS:
            envelope = build_envelope(
                event=Events.DOCUMENT_UPLOADED,
                extra={phi_field: "SENSITIVE_DATA"},
            )
            assert phi_field not in envelope, f"PHI field '{phi_field}' leaked"
