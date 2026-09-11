from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import PolicyStatus
from app.services.audit_service import AuditLogCreate, new_audit_entry
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func, cast, Date
from app.database.db import SessionLocal
from app.models.user_model import User
from app.models.policy_model import InsurancePolicy
from app.models.audit_log_model import AuditLog
from app.models.request_model import PriorAuthRequest
from app.services.auth_middleware import verify_jwt_token
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
)
from app.services.email_service import send_insurance_email
from app.services.email.sender import send_test_email
from app.services.email.config import email_settings
from datetime import datetime, timedelta
import asyncio
import uuid
import secrets

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_admin(payload: dict = Depends(verify_jwt_token)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = Field(pattern="^(Doctor|Provider|Patient|Admin)$")
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    hospital_name: str | None = None
    specialization: str | None = None
    license_number: str | None = None
    provider_name: str | None = None


class UpdateUserRequest(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    hospital_name: str | None = None
    specialization: str | None = None
    license_number: str | None = None
    provider_name: str | None = None


class PolicyStatusUpdate(BaseModel):
    status: PolicyStatus
    comment: str | None = None


class SettingsUpdate(BaseModel):
    routine_hours: int = Field(ge=1, le=168, default=48)
    urgent_hours: int = Field(ge=1, le=72, default=24)
    critical_hours: int = Field(ge=1, le=24, default=12)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


admin_settings = {"routine_hours": 48, "urgent_hours": 24, "critical_hours": 12}


# ==========================================
# ADMIN LOGIN
# ==========================================


@router.post("/login")
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.email == request.email, User.role == "Admin", User.is_active == True
        )
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid credentials or not an admin"
        )
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "role": "admin",
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip()
            or "Administrator",
        }
    )
    user.last_login = datetime.utcnow()
    db.commit()
    return {
        "status": "Success",
        "access_token": access_token,
        "admin_id": user.id,
        "admin_name": f"{user.first_name or ''} {user.last_name or ''}".strip()
        or "Administrator",
    }


# ==========================================
# DOCTOR LOGIN
# ==========================================


@router.post("/doctor-login")
def doctor_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.email == request.email, User.role == "Doctor", User.is_active == True
        )
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=401, detail="Invalid credentials or not a doctor"
        )
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "role": "doctor",
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip()
            or "Doctor",
        }
    )
    user.last_login = datetime.utcnow()
    db.commit()
    return {
        "status": "Success",
        "access_token": access_token,
        "doctor_id": user.id,
        "doctor_name": f"{user.first_name or ''} {user.last_name or ''}".strip()
        or "Doctor",
    }


# ==========================================
# USERS
# ==========================================


