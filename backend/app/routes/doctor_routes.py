from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database.db import SessionLocal
from app.models.user_model import User
from app.models.request_model import PriorAuthRequest
from app.models.audit_log_model import AuditLog
from app.models.notification_model import Notification
from app.services.auth_middleware import verify_jwt_token
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)
from datetime import datetime
import uuid

router = APIRouter(prefix="/doctor", tags=["Doctor"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_doctor(payload: dict = Depends(verify_jwt_token)):
    if payload.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required")
    return payload


class DoctorRegisterRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    hospital_name: str | None = None
    specialization: str | None = None
    license_number: str | None = None
    phone: str | None = None


class DoctorLoginRequest(BaseModel):
    email: EmailStr
    password: str


class DoctorProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    hospital_name: str | None = None
    specialization: str | None = None
    license_number: str | None = None


@router.post("/register")
def doctor_register(request: DoctorRegisterRequest):
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
            role="Doctor",
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            hospital_name=request.hospital_name,
            specialization=request.specialization,
            license_number=request.license_number,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token = create_access_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": "doctor",
                "name": f"{user.first_name} {user.last_name}",
            }
        )

        # Update Doctor model too if it exists (standalone table)
        from app.models.doctor_model import Doctor

        existing_doctor = db.query(Doctor).filter(Doctor.email == request.email).first()
        if not existing_doctor:
            doctor = Doctor(
                id=str(uuid.uuid4()),
                doctor_name=f"{request.first_name} {request.last_name}",
                email=request.email,
                password_hash=hash_password(request.password),
                hospital_name=request.hospital_name,
                specialization=request.specialization,
                license_number=request.license_number,
                phone=request.phone,
                role="Doctor",
                is_active=True,
            )
            db.add(doctor)
            db.commit()

        return {
            "status": "Success",
            "message": "Doctor registered successfully",
            "access_token": access_token,
            "doctor_id": user_id,
            "doctor_name": f"{user.first_name} {user.last_name}",
            "email": user.email,
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Doctor Registration Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.post("/login")
def doctor_login(request: DoctorLoginRequest):
    db: Session = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(
                User.email == request.email,
                User.role == "Doctor",
                User.is_active == True,
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
            "email": user.email,
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Doctor Login Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.get("/profile")
def get_doctor_profile(
    payload: dict = Depends(require_doctor), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "phone": user.phone or "",
        "hospital_name": user.hospital_name or "",
        "specialization": user.specialization or "",
        "license_number": user.license_number or "",
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/profile")
def update_doctor_profile(
    request: DoctorProfileUpdate,
    payload: dict = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found")

    for field, value in request.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    db.commit()

    # Also update the standalone Doctor model
    from app.models.doctor_model import Doctor

    doctor_record = db.query(Doctor).filter(Doctor.email == user.email).first()
    if doctor_record:
        name_parts = []
        if user.first_name:
            name_parts.append(user.first_name)
        if user.last_name:
            name_parts.append(user.last_name)
        if name_parts:
            doctor_record.doctor_name = " ".join(name_parts)
        if user.hospital_name:
            doctor_record.hospital_name = user.hospital_name
        if user.specialization:
            doctor_record.specialization = user.specialization
        if user.license_number:
            doctor_record.license_number = user.license_number
        if user.phone:
            doctor_record.phone = user.phone
        db.commit()

    return {"status": "Success", "message": "Profile updated"}


@router.get("/requests")
def get_doctor_requests(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payload: dict = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    doctor_name = payload.get("name", "")
    doctor_email = payload.get("email", "")

    query = db.query(PriorAuthRequest).filter(
        or_(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.patient_id.ilike(f"%{doctor_email}%"),
        )
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
                "procedure_code": r.procedure_code,
                "insurance_provider": r.insurance_provider,
                "status": r.status,
                "processing_stage": r.processing_stage,
                "confidence_score": r.confidence_score,
                "urgency_level": r.urgency_level,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
        )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/patients")
def get_doctor_patients(
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payload: dict = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    doctor_name = payload.get("name", "")

    patient_query = (
        db.query(
            PriorAuthRequest.patient_name,
            PriorAuthRequest.patient_id,
            PriorAuthRequest.insurance_provider,
            PriorAuthRequest.diagnosis,
        )
        .filter(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.patient_name.isnot(None),
        )
        .distinct()
    )

    if search:
        patient_query = patient_query.filter(
            or_(
                PriorAuthRequest.patient_name.ilike(f"%{search}%"),
                PriorAuthRequest.patient_id.ilike(f"%{search}%"),
            )
        )

    total_query = patient_query
    total = total_query.count()

    patients_data = (
        patient_query.order_by(PriorAuthRequest.patient_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for p in patients_data:
        request_count = (
            db.query(PriorAuthRequest)
            .filter(PriorAuthRequest.patient_id == p.patient_id)
            .count()
        )
        latest_request = (
            db.query(PriorAuthRequest)
            .filter(PriorAuthRequest.patient_id == p.patient_id)
            .order_by(desc(PriorAuthRequest.created_at))
            .first()
        )
        items.append(
            {
                "patient_name": p.patient_name,
                "patient_id": p.patient_id,
                "insurance_provider": p.insurance_provider or "",
                "diagnosis": p.diagnosis or "",
                "total_requests": request_count,
                "last_request_date": latest_request.created_at.isoformat()
                if latest_request and latest_request.created_at
                else None,
                "last_status": latest_request.status if latest_request else None,
            }
        )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/notifications")
def get_doctor_notifications(
    payload: dict = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    user_id = payload.get("sub")
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
        )
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


@router.get("/stats")
def get_doctor_stats(
    payload: dict = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    doctor_name = payload.get("name", "")

    total_requests = (
        db.query(PriorAuthRequest)
        .filter(PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"))
        .count()
    )
    approved = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.status == "Approved",
        )
        .count()
    )
    rejected = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.status == "Rejected",
        )
        .count()
    )
    pending = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.status == "Pending",
        )
        .count()
    )
    manual_review = (
        db.query(PriorAuthRequest)
        .filter(
            PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"),
            PriorAuthRequest.status == "Manual Review",
        )
        .count()
    )

    total_patients = (
        db.query(PriorAuthRequest.patient_id)
        .filter(PriorAuthRequest.doctor_name.ilike(f"%{doctor_name}%"))
        .distinct()
        .count()
    )

    return {
        "total_requests": total_requests,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "manual_review": manual_review,
        "total_patients": total_patients,
        "approval_rate": round(
            (approved / total_requests * 100) if total_requests > 0 else 0, 1
        ),
    }
