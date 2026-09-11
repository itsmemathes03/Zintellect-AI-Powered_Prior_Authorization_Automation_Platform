"""
Phase 1 verification tests — security & deploy correctness.

Covers:
1. SECRET_KEY hard requirement (no silent fallback)
2. Email credentials not hardcoded; senders degrade gracefully
3. Deterministic policy chunk IDs (idempotent Chroma indexing)
4. Auth guards present on previously-public endpoints

Run from backend/: python -m pytest tests/ -v
"""

import os
import subprocess
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")

from app.services.policy_chunk_ids import apply_deterministic_chunk_ids


# ==========================================
# 1. SECRET ENFORCEMENT
# ==========================================


def test_missing_secret_key_fails_import():
    """
    Launching the app without SECRET_KEY must fail loudly, not fall
    back to the old predictable 'zintellect_secret_key'.
    """
    code = (
        "import sys; sys.path.insert(0, r'{backend}'); "
        "import os; os.environ.pop('SECRET_KEY', None); "
        "import app.services.auth_service"
    ).format(backend=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    result = subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode != 0
    assert "SECRET_KEY" in (result.stderr + result.stdout)


def test_secret_key_loaded_from_env():
    from app.services import auth_service

    assert auth_service.SECRET_KEY == "test-secret-key-for-pytest-only"


# ==========================================
# 2. EMAIL CREDENTIAL HYGIENE
# ==========================================


def test_no_hardcoded_gmail_credentials():
    """The leaked app password must never reappear in source."""
    import inspect

    import app.services.email_service as es

    source = inspect.getsource(es)

    assert "itsmemathes" not in source
    assert "qbdb tgxk acmw cbkw" not in source
    # No os.getenv fallback strings either:
    assert 'getenv("EMAIL_ADDRESS",' not in source
    assert 'getenv("EMAIL_PASSWORD",' not in source


def test_email_sender_skips_gracefully_without_creds(monkeypatch):
    from app.services import email_service as es

    monkeypatch.setattr(es, "EMAIL_ADDRESS", None)
    monkeypatch.setattr(es, "EMAIL_PASSWORD", None)

    # Must return False without raising / attempting SMTP:
    ok = es.send_decision_email(
        to_email="x@y.z",
        doctor_name="Dr Test",
        patient_name="P",
        procedure_code="MRI",
        diagnosis="D",
        status="Approved",
        reasoning="r",
        provider_name="Prov",
    )
    assert ok is False


def test_smtp_never_started_when_unconfigured(monkeypatch):
    from app.services import email_service as es

    called = {"smtp": False}

    def fake_smtp(*a, **kw):  # pragma: no cover
        called["smtp"] = True
        raise AssertionError("SMTP must not be touched without creds")

    monkeypatch.setattr(es, "EMAIL_ADDRESS", "")
    monkeypatch.setattr(es, "EMAIL_PASSWORD", "")
    monkeypatch.setattr(es.smtplib, "SMTP", fake_smtp)

    es.send_patient_decision_email(
        to_email="x@y.z",
        patient_name="P",
        procedure_code="MRI",
        diagnosis="D",
        status="Rejected",
        provider_name="Prov",
    )
    assert called["smtp"] is False


# ==========================================
# 3. DETERMINISTIC CHROMA CHUNK IDS
# ==========================================


def test_chunk_ids_deterministic_for_same_policy_text():
    chunks = [{"chunk_text": f"part {i}"} for i in range(4)]

    a = apply_deterministic_chunk_ids(
        [dict(c) for c in chunks], "policy-123", "identical policy body"
    )
    b = apply_deterministic_chunk_ids(
        [dict(c) for c in chunks], "policy-123", "identical policy body"
    )

    assert [c["chunk_id"] for c in a] == [c["chunk_id"] for c in b]
    assert all(c["chunk_id"].startswith("policy-123_") for c in a)
    assert all(c["document_type"] == "insurance_policy" for c in a)


def test_chunk_ids_differ_for_different_text_or_policy():
    chunks = [{"chunk_text": "x"}]

    a = apply_deterministic_chunk_ids([dict(c) for c in chunks], "p1", "text A")
    b = apply_deterministic_chunk_ids([dict(c) for c in chunks], "p1", "text B")
    c = apply_deterministic_chunk_ids([dict(c) for c in chunks], "p2", "text A")

    assert a[0]["chunk_id"] != b[0]["chunk_id"]
    assert a[0]["chunk_id"] != c[0]["chunk_id"]


def test_vector_store_uses_upsert_not_add():
    """Regression guard: store_policy_embeddings must be idempotent."""
    import inspect

    from app.services.retrieval import vector_db_service as vdb

    source = inspect.getsource(vdb.store_policy_embeddings)

    assert ".upsert(" in source
    assert ".add(" not in source


# ==========================================
# 4. AUTH GUARDS ON PREVIOUSLY-PUBLIC ENDPOINTS
# ==========================================


def test_upload_policy_requires_jwt():
    import inspect

    import app.routes.policy_routes as pr

    src = inspect.getsource(pr.upload_policy)

    assert "Depends(verify_jwt_token)" in src


def test_all_requests_requires_jwt_and_stays_redacted():
    import inspect

    import app.routes.request_routes as rr

    src = inspect.getsource(rr.get_all_requests)

    assert "Depends(verify_jwt_token)" in src
    # Redacted projection: no clinical text / XAI fields exposed.
    for forbidden in ("clinical_notes", "diagnosis", "xai_reasoning"):
        assert forbidden not in src
