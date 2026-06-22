from fastapi import APIRouter

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.db import SessionLocal

from app.models.member_model import InsuranceMember

from app.models.provider_model import InsuranceProvider

from app.services.email_service import send_insurance_email

import uuid


router = APIRouter()

# ==========================================
# REQUEST MODELS
# ==========================================


class InsuranceRegistrationRequest(BaseModel):
    patient_name: str

    email: str

    insurance_provider: str


class InsuranceVerificationRequest(BaseModel):
    insurance_provider: str

    insurance_id: str

    patient_name: str


# ==========================================
# REGISTER INSURANCE MEMBER
# ==========================================


@router.post("/register-insurance-member")
def register_insurance_member(request: InsuranceRegistrationRequest):

    db: Session = SessionLocal()

    try:
        # ==========================================
        # VERIFY PROVIDER
        # ==========================================

        provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.provider_name == request.insurance_provider)
            .first()
        )

        if not provider:
            return {"status": "Failed", "message": "Insurance provider not found"}

        # ==========================================
        # GENERATE IDS
        # ==========================================

        insurance_id = "ZIN-" + str(uuid.uuid4())[:8].upper()

        policy_number = "POL-" + str(uuid.uuid4())[:12].upper()

        # ==========================================
        # CREATE INSURANCE MEMBER
        # ==========================================

        insurance_member = InsuranceMember(
            id=str(uuid.uuid4()),
            insurance_provider_id=provider.id,
            insurance_provider=provider.provider_name,
            patient_name=request.patient_name,
            patient_email=request.email,
            insurance_id=insurance_id,
            policy_number=policy_number,
            coverage_status="Active",
        )

        db.add(insurance_member)

        db.commit()

        db.refresh(insurance_member)

        # ==========================================
        # SEND EMAIL
        # ==========================================

        send_insurance_email(
            patient_email=insurance_member.patient_email,
            patient_name=insurance_member.patient_name,
            insurance_id=insurance_member.insurance_id,
            provider_name=insurance_member.insurance_provider,
            procedure_name="Healthcare Prior Authorization",
        )

        print("Insurance Registration Email Sent")

        # ==========================================
        # RESPONSE
        # ==========================================

        return {
            "status": "Success",
            "message": "Insurance registered successfully",
            "insurance_provider": insurance_member.insurance_provider,
            "insurance_id": insurance_member.insurance_id,
            "policy_number": insurance_member.policy_number,
            "coverage_status": insurance_member.coverage_status,
        }

    except Exception as error:
        print("Insurance Registration Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()


# ==========================================
# VERIFY INSURANCE
# ==========================================


@router.post("/verify-insurance")
def verify_insurance(request: InsuranceVerificationRequest):

    db: Session = SessionLocal()

    try:
        member = (
            db.query(InsuranceMember)
            .filter(
                InsuranceMember.insurance_provider == request.insurance_provider,
                InsuranceMember.insurance_id == request.insurance_id,
                InsuranceMember.patient_name == request.patient_name,
            )
            .first()
        )

        if not member:
            return {"status": "Rejected", "message": "Insurance verification failed"}

        return {
            "status": "Verified",
            "patient_name": member.patient_name,
            "patient_email": member.patient_email,
            "insurance_provider": member.insurance_provider,
            "coverage_status": member.coverage_status,
            "policy_number": member.policy_number,
            "insurance_id": member.insurance_id,
        }

    except Exception as error:
        print("Insurance Verification Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()


# ==========================================
# GET INSURANCE DETAILS
# ==========================================


@router.get("/insurance-details/{insurance_id}")
def get_insurance_details(insurance_id: str):

    db: Session = SessionLocal()

    try:
        member = (
            db.query(InsuranceMember)
            .filter(InsuranceMember.insurance_id == insurance_id)
            .first()
        )

        if not member:
            return {"status": "Failed", "message": "Insurance ID not found"}

        return {
            "status": "Success",
            "patient_name": member.patient_name,
            "patient_email": member.patient_email,
            "insurance_provider": member.insurance_provider,
            "policy_number": member.policy_number,
            "coverage_status": member.coverage_status,
            "insurance_id": member.insurance_id,
        }

    except Exception as error:
        print("Insurance Fetch Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()


# ==========================================
# PATIENT LOGIN
# ==========================================


class PatientLoginRequest(BaseModel):
    email: str


@router.post("/patient-login")
def patient_login(request: PatientLoginRequest):

    db: Session = SessionLocal()

    try:
        member = (
            db.query(InsuranceMember)
            .filter(InsuranceMember.patient_email == request.email)
            .first()
        )

        if not member:
            return {"status": "Failed", "message": "Patient not found with this email"}

        return {
            "status": "Success",
            "patient_name": member.patient_name,
            "patient_email": member.patient_email,
            "insurance_provider": member.insurance_provider,
            "policy_number": member.policy_number,
            "coverage_status": member.coverage_status,
            "insurance_id": member.insurance_id,
        }

    except Exception as error:
        print("Patient Login Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()