@router.get("/users")
def get_users(
    role: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    users = (
        query.order_by(desc(User.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = []
    for u in users:
        d = {c.name: getattr(u, c.name) for c in u.__table__.columns}
        d.pop("password_hash", None)
        items.append(d)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/users")
def create_user(
    request: CreateUserRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=request.email,
        password_hash=hash_password(request.password),
        role=request.role,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        hospital_name=request.hospital_name,
        specialization=request.specialization,
        license_number=request.license_number,
        provider_name=request.provider_name,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    audit = new_audit_entry(
        AuditLogCreate(
            user_id=payload.get("sub"),
            role="Admin",
            action="USER_CREATED",
            description=f"Created user {request.email} with role {request.role}",
        )
    )
    db.add(audit)
    db.commit()
    return {"status": "Success", "message": "User created", "user_id": user_id}


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in request.model_dump(exclude_none=True).items():
        if field != "password_hash":
            setattr(user, field, value)
    db.commit()
    audit = new_audit_entry(
        AuditLogCreate(
            user_id=payload.get("sub"),
            role="Admin",
            action="USER_UPDATED",
            description=f"Updated user {user_id}",
        )
    )
    db.add(audit)
    db.commit()
    return {"status": "Success", "message": "User updated"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str, db: Session = Depends(get_db), payload: dict = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    audit = new_audit_entry(
        AuditLogCreate(
            user_id=payload.get("sub"),
            role="Admin",
            action="USER_DEACTIVATED",
            description=f"Deactivated user {user_id}",
        )
    )
    db.add(audit)
    db.commit()
    return {"status": "Success", "message": "User deactivated"}


# ==========================================
# POLICIES
# ==========================================


@router.get("/policies")
def get_policies(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    query = db.query(InsurancePolicy)
    if status:
        query = query.filter(InsurancePolicy.status == status)
    if search:
        query = query.filter(
            or_(
                InsurancePolicy.procedure_name.ilike(f"%{search}%"),
                InsurancePolicy.insurance_provider.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    policies = (
        query.order_by(desc(InsurancePolicy.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = []
    for p in policies:
        d = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        items.append(d)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.patch("/policies/{policy_id}")
def update_policy_status(
    policy_id: str,
    request: PolicyStatusUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.status = request.status
    policy.approved_by = payload.get("sub")
    policy.approved_at = datetime.utcnow()
    if request.status == "rejected" and request.comment:
        policy.rejection_comment = request.comment
    elif request.status == "approved":
        policy.rejection_comment = None
    db.commit()
    audit = new_audit_entry(
        AuditLogCreate(
            user_id=payload.get("sub"),
            role="Admin",
            action="POLICY_STATUS_CHANGED",
            description=f"Policy {policy_id} {request.status.value if hasattr(request.status, 'value') else request.status}",
        )
    )
    db.add(audit)
    db.commit()
    return {"status": "Success", "message": f"Policy {request.status}"}


# ==========================================
# ANALYTICS
# ==========================================


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db), payload: dict = Depends(require_admin)
):
    total_requests = db.query(PriorAuthRequest).count()
    approved_requests = (
        db.query(PriorAuthRequest).filter(PriorAuthRequest.status == "Approved").count()
    )
    rejected_requests = (
        db.query(PriorAuthRequest).filter(PriorAuthRequest.status == "Rejected").count()
    )
    pending_requests = (
        db.query(PriorAuthRequest).filter(PriorAuthRequest.status == "Pending").count()
    )
    manual_review = (
        db.query(PriorAuthRequest)
        .filter(PriorAuthRequest.status == "Manual Review")
        .count()
    )
    pending_policies = (
        db.query(InsurancePolicy).filter(InsurancePolicy.status == "pending").count()
    )
    total_users = db.query(User).filter(User.is_active == True).count()
    doctors = (
        db.query(User).filter(User.role == "Doctor", User.is_active == True).count()
    )
    providers = (
        db.query(User).filter(User.role == "Provider", User.is_active == True).count()
    )
    patients = (
        db.query(User).filter(User.role == "Patient", User.is_active == True).count()
    )
    admins = db.query(User).filter(User.role == "Admin", User.is_active == True).count()

    requests_over_time = (
        db.query(
            func.date(PriorAuthRequest.created_at).label("date"),
            func.count(PriorAuthRequest.id).label("count"),
        )
        .filter(PriorAuthRequest.created_at.isnot(None))
        .group_by(func.date(PriorAuthRequest.created_at))
        .order_by("date")
        .limit(30)
        .all()
    )

    status_distribution = (
        db.query(
            PriorAuthRequest.status, func.count(PriorAuthRequest.id).label("count")
        )
        .group_by(PriorAuthRequest.status)
        .all()
    )

    avg_confidence = db.query(func.avg(PriorAuthRequest.confidence_score)).scalar() or 0

    recent_audit = (
        db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(10).all()
    )
    recent_activity = [
        {
            "id": a.id,
            "action": a.action,
            "description": a.description,
            "user_id": a.user_id,
            "role": a.role,
            "timestamp": a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent_audit
    ]

    return {
        "total_requests": total_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "pending_requests": pending_requests,
        "manual_review_requests": manual_review,
        "pending_policies": pending_policies,
        "total_users": total_users,
        "doctors": doctors,
        "providers": providers,
        "patients": patients,
        "admins": admins,
        "avg_confidence": round(float(avg_confidence), 2),
        "requests_over_time": [
            {"date": str(r.date), "count": r.count} for r in requests_over_time
        ],
        "status_distribution": [
            {"status": s.status, "count": s.count} for s in status_distribution
        ],
        "recent_activity": recent_activity,
    }


# ==========================================
# POLICY KNOWLEDGE GRAPH
# ==========================================


@router.get("/policy-graph")
def get_policy_graph(
    db: Session = Depends(get_db), payload: dict = Depends(require_admin)
):
    import json

    policies = db.query(InsurancePolicy).all()

    nodes = []
    edges = []
    all_conditions = set()
    all_documents = set()
    providers_set = set()
    procedures_set = set()

    for p in policies:
        providers_set.add(p.insurance_provider)
        procedures_set.add(p.procedure_name)

        nodes.append({
            "id": p.id,
            "label": p.procedure_name,
            "type": "policy",
            "provider": p.insurance_provider,
            "status": p.status,
        })

        conditions = []
        if p.required_conditions:
            try:
                conditions = json.loads(p.required_conditions)
                if isinstance(conditions, str):
                    conditions = [conditions]
            except (json.JSONDecodeError, TypeError):
                conditions = [c.strip() for c in p.required_conditions.split(",") if c.strip()]

        documents = []
        if p.required_documents:
            try:
                documents = json.loads(p.required_documents)
                if isinstance(documents, str):
                    documents = [documents]
            except (json.JSONDecodeError, TypeError):
                documents = [d.strip() for d in p.required_documents.split(",") if d.strip()]

        for cond in conditions:
            all_conditions.add(cond)
            edges.append({
                "source": p.id,
                "target": cond,
                "relationship": "requires_condition",
            })

        for doc in documents:
            all_documents.add(doc)
            edges.append({
                "source": p.id,
                "target": doc,
                "relationship": "requires_document",
            })

    for cond in all_conditions:
        nodes.append({"id": cond, "label": cond, "type": "condition"})
    for doc in all_documents:
        nodes.append({"id": doc, "label": doc, "type": "document"})

    for prov in providers_set:
        nodes.append({"id": f"provider-{prov}", "label": prov, "type": "provider"})
    for proc in procedures_set:
        nodes.append({"id": f"procedure-{proc}", "label": proc, "type": "procedure"})

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_policies": len(policies),
            "total_conditions": len(all_conditions),
            "total_documents": len(all_documents),
            "total_providers": len(providers_set),
            "total_relationships": len(edges),
        },
    }


# ==========================================
# AUDIT LOG
# ==========================================


@router.get("/audit")
def get_audit_logs(
    search: str | None = None,
    action: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    query = db.query(AuditLog)
    if search:
        query = query.filter(
            or_(
                AuditLog.description.ilike(f"%{search}%"),
                AuditLog.user_id.ilike(f"%{search}%"),
                AuditLog.request_id.ilike(f"%{search}%"),
            )
        )
    if action:
        query = query.filter(AuditLog.action == action)
    total = query.count()
    logs = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = []
    for log in logs:
        d = {c.name: getattr(log, c.name) for c in log.__table__.columns}
        if d.get("created_at"):
            d["created_at"] = d["created_at"].isoformat()
        items.append(d)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ==========================================
# SETTINGS
# ==========================================


@router.get("/settings")
def get_settings(payload: dict = Depends(require_admin)):
    return {"settings": admin_settings}


@router.patch("/settings")
def update_settings(request: SettingsUpdate, payload: dict = Depends(require_admin)):
    admin_settings["routine_hours"] = request.routine_hours
    admin_settings["urgent_hours"] = request.urgent_hours
    admin_settings["critical_hours"] = request.critical_hours
    return {
        "status": "Success",
        "message": "Settings updated",
        "settings": admin_settings,
    }


# ==========================================
# EVENTS (for polling)
# ==========================================


@router.get("/events")
def get_events(
    since: str | None = None,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    query = db.query(AuditLog)
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(AuditLog.created_at > since_dt)
        except ValueError:
            pass
    events = query.order_by(desc(AuditLog.created_at)).limit(20).all()
    items = []
    for e in events:
        items.append(
            {
                "id": e.id,
                "action": e.action,
                "description": e.description,
                "request_id": e.request_id,
                "role": e.role,
                "timestamp": e.created_at.isoformat() if e.created_at else None,
            }
        )
    return {"events": items}


# ==========================================
# SSE — real-time event stream
# ==========================================


@router.get("/events/stream")
def stream_events(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_admin),
):
    import asyncio, json, time

    def event_generator():
        last_id = None
        while True:
            query = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(10)
            if last_id:
                query = query.filter(AuditLog.id > last_id)
            events = query.all()
            for e in reversed(events):
                last_id = e.id
                data = json.dumps({
                    "id": e.id,
                    "action": e.action,
                    "description": e.description,
                    "request_id": e.request_id,
                    "role": e.role,
                    "timestamp": e.created_at.isoformat() if e.created_at else None,
                })
                yield f"data: {data}\n\n"
            time.sleep(3)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ==========================================
# FORGOT / RESET PASSWORD
# ==========================================


@router.post("/forgot-password")
def admin_forgot_password(request: ForgotPasswordRequest):
    db: Session = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(
                User.email == request.email,
                User.role == "Admin",
                User.is_active == True,
            )
            .first()
        )
        if not user:
            return {
                "status": "Success",
                "message": "If the email exists, a reset link has been sent",
            }
        reset_token = create_password_reset_token(request.email)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=30)
        db.commit()
        try:
            send_insurance_email(
                patient_email=request.email,
                patient_name=user.first_name or "Admin",
                insurance_id="RESET",
                provider_name="Zintellect",
                procedure_name="Password Reset",
            )
        except Exception:
            pass
        return {
            "status": "Success",
            "message": "If the email exists, a reset link has been sent",
        }
    finally:
        db.close()


@router.post("/reset-password")
def admin_reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.services.auth_service import SECRET_KEY, ALGORITHM

    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = (
        db.query(User)
        .filter(
            User.email == email,
            User.role == "Admin",
            User.is_active == True,
            User.reset_token == request.token,
            User.reset_token_expires > datetime.utcnow(),
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user.password_hash = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"status": "Success", "message": "Password reset successful"}


# ==========================================
# TEST EMAIL
# ==========================================


class TestEmailRequest(BaseModel):
    to: str
    template: str = "welcome.html"


@router.post("/test-email")
async def test_email(
    body: TestEmailRequest,
    background_tasks: BackgroundTasks,
    payload: dict = Depends(require_admin),
):
    if not email_settings.enabled:
        raise HTTPException(status_code=503, detail="SMTP not configured")

    context = {
        "user_name": "Test User",
        "role": "doctor",
        "email": body.to,
        "base_url": "http://localhost:5173",
    }
    background_tasks.add_task(
        lambda: asyncio.get_event_loop().run_until_complete(
            send_test_email(body.to, body.template, context)
        )
    )
    return {"message": "Test email queued", "to": body.to, "template": body.template}
