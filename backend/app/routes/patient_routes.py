from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database.db import SessionLocal
from app.models.user_model import User
from app.models.member_model import InsuranceMember
from app.models.request_model import PriorAuthRequest
from app.models.notification_model import Notification
from app.services.auth_middleware import require_role
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.services.email_service import send_insurance_email
from datetime import datetime
import uuid

router = APIRouter(prefix="/patient", tags=["Patient"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PatientRegisterRequest(BaseModel):
    patient_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    insurance_provider: str
    phone: str | None = None


class PatientLoginRequest(BaseModel):
    email: EmailStr
    password: str


class PatientProfileUpdate(BaseModel):
    patient_name: str | None = None
    phone: str | None = None
    address: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None


@router.post("/register")
def patient_register(request: PatientRegisterRequest):
    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        from app.models.provider_model import InsuranceProvider

        provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.provider_name == request.insurance_provider)
            .first()
        )
        if not provider:
            raise HTTPException(status_code=400, detail="Insurance provider not found")

        insurance_id = "ZIN-" + str(uuid.uuid4())[:8].upper()
        policy_number = "POL-" + str(uuid.uuid4())[:12].upper()

        user_id = str(uuid.uuid4())
        member_id = str(uuid.uuid4())

        user = User(
            id=user_id,
            email=request.email,
            password_hash=hash_password(request.password),
            role="Patient",
            first_name=request.patient_name,
            phone=request.phone,
            member_id=insurance_id,
            insurance_provider_id=provider.id,
            is_active=True,
            is_verified=True,
        )
        db.add(user)

        member = InsuranceMember(
            id=member_id,
            insurance_provider_id=provider.id,
            insurance_provider=provider.provider_name,
            patient_name=request.patient_name,
            patient_email=request.email,
            phone=request.phone,
            insurance_id=insurance_id,
            policy_number=policy_number,
            coverage_status="Active",
        )
        db.add(member)
        db.commit()

        try:
            send_insurance_email(
                patient_email=request.email,
                patient_name=request.patient_name,
                insurance_id=insurance_id,
                provider_name=provider.provider_name,
                procedure_name="Healthcare Prior Authorization",
            )
        except Exception:
            pass

        access_token = create_access_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": "patient",
                "name": request.patient_name,
            }
        )

        return {
            "status": "Success",
            "message": "Patient registered successfully",
            "access_token": access_token,
            "patient_name": request.patient_name,
            "patient_email": request.email,
            "insurance_provider": provider.provider_name,
            "insurance_id": insurance_id,
            "policy_number": policy_number,
            "coverage_status": "Active",
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Patient Registration Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.post("/login")
def patient_login(request: PatientLoginRequest):
    db: Session = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(
                User.email == request.email,
                User.role == "Patient",
                User.is_active == True,
            )
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=401, detail="Invalid credentials or not a patient"
            )
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        member = (
            db.query(InsuranceMember)
            .filter(InsuranceMember.patient_email == request.email)
            .first()
        )

        access_token = create_access_token(
            {
                "sub": user.id,
                "email": user.email,
                "role": "patient",
                "name": user.first_name or "Patient",
            }
        )
        user.last_login = datetime.utcnow()
        db.commit()

        return {
            "status": "Success",
            "access_token": access_token,
            "patient_name": user.first_name
            or (member.patient_name if member else "Patient"),
            "patient_email": user.email,
            "insurance_provider": member.insurance_provider if member else "",
            "insurance_id": member.insurance_id if member else "",
            "policy_number": member.policy_number if member else "",
            "coverage_status": member.coverage_status if member else "Active",
        }

    except HTTPException:
        raise
    except Exception as error:
        print("Patient Login Error:", error)
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        db.close()


