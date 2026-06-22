from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import Base, engine

load_dotenv()

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
