"""
Seed script: Creates/updates the 4 demo login accounts.

  Doctor   doctor@gmail.com   / doctor123
  Patient  patient@gmail.com  / patient123
  Provider provider@gmail.com / provider123
  Admin    admin@gmail.com    / admin123

Idempotent (safe to re-run). Creates the account rows each portal login
needs: the `users` row (authentication) plus the role-specific profile
rows (`doctors`, `insurance_members`, `insurance_providers`).

Usage (from backend/):
  python seed_demo_credentials.py
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(__file__))

from app.database.db import SessionLocal  # noqa: E402
from app.models.user_model import User  # noqa: E402
from app.models.doctor_model import Doctor  # noqa: E402
from app.models.member_model import InsuranceMember  # noqa: E402
from app.models.provider_model import InsuranceProvider  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402

CREDENTIALS = {
    "Doctor": {"email": "doctor@gmail.com", "password": "doctor123"},
    "Patient": {"email": "patient@gmail.com", "password": "patient123"},
    "Provider": {"email": "provider@gmail.com", "password": "provider123"},
    "Admin": {"email": "admin@gmail.com", "password": "admin123"},
}

PROVIDER_NAME = "Blue Cross Blue Shield"


def upsert_user(db, email, password, role, fields):
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            role=role,
            is_active=True,
            is_verified=True,
            **fields,
        )
        db.add(user)
    else:
        user.role = role
        user.is_active = True
        user.is_verified = True
        for key, value in fields.items():
            setattr(user, key, value)
    user.password_hash = hash_password(password)
    return user


def seed():
    db = SessionLocal()
    try:
        log = []

        # ========== PROVIDER ==========
        prov = CREDENTIALS["Provider"]
        provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == prov["email"])
            .first()
        )
        if provider is None:
            provider = InsuranceProvider(
                id=str(uuid.uuid4()),
                provider_name=PROVIDER_NAME,
                email=prov["email"],
                password_hash=hash_password(prov["password"]),
                phone="800-123-4001",
                role="Provider",
                is_active=True,
            )
            db.add(provider)
        else:
            provider.provider_name = PROVIDER_NAME
            provider.phone = provider.phone or "800-123-4001"
            provider.role = "Provider"
            provider.is_active = True
            provider.password_hash = hash_password(prov["password"])
        db.flush()
        log.append(f"Provider: {prov['email']} / {prov['password']}")

        # ========== PROVIDER USER ==========
        puser = upsert_user(
            db,
            prov["email"],
            prov["password"],
            "Provider",
            {"provider_name": PROVIDER_NAME, "first_name": PROVIDER_NAME},
        )

        # ========== PATIENT ==========
        pat = CREDENTIALS["Patient"]
        member = (
            db.query(InsuranceMember)
            .filter(InsuranceMember.patient_email == pat["email"])
            .first()
        )
        insurance_id = "ZIN-DEMO0001"
        policy_number = "POL-DEMO-0001"
        if member is None:
            member = InsuranceMember(
                id=str(uuid.uuid4()),
                insurance_provider_id=provider.id,
                insurance_provider=PROVIDER_NAME,
                patient_name="Demo Patient",
                patient_email=pat["email"],
                phone="555-0200",
                insurance_id=insurance_id,
                policy_number=policy_number,
                coverage_status="Active",
            )
            db.add(member)
        else:
            member.insurance_provider_id = provider.id
            member.insurance_provider = PROVIDER_NAME
            member.patient_name = member.patient_name or "Demo Patient"
            member.insurance_id = member.insurance_id or insurance_id
            member.policy_number = member.policy_number or policy_number
            member.coverage_status = "Active"
        db.flush()

        puser = upsert_user(
            db,
            pat["email"],
            pat["password"],
            "Patient",
            {
                "first_name": "Demo Patient",
                "phone": "555-0200",
                "member_id": member.insurance_id,
                "insurance_provider_id": provider.id,
            },
        )
        log.append(f"Patient: {pat['email']} / {pat['password']}")

        # ========== DOCTOR ==========
        doc = CREDENTIALS["Doctor"]
        duser = upsert_user(
            db,
            doc["email"],
            doc["password"],
            "Doctor",
            {
                "first_name": "Demo",
                "last_name": "Doctor",
                "phone": "555-0100",
                "hospital_name": "City General Hospital",
                "specialization": "General Medicine",
                "license_number": "LIC-DEMO-001",
            },
        )
        doctor = db.query(Doctor).filter(Doctor.email == doc["email"]).first()
        if doctor is None:
            doctor = Doctor(
                id=str(uuid.uuid4()),
                doctor_name="Demo Doctor",
                email=doc["email"],
                password_hash=hash_password(doc["password"]),
                hospital_name="City General Hospital",
                specialization="General Medicine",
                license_number="LIC-DEMO-001",
                phone="555-0100",
                role="Doctor",
                is_active=True,
            )
            db.add(doctor)
        else:
            doctor.doctor_name = "Demo Doctor"
            doctor.hospital_name = "City General Hospital"
            doctor.specialization = "General Medicine"
            doctor.phone = "555-0100"
            doctor.role = "Doctor"
            doctor.is_active = True
            doctor.password_hash = hash_password(doc["password"])
        log.append(f"Doctor: {doc['email']} / {doc['password']}")

        # ========== ADMIN ==========
        adm = CREDENTIALS["Admin"]
        upsert_user(
            db,
            adm["email"],
            adm["password"],
            "Admin",
            {"first_name": "System", "last_name": "Admin"},
        )
        log.append(f"Admin: {adm['email']} / {adm['password']}")

        db.commit()

        print("=" * 60)
        print("DEMO CREDENTIALS SEEDED")
        print("=" * 60)
        for line in log:
            print(f"  - {line}")
        print("=" * 60)
    except Exception as error:
        db.rollback()
        print(f"Seeding failed: {error}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()