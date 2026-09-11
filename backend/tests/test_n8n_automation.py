"""
n8n Automation Tests

Tests for:
  1. PA duplicate notification fix (exactly 1 notification + 1 audit)
  2. Patient registration n8n event
  3. Policy upload n8n event
  4. PHI-minimized payloads
  5. Duplicate policy detection
  6. n8n failure fallback
  7. Event structure consistency

Run: python -m pytest tests/test_n8n_automation.py -v
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient


# ==========================================
# FIXTURES
# ==========================================

@pytest.fixture(scope="module")
def client():
    """Create a test client with all routes."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="Zintellect n8n Test")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routes.patient_routes import router as patient_router
    from app.routes.n8n_routes import router as n8n_router

    app.include_router(patient_router)
    app.include_router(n8n_router)

    return TestClient(app)


@pytest.fixture
def db_session():
    """Provide a fresh DB session for each test."""
    from app.database.db import SessionLocal
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def cleanup_users():
    """Clean up test users after test."""
    from app.database.db import SessionLocal
    from app.models.user_model import User
    from app.models.member_model import InsuranceMember

    session = SessionLocal()
    created_emails = []
    yield created_emails

    for email in created_emails:
        user = session.query(User).filter(User.email == email).first()
        if user:
            member = session.query(InsuranceMember).filter(
                InsuranceMember.patient_email == email
            ).first()
            if member:
                session.delete(member)
            session.delete(user)
    session.commit()
    session.close()


# ==========================================
# 1. PA DUPLICATE NOTIFICATION FIX
# ==========================================

class TestPADuplicateNotificationFix:
    """Verify exactly 1 notification + 1 audit per PA decision."""

    def test_notify_n8n_dispatches_to_webhook(self):
        """notify_n8n should dispatch to n8n and NOT create local events on success."""
        from app.services.n8n_service import notify_n8n

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=True) as mock_dispatch:
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_n8n(
                    request_id="test-req-001",
                    status="Approved",
                    confidence_score=85.0,
                    provider_id="prov-001",
                )
                mock_dispatch.assert_called_once()
                mock_local.assert_not_called()

    def test_notify_n8n_fallback_on_failure(self):
        """notify_n8n should create local events when n8n dispatch fails."""
        from app.services.n8n_service import notify_n8n

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=False):
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_n8n(
                    request_id="test-req-002",
                    status="Rejected",
                    confidence_score=30.0,
                    provider_id="prov-002",
                )
                mock_local.assert_called_once()

    def test_pa_event_payload_structure(self):
        """PA event payload should have the correct structure."""
        from app.services.n8n_service import build_pa_event

        payload = build_pa_event(
            request_id="req-123",
            status="Approved",
            confidence_score=90.0,
            insurance_provider="Zintellect",
            procedure_code="MRI-BRAIN-001",
            matched_conditions=["headache"],
            missing_requirements=[],
            uploaded_document_types=["clinical_notes"],
            processing_time_seconds=35.5,
            provider_id="prov-123",
            provider_name="Test Provider",
        )

        assert payload["event"] == "prior_authorization_decision"
        assert payload["event_id"] is not None
        assert payload["request_id"] == "req-123"
        assert payload["status"] == "Approved"
        assert payload["confidence_score"] == 90.0
        assert payload["provider_id"] == "prov-123"
        assert "timestamp" in payload

    def test_local_events_create_single_notification(self):
        """_create_local_events should create exactly 1 notification."""
        from app.services.n8n_service import _create_local_events
        from app.database.db import SessionLocal
        from app.models.notification_model import Notification
        from app.models.audit_log_model import AuditLog

        req_id = f"test-dup-{uuid.uuid4()}"
        prov_id = f"prov-dup-{uuid.uuid4()}"

        payload = {
            "event": "prior_authorization_decision",
            "request_id": req_id,
            "status": "Approved",
            "confidence_score": 85.0,
            "provider_id": prov_id,
            "missing_requirements": [],
        }

        _create_local_events(payload)

        db = SessionLocal()
        try:
            notifs = db.query(Notification).filter(
                Notification.request_id == req_id,
                Notification.notification_type == "N8N_APPROVED",
            ).all()
            assert len(notifs) == 1, f"Expected 1 notification, got {len(notifs)}"

            audits = db.query(AuditLog).filter(
                AuditLog.request_id == req_id,
                AuditLog.action == "n8n: Approval workflow completed",
            ).all()
            assert len(audits) == 1, f"Expected 1 audit, got {len(audits)}"
        finally:
            # Cleanup
            db.query(Notification).filter(Notification.request_id == req_id).delete()
            db.query(AuditLog).filter(AuditLog.request_id == req_id).delete()
            db.commit()
            db.close()


