import sys
import os
import typing

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# WORKAROUND: Pydantic v2.13 + Python 3.9
# ==========================================
# pydantic_core 2.46 defines CoreSchemaOrFieldType as
# Literal[Literal[...], Literal[...]] (nested Literals).
# On Python 3.9, get_literal_values() does not flatten
# nested Literals — it yields _GenericAlias objects.
# GenerateJsonSchema.build_schema_type_to_method() then
# calls .replace() on those objects, which crashes.
# Patch get_literal_values to flatten nested Literals.
if sys.version_info < (3, 10):
    try:
        import pydantic.json_schema as _pjs
        _orig_get_literal_values = _pjs.get_literal_values

        def _patched_get_literal_values(
            annotation, /, *, type_check=False,
            unpack_type_aliases='eager',
        ):
            if (
                hasattr(annotation, '__args__')
                and getattr(annotation, '__origin__', None) is typing.Literal
            ):
                for arg in annotation.__args__:
                    if (
                        hasattr(arg, '__args__')
                        and getattr(arg, '__origin__', None) is typing.Literal
                    ):
                        yield from _patched_get_literal_values(
                            arg, type_check=type_check,
                            unpack_type_aliases=unpack_type_aliases,
                        )
                    else:
                        yield arg
            else:
                yield from _orig_get_literal_values(
                    annotation, type_check=type_check,
                    unpack_type_aliases=unpack_type_aliases,
                )

        _pjs.get_literal_values = _patched_get_literal_values
    except Exception:
        pass

from app.database.db import Base, engine

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development")

# ==========================================
# IMPORT DATABASE MODELS
# ==========================================

from app.models.provider_model import InsuranceProvider
from app.models.member_model import InsuranceMember
from app.models.request_model import PriorAuthRequest
from app.models.policy_model import InsurancePolicy

# NEW MODELS
from app.models.doctor_model import Doctor
from app.models.admin_model import Admin
from app.models.authorization_stage_model import AuthorizationStage
from app.models.uploaded_file_model import UploadedFile
from app.models.notification_model import Notification
from app.models.audit_log_model import AuditLog
from app.models.email_log_model import EmailLog
from app.models.review_model import HumanReview

# ==========================================
# IMPORT ROUTES
# ==========================================

from app.routes.provider_routes import router as provider_router

from app.routes.member_routes import router as member_router

from app.routes.request_routes import router as request_router

from app.routes.policy_routes import router as policy_router

from app.routes.admin_routes import router as admin_router

from app.routes.doctor_routes import router as doctor_router

from app.routes.patient_routes import router as patient_router

from app.routes.provider_unified_routes import router as provider_unified_router

from app.routes.similarity_routes import router as similarity_router

from app.routes.ai_explanation_routes import router as ai_explanation_router
from app.routes.n8n_routes import router as n8n_router
from app.routes.review_routes import router as review_router
from app.routes.evidence_trace_routes import router as evidence_trace_router
from app.routes.contradiction_routes import router as contradiction_router
from app.routes.document_quality_routes import router as document_quality_router
from app.routes.evidence_extraction_routes import router as evidence_extraction_router
from app.routes.policy_versioning_routes import router as policy_versioning_router
from app.routes.provider_communication_routes import router as provider_communication_router
from app.routes.request_prioritization_routes import router as request_prioritization_router
from app.routes.readiness_score_routes import router as readiness_score_router
from app.routes.appeal_assistant_routes import router as appeal_assistant_router
from app.routes.chat_routes import router as chat_router

# ==========================================
# CREATE DATABASE TABLES
# ==========================================

Base.metadata.create_all(bind=engine)

# ==========================================
# AUTO-SEED DEFAULT ADMIN
# ==========================================

from app.database.db import SessionLocal
from app.models.user_model import User
from app.services.auth_service import hash_password
import uuid


def _seed_default_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "Admin").first()
        if existing:
            print(f"[auto-seed] Admin already exists: {existing.email}")
            return
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@gmail.com",
            password_hash=hash_password("admin123"),
            role="Admin",
            first_name="System",
            last_name="Admin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        print("[auto-seed] Default admin created: admin@gmail.com / admin123")
    finally:
        db.close()


_seed_default_admin()


# ==========================================
# AUTO-MIGRATE MISSING COLUMNS
# ==========================================


