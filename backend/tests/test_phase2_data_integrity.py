"""
Phase 2 verification tests — data integrity changes.

Covers:
1. Enum boundary validation (PolicyStatusUpdate, RequestStatusUpdate)
2. LLM-output normalization (ai_service.normalize_entities)
3. Validated AuditLog writes (audit_service.AuditLogCreate / new_audit_entry)

Run from backend/: python -m pytest tests/ -v
"""

import os
import sys

# auth_service now hard-fails without SECRET_KEY (Phase 1 hardening);
# tests must set it before any app import.
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from pydantic import ValidationError

from app.models.enums import PolicyStatus, RequestDecision


# ==========================================
# 1. ENUM BOUNDARY VALIDATION
# ==========================================


def test_policy_status_enum_accepts_valid():
    assert PolicyStatus("approved") is PolicyStatus.APPROVED
    assert PolicyStatus("rejected") is PolicyStatus.REJECTED
    assert PolicyStatus("pending") is PolicyStatus.PENDING


def test_policy_status_enum_rejects_invalid():
    with pytest.raises(ValueError):
        PolicyStatus("Approved")  # wrong case must not pass silently
    with pytest.raises(ValueError):
        PolicyStatus("maybe")


def test_admin_policy_update_rejects_invalid_status():
    from app.routes.admin_routes import PolicyStatusUpdate

    ok = PolicyStatusUpdate(status="approved", comment="fine")
    assert ok.status == PolicyStatus.APPROVED

    with pytest.raises(ValidationError):
        PolicyStatusUpdate(status="banana")


def test_provider_request_update_rejects_invalid_status():
    from app.routes.provider_unified_routes import RequestStatusUpdate

    ok = RequestStatusUpdate(status="Approved")
    assert ok.status == RequestDecision.APPROVED

    ok2 = RequestStatusUpdate(status="Rejected")
    assert ok2.status == RequestDecision.REJECTED

    with pytest.raises(ValidationError):
        RequestStatusUpdate(status="Pending Information")
    with pytest.raises(ValidationError):
        RequestStatusUpdate(status="")


# ==========================================
# 2. LLM OUTPUT NORMALIZATION
# ==========================================


def test_normalize_entities_full_valid_payload():
    from app.services.ai_service import normalize_entities

    parsed = {
        "diagnosis": "Head injury",
        "symptoms": ["headache"],
        "medications": ["paracetamol"],
        "treatment_history": {
            "physical_therapy": {
                "duration": "6 weeks",
                "exercises": ["stretching"],
                "outcome": "improved",
            }
        },
        "procedure_requested": "MRI",
        # Extra junk keys from the LLM must be dropped:
        "confidence_score": 100.0,
    }

    result = normalize_entities(parsed)

    assert result["diagnosis"] == "Head injury"
    assert result["procedure_requested"] == "MRI"
    assert result["treatment_history"]["physical_therapy"]["duration"] == "6 weeks"
    # Hallucinated extra keys are stripped by the schema:
    assert "confidence_score" not in result


def test_normalize_entities_partial_payload_fills_defaults():
    """LLM omits treatment_history entirely -> nested shape still complete."""
    from app.services.ai_service import normalize_entities

    result = normalize_entities({"diagnosis": "migraine"})

    assert result["diagnosis"] == "migraine"
    pt = result["treatment_history"]["physical_therapy"]
    assert set(pt.keys()) == {"duration", "exercises", "outcome"}


def test_normalize_entities_garbage_never_raises():
    """Prose / None / lists from a misbehaving LLM must not crash the pipeline."""
    from app.services.ai_service import get_empty_entities, normalize_entities

    for garbage in (None, [], "I am not json", {"symptoms": "not-a-list-but-ok", 1: 2}):
        result = normalize_entities(garbage)
        assert isinstance(result, dict)
        assert "diagnosis" in result
        assert "procedure_requested" in result
        assert isinstance(result["treatment_history"], dict)

    assert normalize_entities(None) == get_empty_entities()


def test_extract_medical_entities_graceful_without_ollama(monkeypatch):
    """
    If Ollama is unreachable the function must return the validated empty
    schema (JSON string), matching the contract consumers expect.
    """
    from app.services import ai_service

    def boom(*args, **kwargs):
        raise ConnectionError("no ollama in CI")

    monkeypatch.setattr(ai_service._ollama_client, "chat", boom)

    out = ai_service.extract_medical_entities("some clinical text")

    import json

    parsed = json.loads(out)  # must be valid JSON string
    assert parsed["diagnosis"] == ""
    assert isinstance(parsed["treatment_history"]["physical_therapy"]["exercises"], list)


def test_rules_engine_works_with_normalized_output():
    """Downstream consumer (rules_engine) must work on normalized dicts."""
    from app.services.ai_service import normalize_entities
    from app.services.rules_engine import evaluate_prior_authorization

    entities = normalize_entities(
        {
            "procedure_requested": "MRI",
            "treatment_history": {
                "physical_therapy": {"duration": "4 weeks"}
            },
        }
    )

    decision = evaluate_prior_authorization(entities)
    assert decision["decision"] == "Approved"


# ==========================================
# 3. VALIDATED AUDIT WRITES
# ==========================================


def test_audit_create_rejects_empty_action():
    from app.services.audit_service import AuditLogCreate

    with pytest.raises(ValidationError):
        AuditLogCreate(action="")


def test_audit_new_entry_maps_fields_correctly():
    """
    Regression guard for the historical performed_by -> user_id drift:
    the Pydantic payload must map onto ORM columns exactly.
    """
    from app.services.audit_service import AuditLogCreate, new_audit_entry
    from app.models.audit_log_model import AuditLog

    data = AuditLogCreate(
        request_id="req-123",
        action="Decision: Approved",
        user_id="provider-abc",
        description="all good",
    )
    entry = new_audit_entry(data)

    assert isinstance(entry, AuditLog)
    # performed_by lands in user_id, details in description — no drift:
    assert entry.user_id == "provider-abc"
    assert entry.description == "all good"
    assert entry.action == "Decision: Approved"
    assert entry.request_id == "req-123"
    assert entry.role is None
    assert entry.status == "Success"
    assert entry.created_at is not None


def test_audit_default_performed_by_is_ai_system():
    from app.services.audit_service import create_audit_log
    from unittest.mock import patch

    captured = {}

    class FakeQuery:
        def add(self, obj):
            captured["obj"] = obj

        def commit(self):
            pass

        def refresh(self, obj):
            pass

    class FakeSession(FakeQuery):
        def rollback(self):
            pass

        def close(self):
            pass

    with patch("app.services.audit_service.SessionLocal", return_value=FakeSession()):
        create_audit_log(request_id=None, action="X", performed_by="", details="d")

    assert captured["obj"].user_id == "AI System"


def test_admin_routes_use_validated_audit_builder():
    """Admin routes must construct audit rows via new_audit_entry(AuditLogCreate)."""
    import inspect

    import app.routes.admin_routes as ar

    source = inspect.getsource(ar)
    assert source.count("new_audit_entry(") >= 4
    # No raw AuditLog(...) constructions should remain in admin routes:
    assert "AuditLog(\n" not in source.replace("AuditLogCreate(", "")