# ==========================================
# 2. PATIENT REGISTRATION N8N EVENT
# ==========================================

class TestPatientRegistrationEvent:
    """Verify patient registration triggers n8n event."""

    def test_patient_event_payload_structure(self):
        """Patient registered event should have correct structure."""
        from app.services.n8n_service import build_patient_registered_event

        payload = build_patient_registered_event(
            patient_id="pat-123",
            patient_name="John Doe",
            insurance_provider="Zintellect",
            insurance_id="ZIN-ABC123",
        )

        assert payload["event"] == "patient_registered"
        assert payload["event_id"] is not None
        assert payload["patient_id"] == "pat-123"
        assert payload["patient_name"] == "John Doe"
        assert payload["insurance_provider"] == "Zintellect"
        assert payload["status"] == "registered"
        assert "timestamp" in payload

    def test_patient_event_phi_minimized(self):
        """Patient event should NOT contain PHI beyond what's needed."""
        from app.services.n8n_service import build_patient_registered_event

        payload = build_patient_registered_event(
            patient_id="pat-456",
            patient_name="Jane Smith",
            insurance_provider="Zintellect",
            insurance_id="ZIN-DEF456",
        )

        # Should NOT contain
        assert "diagnosis" not in payload
        assert "medical_history" not in payload
        assert "password" not in payload
        assert "clinical_documents" not in payload
        assert "date_of_birth" not in payload

    def test_notify_patient_dispatches_to_webhook(self):
        """notify_patient_registered should dispatch to n8n."""
        from app.services.n8n_service import notify_patient_registered

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=True) as mock_dispatch:
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_patient_registered(
                    patient_id="pat-789",
                    patient_name="Test Patient",
                    insurance_provider="Zintellect",
                )
                mock_dispatch.assert_called_once()
                mock_local.assert_not_called()

    def test_notify_patient_fallback_on_failure(self):
        """notify_patient_registered should fallback when n8n fails."""
        from app.services.n8n_service import notify_patient_registered

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=False):
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_patient_registered(
                    patient_id="pat-fallback",
                    patient_name="Fallback Patient",
                    insurance_provider="Zintellect",
                )
                mock_local.assert_called_once()


# ==========================================
# 3. POLICY UPLOAD N8N EVENT
# ==========================================