@router.get("/lookup/{patient_id}")
def lookup_patient(patient_id: str, db: Session = Depends(get_db)):
    from sqlalchemy import or_

    member = (
        db.query(InsuranceMember)
        .filter(
            or_(
                InsuranceMember.insurance_id == patient_id,
                InsuranceMember.patient_email == patient_id,
                InsuranceMember.patient_name.ilike(f"%{patient_id}%"),
            )
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Patient not found")
    user = db.query(User).filter(User.email == member.patient_email).first()
    return {
        "patient_name": member.patient_name,
        "patient_email": member.patient_email,
        "insurance_provider": member.insurance_provider,
        "insurance_id": member.insurance_id,
        "policy_number": member.policy_number,
        "phone": member.phone or "",
        "date_of_birth": member.date_of_birth or "",
        "gender": member.gender or "",
        "address": member.address or "",
        "member_id": user.member_id if user else "",
    }


@router.get("/profile")
def get_patient_profile(
    payload: dict = Depends(require_role("patient")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    member = (
        db.query(InsuranceMember)
        .filter(InsuranceMember.patient_email == user.email)
        .first()
    )
    return {
        "id": user.id,
        "email": user.email,
        "patient_name": user.first_name or "",
        "phone": user.phone or "",
        "insurance_provider": member.insurance_provider if member else "",
        "insurance_id": member.insurance_id if member else "",
        "policy_number": member.policy_number if member else "",
        "coverage_status": member.coverage_status if member else "Active",
        "date_of_birth": str(member.date_of_birth)
        if member and member.date_of_birth
        else "",
        "gender": member.gender if member and member.gender else "",
        "address": member.address if member and member.address else "",
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/profile")
def update_patient_profile(
    request: PatientProfileUpdate,
    payload: dict = Depends(require_role("patient")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    member = (
        db.query(InsuranceMember)
        .filter(InsuranceMember.patient_email == user.email)
        .first()
    )

    if request.patient_name:
        user.first_name = request.patient_name
        if member:
            member.patient_name = request.patient_name
    if request.phone:
        user.phone = request.phone
        if member:
            member.phone = request.phone
    if member:
        if request.address:
            member.address = request.address
        if request.date_of_birth:
            member.date_of_birth = request.date_of_birth
        if request.gender:
            member.gender = request.gender
    db.commit()
    return {"status": "Success", "message": "Profile updated"}


@router.get("/requests")
def get_patient_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    payload: dict = Depends(require_role("patient")),
    db: Session = Depends(get_db),
):
    email = payload.get("email", "")
    name = payload.get("name", "")

    query = db.query(PriorAuthRequest).filter(
        or_(
            PriorAuthRequest.patient_id == email,
            PriorAuthRequest.patient_name.ilike(f"%{name}%"),
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
                "diagnosis": r.diagnosis,
                "procedure_code": r.procedure_code,
                "insurance_provider": r.insurance_provider,
                "status": r.status,
                "confidence_score": r.confidence_score,
                "urgency_level": r.urgency_level,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
        )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/stats")
def get_patient_stats(
    payload: dict = Depends(require_role("patient")),
    db: Session = Depends(get_db),
):
    email = payload.get("email", "")
    name = payload.get("name", "")

    total_requests = (
        db.query(PriorAuthRequest)
        .filter(
            or_(
                PriorAuthRequest.patient_id == email,
                PriorAuthRequest.patient_name.ilike(f"%{name}%"),
            )
        )
        .count()
    )
    approved = (
        db.query(PriorAuthRequest)
        .filter(
            or_(
                PriorAuthRequest.patient_id == email,
                PriorAuthRequest.patient_name.ilike(f"%{name}%"),
            ),
            PriorAuthRequest.status == "Approved",
        )
        .count()
    )
    pending = (
        db.query(PriorAuthRequest)
        .filter(
            or_(
                PriorAuthRequest.patient_id == email,
                PriorAuthRequest.patient_name.ilike(f"%{name}%"),
            ),
            PriorAuthRequest.status == "Pending",
        )
        .count()
    )
    rejected = (
        db.query(PriorAuthRequest)
        .filter(
            or_(
                PriorAuthRequest.patient_id == email,
                PriorAuthRequest.patient_name.ilike(f"%{name}%"),
            ),
            PriorAuthRequest.status == "Rejected",
        )
        .count()
    )

    return {
        "total_requests": total_requests,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
    }


@router.get("/notifications")
def get_patient_notifications(
    payload: dict = Depends(require_role("patient")),
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