def _migrate_schema():
    from sqlalchemy import inspect

    inspector = inspect(engine)
    try:
        existing_cols = {
            c["name"] for c in inspector.get_columns("prior_auth_requests")
        }
    except Exception:
        return

    migrations = [
        ("similarity_score", "FLOAT DEFAULT 0.0"),
        ("duplicate_request_id", "VARCHAR"),
        ("duplicate_flag", "VARCHAR DEFAULT 'None'"),
        ("ai_recommendation", "VARCHAR"),
    ]

    for col_name, col_def in migrations:
        if col_name not in existing_cols:
            print(f"[migrate] Adding missing column: {col_name}")
            with engine.connect() as conn:
                conn.exec_driver_sql(
                    f"ALTER TABLE prior_auth_requests ADD COLUMN {col_name} {col_def}"
                )
                conn.commit()
                print(f"[migrate] Added column: {col_name}")

    try:
        existing_tables = inspector.get_table_names()
    except Exception:
        return

    if "email_logs" not in existing_tables:
        print("[migrate] Creating email_logs table...")
        EmailLog.__table__.create(engine)
        print("[migrate] Created email_logs table")

    # Ensure users.email has a UNIQUE constraint
    try:
        indexes = inspector.get_indexes("users")
        has_email_unique = any(
            "email" in idx.get("column_names", []) and idx.get("unique")
            for idx in indexes
        )
    except Exception:
        has_email_unique = False

    if not has_email_unique:
        print("[migrate] Adding UNIQUE constraint on users.email...")
        with engine.connect() as conn:
            conn.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email)"
            )
            conn.commit()
            print("[migrate] Added UNIQUE constraint on users.email")


_migrate_schema()

# ==========================================
# SENTRY (optional — set SENTRY_DSN in .env)
# ==========================================

import os

try:
    import sentry_sdk

    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=0.2,
            environment=os.getenv("APP_ENV", "development"),
        )
        print("[sentry] Sentry initialized")
    else:
        print("[sentry] SENTRY_DSN not set — skipping")
except ImportError:
    print("[sentry] sentry-sdk not installed — skipping")

# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="Zintellect API",
    description="""
    AI-Powered Prior Authorization
    Automation Platform
    """,
    version="2.0.0",
)

# ==========================================
# ENABLE CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        url.strip()
        for url in os.getenv(
            "FRONTEND_URL",
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:5174,http://127.0.0.1:5174,"
            "http://localhost:5175,http://127.0.0.1:5175,"
            "http://localhost:5176,http://127.0.0.1:5176,"
            "http://localhost:5177,http://127.0.0.1:5177,"
            "http://localhost:5178,http://127.0.0.1:5178,"
            "http://localhost:5179,http://127.0.0.1:5179",
        ).split(",")
        if url.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# GLOBAL ERROR HANDLER → n8n → Telegram
# ==========================================

from fastapi import Request
from fastapi.responses import JSONResponse


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler for unhandled errors.
    Emits an error event to n8n for Telegram notification,
    then returns a safe generic error to the frontend.
    Never exposes internal details to the client.
    """
    try:
        from app.services.error_monitor import emit_error

        # Extract safe request context
        route = str(request.url.path)
        method = request.method
        request_id = getattr(request.state, "request_id", "")

        emit_error(
            error=exc,
            route=route,
            method=method,
            request_id=request_id,
        )
    except Exception:
        # Error monitoring must never break the error handler
        pass

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ==========================================
# REGISTER ROUTES
# ==========================================

app.include_router(provider_router)
app.include_router(member_router)
app.include_router(request_router)
app.include_router(policy_router)
app.include_router(admin_router)
app.include_router(doctor_router)
app.include_router(patient_router)
app.include_router(provider_unified_router)
app.include_router(similarity_router)
app.include_router(ai_explanation_router)
app.include_router(n8n_router)
app.include_router(review_router)
app.include_router(evidence_trace_router)
app.include_router(contradiction_router)
app.include_router(document_quality_router)
app.include_router(evidence_extraction_router)
app.include_router(policy_versioning_router)
app.include_router(provider_communication_router)
app.include_router(request_prioritization_router)
app.include_router(readiness_score_router)
app.include_router(appeal_assistant_router)
app.include_router(chat_router)

# ==========================================
# HEALTH CHECK
# ==========================================


@app.get("/")
def home():

    return {
        "message": "Zintellect Backend Running",
        "status": "Healthy",
        "version": "2.0.0",
    }


# ==========================================
# ERROR MONITORING TEST ENDPOINT
# ==========================================


@app.get("/test-error-monitor")
def test_error_monitor():
    """
    Test endpoint for error monitoring.
    Deliberately raises an error to trigger the error monitor.
    Only available in development environment.
    """
    if APP_ENV != "development":
        return {"detail": "Not available in production"}
    raise RuntimeError("Test error: error monitoring pipeline test")


# ==========================================
# SLA BREACH BACKGROUND JOB (APScheduler)
# ==========================================

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from app.services.notification_service import check_sla_breaches

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        check_sla_breaches,
        "interval",
        minutes=5,
        id="sla_breach_check",
        replace_existing=True,
    )
    _scheduler.start()
    print("[scheduler] SLA breach check started (every 5 minutes)")
except ImportError:
    print("[scheduler] apscheduler not installed, SLA checks disabled")