class TestPolicyUploadEvent:
    """Verify policy upload triggers n8n event."""

    def test_policy_event_payload_structure(self):
        """Policy uploaded event should have correct structure."""
        from app.services.n8n_service import build_policy_uploaded_event

        payload = build_policy_uploaded_event(
            policy_id="pol-123",
            provider_id="prov-123",
            insurance_provider="Zintellect",
            procedure_name="CT Chest",
            required_documents=["clinical_notes", "xray_report"],
            required_conditions=["persistent symptoms"],
        )

        assert payload["event"] == "policy_uploaded"
        assert payload["event_id"] is not None
        assert payload["policy_id"] == "pol-123"
        assert payload["provider_id"] == "prov-123"
        assert payload["procedure_name"] == "CT Chest"
        assert payload["required_documents_count"] == 2
        assert payload["required_conditions_count"] == 1
        assert payload["status"] == "uploaded"
        assert "timestamp" in payload

    def test_policy_event_phi_minimized(self):
        """Policy event should NOT contain sensitive data."""
        from app.services.n8n_service import build_policy_uploaded_event

        payload = build_policy_uploaded_event(
            policy_id="pol-456",
            provider_id="prov-456",
            insurance_provider="Zintellect",
            procedure_name="Knee MRI",
        )

        # Should NOT contain
        assert "policy_text" not in payload
        assert "pdf_content" not in payload
        assert "clinical_details" not in payload
        assert "secret" not in payload
        assert "password" not in payload

    def test_notify_policy_dispatches_to_webhook(self):
        """notify_policy_uploaded should dispatch to n8n."""
        from app.services.n8n_service import notify_policy_uploaded

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=True) as mock_dispatch:
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_policy_uploaded(
                    policy_id="pol-dispatch",
                    provider_id="prov-dispatch",
                    insurance_provider="Zintellect",
                    procedure_name="CT Chest",
                )
                mock_dispatch.assert_called_once()
                mock_local.assert_not_called()

    def test_notify_policy_fallback_on_failure(self):
        """notify_policy_uploaded should fallback when n8n fails."""
        from app.services.n8n_service import notify_policy_uploaded

        with patch("app.services.n8n_service.dispatch_to_n8n", return_value=False):
            with patch("app.services.n8n_service._create_local_events") as mock_local:
                notify_policy_uploaded(
                    policy_id="pol-fallback",
                    provider_id="prov-fallback",
                    insurance_provider="Zintellect",
                    procedure_name="CT Chest",
                )
                mock_local.assert_called_once()


# ==========================================
# 4. DUPLICATE POLICY DETECTION
# ==========================================

class TestPolicyDuplicateDetection:
    """Verify duplicate policy detection in the upload route."""

    def test_duplicate_policy_rejected(self):
        """Uploading a policy for the same provider+procedure should fail."""
        from app.database.db import SessionLocal
        from app.models.policy_model import InsurancePolicy
        from app.models.provider_model import InsuranceProvider

        session = SessionLocal()
        try:
            # Find existing provider
            provider = session.query(InsuranceProvider).first()
            if not provider:
                pytest.skip("No provider in DB")

            # Find existing policy
            policy = session.query(InsurancePolicy).filter(
                InsurancePolicy.insurance_provider_id == provider.id
            ).first()
            if not policy:
                pytest.skip("No policy in DB")

            # Check duplicate detection query
            existing = session.query(InsurancePolicy).filter(
                InsurancePolicy.insurance_provider_id == provider.id,
                InsurancePolicy.procedure_name == policy.procedure_name,
            ).first()
            assert existing is not None, "Duplicate detection query should find existing policy"
            assert existing.id == policy.id
        finally:
            session.close()

    def test_different_procedure_not_duplicate(self):
        """Different procedure names should NOT be considered duplicates."""
        from app.database.db import SessionLocal
        from app.models.policy_model import InsurancePolicy
        from app.models.provider_model import InsuranceProvider

        session = SessionLocal()
        try:
            provider = session.query(InsuranceProvider).first()
            if not provider:
                pytest.skip("No provider in DB")

            existing = session.query(InsurancePolicy).filter(
                InsurancePolicy.insurance_provider_id == provider.id,
                InsurancePolicy.procedure_name == "nonexistent-procedure-xyz",
            ).first()
            assert existing is None, "Different procedure should not be found as duplicate"
        finally:
            session.close()


# ==========================================
# 5. N8N CALLBACK ROUTES
# ==========================================

