"""
Phase 6 — comprehensive functional / integration tests.

Tests full API workflows end-to-end:
  1. Complete login workflow (all roles)
  2. Admin user lifecycle (CRUD)
  3. Admin policy lifecycle
  4. Authentication & authorization guards
  5. Audit log tracking
  6. Settings update

Run from backend/: python -m pytest tests/test_phase6_functional.py -v
"""

import os
import sys

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient


# ==========================================
# APP + TOKEN HELPERS
# ==========================================


@pytest.fixture(scope="module")
def client():
    """Create a test client without importing the full app (avoids dotenv)."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="Zintellect Test")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routes.admin_routes import router as admin_router
    from app.routes.doctor_routes import router as doctor_router
    from app.routes.patient_routes import router as patient_router
    from app.routes.provider_unified_routes import router as provider_unified_router
    from app.routes.member_routes import router as member_router

    app.include_router(admin_router)
    app.include_router(doctor_router)
    app.include_router(patient_router)
    app.include_router(provider_unified_router)
    app.include_router(member_router)

    @app.get("/")
    def home():
        return {"status": "ok"}

    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def admin_token(client):
    """Login as admin and return a JWT token."""
    resp = client.post(
        "/admin/login",
        json={"email": "admin@gmail.com", "password": "admin123"},
    )
    if resp.status_code == 200:
        return resp.json().get("access_token")
    from app.services.auth_service import create_access_token
    return create_access_token({"role": "admin", "email": "admin@gmail.com", "user_id": "admin-test-id"})


@pytest.fixture(scope="module")
def doctor_token():
    from app.services.auth_service import create_access_token
    return create_access_token({"role": "doctor", "email": "dr@test.com", "user_id": "doctor-test-id"})


@pytest.fixture(scope="module")
def provider_token():
    from app.services.auth_service import create_access_token
    return create_access_token({"role": "provider", "email": "prov@test.com", "user_id": "provider-test-id"})


@pytest.fixture(scope="module")
def patient_token():
    from app.services.auth_service import create_access_token
    return create_access_token({"role": "patient", "email": "pat@test.com", "user_id": "patient-test-id"})


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ==========================================
# 1. COMPLETE LOGIN WORKFLOW
# ==========================================


def test_complete_login_workflow(client):
    """Test all login variants end-to-end."""

    # Admin login with valid credentials
    resp = client.post(
        "/admin/login",
        json={"email": "admin@gmail.com", "password": "admin123"},
    )
    # 200 if admin exists in DB, 401 if seeded admin not present
    assert resp.status_code in (200, 401)
    if resp.status_code == 200:
        body = resp.json()
        assert body.get("status") == "Success"
        assert "access_token" in body
        assert body.get("admin_id") is not None
        assert body.get("admin_name") is not None

    # Admin login with invalid password → 401
    resp = client.post(
        "/admin/login",
        json={"email": "admin@gmail.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401

    # Admin login with missing fields → 422
    resp = client.post("/admin/login", json={})
    assert resp.status_code == 422

    # Doctor login → 200 or 401
    resp = client.post(
        "/doctor/login",
        json={"email": "dr@test.com", "password": "pass123"},
    )
    assert resp.status_code in (200, 401)
    if resp.status_code == 200:
        body = resp.json()
        assert body.get("status") == "Success"
        assert "access_token" in body

    # Patient login → 200 or 401
    resp = client.post(
        "/patient/login",
        json={"email": "pat@test.com", "password": "pass123"},
    )
    assert resp.status_code in (200, 401)
    if resp.status_code == 200:
        body = resp.json()
        assert body.get("status") == "Success"
        assert "access_token" in body

    # Provider login → 200 or 401
    resp = client.post(
        "/provider/login",
        json={"email": "prov@test.com", "password": "pass123"},
    )
    assert resp.status_code in (200, 401)
    if resp.status_code == 200:
        body = resp.json()
        assert body.get("status") == "Success"
        assert "access_token" in body


# ==========================================
# 2. ADMIN USER LIFECYCLE
# ==========================================


def test_admin_user_lifecycle(client, admin_token):
    """Test full user CRUD: create → list → update → delete."""

    unique_email = f"lifecycle_{os.urandom(4).hex()}@example.com"

    # Create user
    create_resp = client.post(
        "/admin/users",
        headers=auth_header(admin_token),
        json={
            "email": unique_email,
            "password": "securepass123",
            "role": "Doctor",
            "first_name": "Lifecycle",
            "last_name": "TestUser",
        },
    )
    assert create_resp.status_code == 200
    create_body = create_resp.json()
    assert create_body.get("status") == "Success"
    user_id = create_body.get("user_id")
    assert user_id is not None

    # Get users list — contains the new user
    list_resp = client.get("/admin/users", headers=auth_header(admin_token))
    assert list_resp.status_code == 200
    list_body = list_resp.json()
    items = list_body.get("items", [])
    user_emails = [u.get("email") for u in items]
    assert unique_email in user_emails, f"Created user {unique_email} not found in user list"

    # Update user
    update_resp = client.put(
        f"/admin/users/{user_id}",
        headers=auth_header(admin_token),
        json={"first_name": "UpdatedName", "phone": "555-1234"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json().get("status") == "Success"

    # Delete user
    delete_resp = client.delete(
        f"/admin/users/{user_id}",
        headers=auth_header(admin_token),
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json().get("status") == "Success"


# ==========================================
# 3. ADMIN POLICY LIFECYCLE
# ==========================================


def test_admin_policy_lifecycle(client, admin_token):
    """Test policy management: list → update status."""

    # Get policies list → 200
    resp = client.get("/admin/policies", headers=auth_header(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)

    # If there are policies, test status updates
    if body["items"]:
        policy_id = body["items"][0].get("id")

        # Update policy status to approved → 200
        approve_resp = client.patch(
            f"/admin/policies/{policy_id}",
            headers=auth_header(admin_token),
            json={"status": "approved"},
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json().get("status") == "Success"

        # Update policy status to rejected → 200
        reject_resp = client.patch(
            f"/admin/policies/{policy_id}",
            headers=auth_header(admin_token),
            json={"status": "rejected", "comment": "Test rejection comment"},
        )
        assert reject_resp.status_code == 200
        assert reject_resp.json().get("status") == "Success"


# ==========================================
# 4. AUTHENTICATION & AUTHORIZATION
# ==========================================


def test_authentication_and_authorization(client, admin_token, doctor_token, provider_token):
    """Test auth guards: no token → 401, expired token → 401, wrong role → 403."""

    admin_endpoints = [
        "/admin/users",
        "/admin/policies",
        "/admin/analytics",
        "/admin/audit",
        "/admin/settings",
    ]

    # Access admin endpoint without token → 401
    for endpoint in admin_endpoints:
        resp = client.get(endpoint)
        assert resp.status_code in (401, 403), f"No-token request to {endpoint} should be rejected"

    # Access admin endpoint with expired token → 401
    from jose import jwt
    from app.services.auth_service import SECRET_KEY, ALGORITHM
    from datetime import datetime, timedelta

    expired_payload = {
        "role": "admin",
        "email": "admin@gmail.com",
        "user_id": "admin-test-id",
        "exp": datetime.utcnow() - timedelta(hours=1),
    }
    expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
    for endpoint in admin_endpoints:
        resp = client.get(endpoint, headers=auth_header(expired_token))
        assert resp.status_code in (401, 403), f"Expired-token request to {endpoint} should be rejected"

    # Access admin endpoint with wrong role (doctor token) → 403
    for endpoint in admin_endpoints:
        resp = client.get(endpoint, headers=auth_header(doctor_token))
        assert resp.status_code == 403, f"Doctor token should not access {endpoint}"

    # Access doctor endpoint with admin token → 403
    doctor_endpoints = ["/doctor/requests", "/doctor/stats", "/doctor/patients"]
    for endpoint in doctor_endpoints:
        resp = client.get(endpoint, headers=auth_header(admin_token))
        assert resp.status_code in (403, 401), f"Admin token should not access {endpoint}"


# ==========================================
# 5. AUDIT LOG TRACKING
# ==========================================


def test_audit_log_tracking(client, admin_token):
    """Test that admin actions create audit log entries."""

    # Get audit logs before action
    before_resp = client.get("/admin/audit", headers=auth_header(admin_token))
    assert before_resp.status_code == 200
    before_count = before_resp.json().get("total", 0)

    # Perform admin action — create a user (creates audit entry)
    unique_email = f"audit_{os.urandom(4).hex()}@example.com"
    create_resp = client.post(
        "/admin/users",
        headers=auth_header(admin_token),
        json={
            "email": unique_email,
            "password": "auditpass123",
            "role": "Patient",
            "first_name": "Audit",
            "last_name": "TestPatient",
        },
    )
    assert create_resp.status_code == 200

    # Get audit logs after action
    after_resp = client.get("/admin/audit", headers=auth_header(admin_token))
    assert after_resp.status_code == 200
    after_body = after_resp.json()
    assert after_body.get("total", 0) >= before_count

    # Verify the audit entry exists with the expected action
    items = after_body.get("items", [])
    actions = [item.get("action") for item in items]
    assert "USER_CREATED" in actions, "USER_CREATED audit entry not found after creating user"


# ==========================================
# 6. SETTINGS UPDATE
# ==========================================


def test_settings_update(client, admin_token):
    """Test settings get → update → verify updated values."""

    # Get settings → 200
    get_resp = client.get("/admin/settings", headers=auth_header(admin_token))
    assert get_resp.status_code == 200
    settings = get_resp.json().get("settings", {})
    assert "routine_hours" in settings
    assert "urgent_hours" in settings
    assert "critical_hours" in settings

    # Update settings → 200
    new_routine = settings["routine_hours"] + 10
    new_urgent = settings["urgent_hours"] + 5
    new_critical = settings["critical_hours"] + 1
    update_resp = client.patch(
        "/admin/settings",
        headers=auth_header(admin_token),
        json={
            "routine_hours": new_routine,
            "urgent_hours": new_urgent,
            "critical_hours": new_critical,
        },
    )
    assert update_resp.status_code == 200
    update_body = update_resp.json()
    assert update_body.get("status") == "Success"

    # Verify updated values
    updated = update_body.get("settings", {})
    assert updated.get("routine_hours") == new_routine
    assert updated.get("urgent_hours") == new_urgent
    assert updated.get("critical_hours") == new_critical

    # Fetch again to confirm persistence within the same process
    verify_resp = client.get("/admin/settings", headers=auth_header(admin_token))
    assert verify_resp.status_code == 200
    verify_settings = verify_resp.json().get("settings", {})
    assert verify_settings.get("routine_hours") == new_routine
    assert verify_settings.get("urgent_hours") == new_urgent
    assert verify_settings.get("critical_hours") == new_critical
