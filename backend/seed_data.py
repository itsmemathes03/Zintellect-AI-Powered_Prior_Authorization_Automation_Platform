"""
Seed script: Creates bulk test data (providers, doctor, patients, policies).

Usage:
  python seed_data.py                          # creates all test data
  python seed_data.py --quick                  # minimal set (1 provider, 1 doctor, 3 patients)
  python seed_data.py --skip-admin             # skip admin user creation

Run this after starting the backend at least once (to create the DB tables).
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

import uuid
from datetime import datetime
from app.database.db import SessionLocal
from app.models.user_model import User
from app.models.doctor_model import Doctor
from app.models.member_model import InsuranceMember
from app.models.provider_model import InsuranceProvider
from app.models.policy_model import InsurancePolicy
from app.services.auth_service import hash_password


# ==========================================
# TEST DATA
# ==========================================

PROVIDERS = [
    {
        "provider_name": "Blue Cross Blue Shield",
        "email": "bcbs@test.com",
        "password": "test123",
        "phone": "800-123-4001",
    },
    {
        "provider_name": "Aetna",
        "email": "aetna@test.com",
        "password": "test123",
        "phone": "800-123-4002",
    },
    {
        "provider_name": "Cigna",
        "email": "cigna@test.com",
        "password": "test123",
        "phone": "800-123-4003",
    },
    {
        "provider_name": "UnitedHealthcare",
        "email": "uhc@test.com",
        "password": "test123",
        "phone": "800-123-4004",
    },
    {
        "provider_name": "Humana",
        "email": "humana@test.com",
        "password": "test123",
        "phone": "800-123-4005",
    },
]

DOCTORS = [
    {
        "first_name": "Sarah",
        "last_name": "Chen",
        "email": "doctor@test.com",
        "password": "test123",
        "hospital_name": "City General Hospital",
        "specialization": "Cardiology",
        "license_number": "LIC-12345",
        "phone": "555-0100",
    },
]

PATIENTS = [
    {
        "name": "John Smith",
        "email": "john@test.com",
        "password": "test123",
        "phone": "555-0201",
        "provider": "Blue Cross Blue Shield",
    },
    {
        "name": "Emily Johnson",
        "email": "emily@test.com",
        "password": "test123",
        "phone": "555-0202",
        "provider": "Aetna",
    },
    {
        "name": "Michael Brown",
        "email": "michael@test.com",
        "password": "test123",
        "phone": "555-0203",
        "provider": "Cigna",
    },
    {
        "name": "Jessica Davis",
        "email": "jessica@test.com",
        "password": "test123",
        "phone": "555-0204",
        "provider": "UnitedHealthcare",
    },
    {
        "name": "David Wilson",
        "email": "david@test.com",
        "password": "test123",
        "phone": "555-0205",
        "provider": "Humana",
    },
    {
        "name": "Amanda Martinez",
        "email": "amanda@test.com",
        "password": "test123",
        "phone": "555-0206",
        "provider": "Blue Cross Blue Shield",
    },
    {
        "name": "Robert Taylor",
        "email": "robert@test.com",
        "password": "test123",
        "phone": "555-0207",
        "provider": "Aetna",
    },
    {
        "name": "Lisa Anderson",
        "email": "lisa@test.com",
        "password": "test123",
        "phone": "555-0208",
        "provider": "Cigna",
    },
    {
        "name": "James Thomas",
        "email": "james@test.com",
        "password": "test123",
        "phone": "555-0209",
        "provider": "UnitedHealthcare",
    },
    {
        "name": "Maria Garcia",
        "email": "maria@test.com",
        "password": "test123",
        "phone": "555-0210",
        "provider": "Humana",
    },
]

QUICK_PATIENTS = [
    {
        "name": "John Smith",
        "email": "john@test.com",
        "password": "test123",
        "phone": "555-0201",
        "provider": "Blue Cross Blue Shield",
    },
    {
        "name": "Emily Johnson",
        "email": "emily@test.com",
        "password": "test123",
        "phone": "555-0202",
        "provider": "Aetna",
    },
    {
        "name": "Michael Brown",
        "email": "michael@test.com",
        "password": "test123",
        "phone": "555-0203",
        "provider": "Cigna",
    },
]

POLICIES = [
    {
        "provider_name": "Blue Cross Blue Shield",
        "procedure_name": "Knee Replacement",
        "policy_text": "Prior authorization required for knee replacement surgery. Must have failed conservative treatment for 6 months. BMI must be under 40.",
        "required_documents": '["Clinical Notes", "X-Ray Report", "Physical Therapy Records"]',
        "required_conditions": '["Failed conservative treatment for 6+ months", "BMI < 40", "No active infection"]',
    },
    {
        "provider_name": "Blue Cross Blue Shield",
        "procedure_name": "MRI",
        "policy_text": "MRI requires prior authorization. Must have tried x-ray first. Clinical documentation must support medical necessity.",
        "required_documents": '["Physician Order", "Clinical Notes", "X-Ray Report"]',
        "required_conditions": '["X-ray completed within 90 days", "Medical necessity documented"]',
    },
    {
        "provider_name": "Aetna",
        "procedure_name": "CT Scan",
        "policy_text": "CT scan requires prior authorization. Contrast CT may require additional renal function tests.",
        "required_documents": '["Physician Order", "Clinical Notes", "Lab Results"]',
        "required_conditions": '["Medical necessity documented", "Renal function test within 30 days for contrast CT"]',
    },
    {
        "provider_name": "Aetna",
        "procedure_name": "Physical Therapy",
        "policy_text": "Physical therapy requires prior authorization for visits beyond 12 sessions per year.",
        "required_documents": '["Clinical Notes", "Treatment Plan"]',
        "required_conditions": '["Prescription from referring physician", "Functional improvement documented"]',
    },
    {
        "provider_name": "Cigna",
        "procedure_name": "Colonoscopy",
        "policy_text": "Screening colonoscopy covered once every 10 years for patients 45+. Diagnostic colonoscopy requires prior authorization.",
        "required_documents": '["Physician Order", "Clinical Notes", "Previous Colonoscopy Report (if applicable)"]',
        "required_conditions": '["Age 45+ for screening", "Medical necessity for diagnostic"]',
    },
    {
        "provider_name": "UnitedHealthcare",
        "procedure_name": "Hip Replacement",
        "policy_text": "Prior authorization required for hip replacement. Must have failed conservative therapy. X-rays must show joint space narrowing.",
        "required_documents": '["Clinical Notes", "X-Ray Report", "Physical Therapy Records"]',
        "required_conditions": '["Failed conservative therapy for 3+ months", "Joint space narrowing on X-ray", "No active infection"]',
    },
    {
        "provider_name": "Humana",
        "procedure_name": "Sleep Study",
        "policy_text": "Sleep study requires prior authorization. Must have Epworth Sleepiness Scale score > 10 or documented apnea symptoms.",
        "required_documents": '["Physician Order", "Clinical Notes", "Sleep Questionnaire"]',
        "required_conditions": '["Epworth score > 10 or documented symptoms", "No untreated sleep disorder"]',
    },
]


def seed_data(quick=False, skip_admin=False):
    db = SessionLocal()
    try:
        created = []

        # ==========================================
        # INSURANCE PROVIDERS
        # ==========================================
        provider_map = {}
        for p in PROVIDERS:
            existing = (
                db.query(InsuranceProvider)
                .filter(InsuranceProvider.email == p["email"])
                .first()
            )
            if existing:
                provider_map[p["provider_name"]] = existing
                continue
            obj = InsuranceProvider(
                id=str(uuid.uuid4()),
                provider_name=p["provider_name"],
                email=p["email"],
                password_hash=hash_password(p["password"]),
                phone=p["phone"],
                role="Provider",
                is_active=True,
            )
            db.add(obj)
            provider_map[p["provider_name"]] = obj
            created.append(
                f"Provider: {p['provider_name']} ({p['email']} / {p['password']})"
            )

        # ==========================================
        # POLICIES
        # ==========================================
        for pol in POLICIES:
            provider = provider_map.get(pol["provider_name"])
            if not provider:
                continue
            existing = (
                db.query(InsurancePolicy)
                .filter(
                    InsurancePolicy.insurance_provider == pol["provider_name"],
                    InsurancePolicy.procedure_name == pol["procedure_name"],
                )
                .first()
            )
            if existing:
                continue
            obj = InsurancePolicy(
                id=str(uuid.uuid4()),
                insurance_provider_id=provider.id,
                insurance_provider=pol["provider_name"],
                procedure_name=pol["procedure_name"],
                policy_text=pol["policy_text"],
                required_documents=pol["required_documents"],
                required_conditions=pol["required_conditions"],
                status="approved",
            )
            db.add(obj)
            created.append(f"Policy: {pol['provider_name']} → {pol['procedure_name']}")

        # ==========================================
        # DOCTOR
        # ==========================================
        for d in DOCTORS:
            existing_user = db.query(User).filter(User.email == d["email"]).first()
            if not existing_user:
                user_id = str(uuid.uuid4())
                user = User(
                    id=user_id,
                    email=d["email"],
                    password_hash=hash_password(d["password"]),
                    role="Doctor",
                    first_name=d["first_name"],
                    last_name=d["last_name"],
                    phone=d["phone"],
                    hospital_name=d["hospital_name"],
                    specialization=d["specialization"],
                    license_number=d["license_number"],
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                user_id_str = user_id
            else:
                user_id_str = existing_user.id

            existing_doctor = (
                db.query(Doctor).filter(Doctor.email == d["email"]).first()
            )
            if not existing_doctor:
                doctor = Doctor(
                    id=str(uuid.uuid4()),
                    doctor_name=f"{d['first_name']} {d['last_name']}",
                    email=d["email"],
                    password_hash=hash_password(d["password"]),
                    hospital_name=d["hospital_name"],
                    specialization=d["specialization"],
                    license_number=d["license_number"],
                    phone=d["phone"],
                    role="Doctor",
                    is_active=True,
                )
                db.add(doctor)
            created.append(
                f"Doctor: {d['first_name']} {d['last_name']} ({d['email']} / {d['password']})"
            )

        # ==========================================
        # PATIENTS + INSURANCE MEMBERS
        # ==========================================
        patients = QUICK_PATIENTS if quick else PATIENTS
        for p in patients:
            provider = provider_map.get(p["provider"])
            if not provider:
                continue

            existing_user = db.query(User).filter(User.email == p["email"]).first()
            if not existing_user:
                insurance_id = "ZIN-" + str(uuid.uuid4())[:8].upper()
                user = User(
                    id=str(uuid.uuid4()),
                    email=p["email"],
                    password_hash=hash_password(p["password"]),
                    role="Patient",
                    first_name=p["name"],
                    phone=p["phone"],
                    member_id=insurance_id,
                    insurance_provider_id=provider.id,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)

                member = InsuranceMember(
                    id=str(uuid.uuid4()),
                    insurance_provider_id=provider.id,
                    insurance_provider=provider.provider_name,
                    patient_name=p["name"],
                    patient_email=p["email"],
                    phone=p["phone"],
                    insurance_id=insurance_id,
                    policy_number="POL-" + str(uuid.uuid4())[:12].upper(),
                    coverage_status="Active",
                )
                db.add(member)
                created.append(
                    f"Patient: {p['name']} ({p['email']} / {p['password']}) → {p['provider']} [ID: {insurance_id}]"
                )
            else:
                created.append(f"Patient (exists): {p['name']} ({p['email']})")

        # ==========================================
        # ADMIN (if not skipped)
        # ==========================================
        if not skip_admin:
            existing_admin = db.query(User).filter(User.role == "Admin").first()
            if not existing_admin:
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
                created.append("Admin: admin@gmail.com / admin123")

        db.commit()

        print(f"\n{'=' * 60}")
        print("SEED DATA COMPLETE")
        print(f"{'=' * 60}")
        if created:
            for item in created:
                print(f"  ✓ {item}")
        else:
            print("  All records already exist (nothing new created).")
        print(f"\n{'=' * 60}")
        print("TEST CREDENTIALS")
        print(f"{'=' * 60}")
        print("  Doctor:   doctor@test.com / test123")
        print(
            "  Patients: john@test.com, emily@test.com, michael@test.com, ... / test123"
        )
        print("  Admin:    admin@gmail.com / admin123")
        print(f"{'=' * 60}\n")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database with test data")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Minimal dataset (1 provider, 1 doctor, 3 patients)",
    )
    parser.add_argument(
        "--skip-admin", action="store_true", help="Skip admin user creation"
    )
    args = parser.parse_args()
    seed_data(quick=args.quick, skip_admin=args.skip_admin)