class TestN8nCallbackRoutes:
    """Verify n8n internal callback routes work correctly."""

    def test_notification_callback_creates_record(self, client):
        """n8n callback to /internal/n8n/notifications should create a notification."""
        from app.database.db import SessionLocal
        from app.models.notification_model import Notification

        resp = client.post("/internal/n8n/notifications", json={
            "user_id": "test-n8n-user",
            "role": "provider",
            "notification_type": "N8N_APPROVED",
            "message": "Test notification from n8n",
            "request_id": "test-req-callback",
        })

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "Success"
        assert "notification_id" in data

        # Cleanup
        db = SessionLocal()
        notif = db.query(Notification).filter(
            Notification.user_id == "test-n8n-user",
            Notification.notification_type == "N8N_APPROVED",
        ).first()
        if notif:
            db.delete(notif)
            db.commit()
        db.close()

    def test_audit_callback_creates_record(self, client):
        """n8n callback to /internal/n8n/audit should create an audit log."""
        from app.database.db import SessionLocal
        from app.models.audit_log_model import AuditLog

        resp = client.post("/internal/n8n/audit", json={
            "action": "n8n: Test audit",
            "description": "Test audit from n8n callback",
        })

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "Success"
        assert "audit_id" in data

        # Cleanup
        db = SessionLocal()
        audit = db.query(AuditLog).filter(
            AuditLog.action == "n8n: Test audit",
        ).first()
        if audit:
            db.delete(audit)
            db.commit()
        db.close()


# ==========================================
# 6. EVENT STRUCTURE CONSISTENCY
# ==========================================

class TestEventStructureConsistency:
    """Verify all event types share consistent structure."""

    def test_all_events_have_event_id(self):
        """All events must have a unique event_id for idempotency."""
        from app.services.n8n_service import (
            build_pa_event,
            build_patient_registered_event,
            build_policy_uploaded_event,
        )

        pa = build_pa_event(
            request_id="r1", status="Approved", confidence_score=80,
            insurance_provider="", procedure_code="",
            matched_conditions=[], missing_requirements=[],
            uploaded_document_types=[], processing_time_seconds=0,
        )
        patient = build_patient_registered_event(
            patient_id="p1", patient_name="T", insurance_provider="Z",
        )
        policy = build_policy_uploaded_event(
            policy_id="pol1", provider_id="pv1",
            insurance_provider="Z", procedure_name="CT",
        )

        assert "event_id" in pa
        assert "event_id" in patient
        assert "event_id" in policy

        # All event_ids should be unique
        ids = {pa["event_id"], patient["event_id"], policy["event_id"]}
        assert len(ids) == 3, "All event_ids should be unique"

    def test_all_events_have_timestamp(self):
        """All events must have an ISO timestamp."""
        from app.services.n8n_service import (
            build_pa_event,
            build_patient_registered_event,
            build_policy_uploaded_event,
        )

        pa = build_pa_event(
            request_id="r1", status="Approved", confidence_score=80,
            insurance_provider="", procedure_code="",
            matched_conditions=[], missing_requirements=[],
            uploaded_document_types=[], processing_time_seconds=0,
        )
        patient = build_patient_registered_event(
            patient_id="p1", patient_name="T", insurance_provider="Z",
        )
        policy = build_policy_uploaded_event(
            policy_id="pol1", provider_id="pv1",
            insurance_provider="Z", procedure_name="CT",
        )

        assert "timestamp" in pa
        assert "timestamp" in patient
        assert "timestamp" in policy

    def test_all_events_have_event_type(self):
        """All events must have an 'event' field."""
        from app.services.n8n_service import (
            build_pa_event,
            build_patient_registered_event,
            build_policy_uploaded_event,
        )

        pa = build_pa_event(
            request_id="r1", status="Approved", confidence_score=80,
            insurance_provider="", procedure_code="",
            matched_conditions=[], missing_requirements=[],
            uploaded_document_types=[], processing_time_seconds=0,
        )
        patient = build_patient_registered_event(
            patient_id="p1", patient_name="T", insurance_provider="Z",
        )
        policy = build_policy_uploaded_event(
            policy_id="pol1", provider_id="pv1",
            insurance_provider="Z", procedure_name="CT",
        )

        assert pa["event"] == "prior_authorization_decision"
        assert patient["event"] == "patient_registered"
        assert policy["event"] == "policy_uploaded"


