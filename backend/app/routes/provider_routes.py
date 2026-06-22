from fastapi import APIRouter

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.db import SessionLocal

from app.models.provider_model import InsuranceProvider

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)

import uuid

from datetime import datetime


router = APIRouter()

# ==========================================
# REQUEST MODELS
# ==========================================


class ProviderSignupRequest(BaseModel):
    provider_name: str

    email: str

    password: str


class ProviderLoginRequest(BaseModel):
    email: str

    password: str


# ==========================================
# PROVIDER SIGNUP
# ==========================================


@router.post("/provider-register")
def provider_signup(request: ProviderSignupRequest):

    db: Session = SessionLocal()

    try:
        # ==========================================
        # CHECK EXISTING EMAIL
        # ==========================================

        existing_provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == request.email)
            .first()
        )

        if existing_provider:
            return {"status": "Failed", "message": "Provider already exists"}

        # ==========================================
        # HASH PASSWORD
        # ==========================================

        hashed_password = hash_password(request.password)

        # ==========================================
        # CREATE NEW PROVIDER
        # ==========================================

        new_provider = InsuranceProvider(
            id=str(uuid.uuid4()),
            provider_name=request.provider_name,
            email=request.email,
            password_hash=hashed_password,
            created_at=datetime.utcnow(),
        )

        db.add(new_provider)

        db.commit()

        db.refresh(new_provider)

        return {
            "status": "Success",
            "message": "Insurance provider registered successfully",
            "provider_id": new_provider.id,
            "provider_name": new_provider.provider_name,
        }

    except Exception as error:
        print("Provider Registration Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()


# ==========================================
# PROVIDER LOGIN
# ==========================================


@router.post("/provider-login")
def provider_login(request: ProviderLoginRequest):

    db: Session = SessionLocal()

    try:
        # ==========================================
        # FIND PROVIDER
        # ==========================================

        provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == request.email)
            .first()
        )

        # ==========================================
        # PROVIDER NOT FOUND
        # ==========================================

        if not provider:
            return {"status": "Failed", "message": "Provider account not found"}

        # ==========================================
        # VERIFY PASSWORD
        # ==========================================

        password_valid = verify_password(request.password, provider.password_hash)

        if not password_valid:
            return {"status": "Failed", "message": "Invalid password"}

        # ==========================================
        # CREATE JWT TOKEN
        # ==========================================

        access_token = create_access_token(
            {
                "provider_id": provider.id,
                "provider_name": provider.provider_name,
                "email": provider.email,
                "role": "provider",
            }
        )

        # ==========================================
        # LOGIN SUCCESS
        # ==========================================

        return {
            "status": "Success",
            "message": "Login successful",
            "access_token": access_token,
            "provider_id": provider.id,
            "provider_name": provider.provider_name,
        }

    except Exception as error:
        print("Provider Login Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()


# ==========================================
# GET ALL PROVIDERS
# ==========================================


@router.get("/providers")
def get_providers():

    db: Session = SessionLocal()

    try:
        providers = db.query(InsuranceProvider).all()

        result = []

        for provider in providers:
            result.append(
                {
                    "id": provider.id,
                    "provider_name": provider.provider_name,
                    "email": provider.email,
                }
            )

        return {"status": "Success", "providers": result}

    except Exception as error:
        print("Get Providers Error:", error)

        return {"status": "Failed", "message": str(error)}

    finally:
        db.close()
