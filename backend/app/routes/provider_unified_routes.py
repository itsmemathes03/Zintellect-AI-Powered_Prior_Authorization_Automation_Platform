from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database.db import SessionLocal
from app.models.user_model import User
from app.models.provider_model import InsuranceProvider
from app.models.policy_model import InsurancePolicy
from app.models.request_model import PriorAuthRequest
from app.models.notification_model import Notification
from app.models.email_log_model import EmailLog
from app.services.auth_middleware import require_role
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.services.email_service import send_decision_email, send_patient_decision_email
from datetime import datetime
import uuid

router = APIRouter(prefix="/provider", tags=["Provider"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ProviderRegisterRequest(BaseModel):
    provider_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = None


class ProviderLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProviderProfileUpdate(BaseModel):
    provider_name: str | None = None
    phone: str | None = None


@router.post("/register")
def provider_register(request: ProviderRegisterRequest):
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = str(uuid.uuid4())

        user = User(
            id=user_id,
            email=request.email,
            password_hash=hash_password(request.password),
            role="Provider",
            first_name=request.provider_name,
            provider_name=request.provider_name,
            phone=request.phone,
            is_active=True,
            is_verified=True,
        )
        db.add(user)

        existing_prov = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == request.email)
            .first()
        )
        if not existing_prov:
            prov = InsuranceProvider(
                id=str(uuid.uuid4()),
                provider_name=request.provider_name,
                email=request.email,
                password_hash=hash_password(request.password),
            )
            db.add(prov)

        db.commit()

        access_token = create_access_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": "provider",
                "name": request.provider_name,
            }
        )

        return {
            "status": "Success",
            "message": "Provider registered successfully",
            "access_token": access_token,
            "provider_id": user_id,
            "provider_name": request.provider_name,
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Provider Registration Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.post("/login")
def provider_login(request: ProviderLoginRequest):
    db: Session = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(
                User.email == request.email,
                User.role == "Provider",
                User.is_active == True,
            )
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=401, detail="Invalid credentials or not a provider"
            )
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": "provider",
                "name": user.provider_name or user.first_name or "Provider",
            }
        )
        user.last_login = datetime.utcnow()
        db.commit()

        return {
            "status": "Success",
            "access_token": access_token,
            "provider_id": user.id,
            "provider_name": user.provider_name or user.first_name or "Provider",
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Provider Login Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.get("/profile")
def get_provider_profile(
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")
    return {
        "id": user.id,
        "email": user.email,
        "provider_name": user.provider_name or "",
        "phone": user.phone or "",
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/profile")
def update_provider_profile(
    request: ProviderProfileUpdate,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")
    if request.provider_name:
        user.provider_name = request.provider_name
        user.first_name = request.provider_name
    if request.phone:
        user.phone = request.phone
    db.commit()
    return {"status": "Success", "message": "Profile updated"}


@router.get("/requests")
def get_provider_requests(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    provider_name = payload.get("name", "")

    query = db.query(PriorAuthRequest).filter(
        PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%")
    )

    if status:
        query = query.filter(PriorAuthRequest.status == status)
    if search:
        query = query.filter(
            or_(
                PriorAuthRequest.patient_name.ilike(f"%{search}%"),
                PriorAuthRequest.diagnosis.ilike(f"%{search}%"),
                PriorAuthRequest.procedure_code.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    requests = (
        query.order_by(desc(PriorAuthRequest.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for r in requests:
        items.append(
            {
                "id": r.id,
                "patient_name": r.patient_name,
                "patient_id": r.patient_id,
                "diagnosis": r.diagnosis,
                "clinical_notes": r.clinical_notes,
                "procedure_code": r.procedure_code,
                "doctor_name": r.doctor_name,
                "insurance_provider": r.insurance_provider,
                "status": r.status,
                "confidence_score": r.confidence_score,
                "urgency_level": r.urgency_level,
                "uploaded_files": r.uploaded_files,
                "xai_reasoning": r.xai_reasoning,
                "matched_policy_clause": r.matched_policy_clause,
                "missing_documents": r.missing_documents,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
        )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


class RequestStatusUpdate(BaseModel):
    status: str
    comment: str | None = None


@router.put("/requests/{request_id}/status")
def update_request_status(
    request_id: str,
    body: RequestStatusUpdate,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    req = db.query(PriorAuthRequest).filter(PriorAuthRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if body.status not in ("Approved", "Rejected"):
        raise HTTPException(
            status_code=400, detail="Status must be Approved or Rejected"
        )

    req.status = body.status
    req.updated_at = datetime.utcnow()
    db.commit()

    patient_email = None
    if req.patient_id:
        patient_user = (
            db.query(User)
            .filter(
                User.id == req.patient_id,
                User.role == "Patient",
            )
            .first()
        )
        if patient_user:
            patient_email = patient_user.email

    patient_notified = False
    if patient_email:
        provider_name = payload.get("name", "Insurance Provider")
        patient_notified = send_patient_decision_email(
            to_email=patient_email,
            patient_name=req.patient_name,
            procedure_code=req.procedure_code,
            diagnosis=req.diagnosis,
            status=body.status,
            provider_name=provider_name,
        )

    email_log_entry = None
    if patient_notified and patient_email:
        email_log_entry = EmailLog(
            request_id=request_id,
            provider_id=payload.get("sub", ""),
            provider_name=payload.get("name", ""),
            to_email=patient_email,
            patient_name=req.patient_name,
            procedure_code=req.procedure_code,
            status=body.status,
            subject=f"Prior Authorization {body.status} - {req.patient_name}",
        )
        db.add(email_log_entry)
        db.commit()

    return {
        "status": "Success",
        "message": f"Request {body.status.lower()}",
        "request_id": request_id,
        "patient_notified": patient_notified,
    }


@router.get("/requests/{request_id}")
def get_request_detail(
    request_id: str,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    req = db.query(PriorAuthRequest).filter(PriorAuthRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        "id": req.id,
        "patient_name": req.patient_name,
        "patient_id": req.patient_id,
        "doctor_name": req.doctor_name,
        "insurance_provider": req.insurance_provider,
        "diagnosis": req.diagnosis,
        "clinical_notes": req.clinical_notes,
        "procedure_code": req.procedure_code,
        "uploaded_files": req.uploaded_files,
        "status": req.status,
        "processing_stage": req.processing_stage,
        "confidence_score": req.confidence_score,
        "urgency_level": req.urgency_level,
        "xai_reasoning": req.xai_reasoning,
        "matched_policy_clause": req.matched_policy_clause,
        "missing_documents": req.missing_documents,
        "similarity_score": req.similarity_score,
        "duplicate_flag": req.duplicate_flag,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "updated_at": req.updated_at.isoformat() if req.updated_at else None,
    }


@router.get("/stats")
def get_provider_stats(
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    provider_name = payload.get("name", "")

    total = (
        db.query(PriorAuthRequest)
        .filter(PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"))
        .count()
    )
    approved = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"),
            PriorAuthRequest.status == "Approved",
        )
        .count()
    )
    pending = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"),
            PriorAuthRequest.status == "Pending",
        )
        .count()
    )
    rejected = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.insurance_provider.ilike(f"%{provider_name}%"),
            PriorAuthRequest.status == "Rejected",
        )
        .count()
    )

    total_policies = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.insurance_provider.ilike(f"%{provider_name}%"))
        .count()
    )

    return {
        "total_requests": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "total_policies": total_policies,
    }


@router.get("/notifications")
def get_provider_notifications(
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    user_id = payload.get("sub")
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    items = []
    for n in notifications:
        items.append(
            {
                "id": n.id,
                "notification_type": n.notification_type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
        )
    return {"items": items}


class SendEmailRequest(BaseModel):
    to_email: str
    doctor_name: str | None = None
    patient_name: str
    procedure_code: str | None = None
    diagnosis: str | None = None
    status: str
    reasoning: str | None = None


@router.post("/requests/{request_id}/send-email")
def send_request_email(
    request_id: str,
    body: SendEmailRequest,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    provider_name = payload.get("name", "Insurance Provider")
    provider_id = payload.get("sub", "")
    success = send_decision_email(
        to_email=body.to_email,
        doctor_name=body.doctor_name,
        patient_name=body.patient_name,
        procedure_code=body.procedure_code,
        diagnosis=body.diagnosis,
        status=body.status,
        reasoning=body.reasoning,
        provider_name=provider_name,
    )
    if success:
        log_entry = EmailLog(
            request_id=request_id,
            provider_id=provider_id,
            provider_name=provider_name,
            to_email=body.to_email,
            doctor_name=body.doctor_name,
            patient_name=body.patient_name,
            procedure_code=body.procedure_code,
            status=body.status,
            subject=f"Prior Authorization {body.status} - {body.patient_name}",
        )
        db.add(log_entry)
        db.commit()
        return {"status": "Success", "message": "Email sent successfully"}
    raise HTTPException(status_code=500, detail="Failed to send email")


@router.get("/email-history")
def get_email_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    payload: dict = Depends(require_role("provider")),
    db: Session = Depends(get_db),
):
    provider_id = payload.get("sub", "")
    query = db.query(EmailLog).filter(EmailLog.provider_id == provider_id)

    if search:
        query = query.filter(
            or_(
                EmailLog.patient_name.ilike(f"%{search}%"),
                EmailLog.to_email.ilike(f"%{search}%"),
                EmailLog.doctor_name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    logs = (
        query.order_by(desc(EmailLog.sent_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for log in logs:
        items.append(
            {
                "id": log.id,
                "request_id": log.request_id,
                "to_email": log.to_email,
                "doctor_name": log.doctor_name,
                "patient_name": log.patient_name,
                "procedure_code": log.procedure_code,
                "status": log.status,
                "subject": log.subject,
                "sent_at": log.sent_at.isoformat() if log.sent_at else None,
            }
        )

    return {"items": items, "total": total, "page": page, "page_size": page_size}