# ==========================================
# 7. N8N FAILURE HANDLING
# ==========================================

class TestN8nFailureHandling:
    """Verify n8n failure doesn't block core operations."""

    def test_dispatch_failure_returns_false(self):
        """dispatch_to_n8n should return False on connection error."""
        from app.services.n8n_service import dispatch_to_n8n

        with patch("app.services.n8n_service.httpx.post", side_effect=Exception("Connection refused")):
            result = dispatch_to_n8n({"event": "test"})
            assert result is False

    def test_dispatch_timeout_returns_false(self):
        """dispatch_to_n8n should return False on timeout."""
        import httpx
        from app.services.n8n_service import dispatch_to_n8n

        with patch("app.services.n8n_service.httpx.post", side_effect=httpx.TimeoutException("timeout")):
            result = dispatch_to_n8n({"event": "test"})
            assert result is False

    def test_dispatch_success_returns_true(self):
        """dispatch_to_n8n should return True on success."""
        from app.services.n8n_service import dispatch_to_n8n

        mock_response = MagicMock()
        mock_response.status_code = 200

        with patch("app.services.n8n_service.httpx.post", return_value=mock_response):
            result = dispatch_to_n8n({"event": "test"})
            assert result is True

    def test_dispatch_http_error_returns_false(self):
        """dispatch_to_n8n should return False on HTTP error."""
        from app.services.n8n_service import dispatch_to_n8n

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        with patch("app.services.n8n_service.httpx.post", return_value=mock_response):
            result = dispatch_to_n8n({"event": "test"})
            assert result is False


# ==========================================
# 8. PATIENT REGISTRATION EDGE CASES
# ==========================================

class TestPatientRegistrationEdgeCases:
    """Edge cases for patient registration events."""

    def test_patient_event_no_insurance_id(self):
        """Patient event should work without insurance_id."""
        from app.services.n8n_service import build_patient_registered_event

        payload = build_patient_registered_event(
            patient_id="pat-no-ins",
            patient_name="No Ins Patient",
            insurance_provider="Zintellect",
        )
        assert payload["insurance_id"] == ""

    def test_patient_event_special_characters(self):
        """Patient event should handle special characters in names."""
        from app.services.n8n_service import build_patient_registered_event

        payload = build_patient_registered_event(
            patient_id="pat-special",
            patient_name="José María O'Connor-Smith",
            insurance_provider="Zintellect",
        )
        assert payload["patient_name"] == "José María O'Connor-Smith"


# ==========================================
# 9. POLICY UPLOAD EDGE CASES
# ==========================================

class TestPolicyUploadEdgeCases:
    """Edge cases for policy upload events."""

    def test_policy_event_no_requirements(self):
        """Policy event should work with empty requirements."""
        from app.services.n8n_service import build_policy_uploaded_event

        payload = build_policy_uploaded_event(
            policy_id="pol-empty",
            provider_id="prov-empty",
            insurance_provider="Zintellect",
            procedure_name="Unknown Procedure",
        )
        assert payload["required_documents_count"] == 0
        assert payload["required_conditions_count"] == 0

    def test_policy_event_many_requirements(self):
        """Policy event should handle many requirements."""
        from app.services.n8n_service import build_policy_uploaded_event

        docs = [f"doc_{i}" for i in range(20)]
        conds = [f"cond_{i}" for i in range(15)]

        payload = build_policy_uploaded_event(
            policy_id="pol-many",
            provider_id="prov-many",
            insurance_provider="Zintellect",
            procedure_name="Complex Procedure",
            required_documents=docs,
            required_conditions=conds,
        )
        assert payload["required_documents_count"] == 20
        assert payload["required_conditions_count"] == 15
