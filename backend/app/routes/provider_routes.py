from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.db import SessionLocal

from app.models.user_model import User
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
        # CHECK BOTH TABLES FOR EXISTING EMAIL
        # ==========================================

        existing_user = db.query(User).filter(User.email == request.email).first()

        existing_provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == request.email)
            .first()
        )

        if existing_user or existing_provider:
            raise HTTPException(
                status_code=409,
                detail="A provider account with this email already exists.",
            )

        # ==========================================
        # HASH PASSWORD
        # ==========================================

        hashed_password = hash_password(request.password)

        # ==========================================
        # CREATE NEW PROVIDER (atomic: shared ID)
        # ==========================================

        shared_id = str(uuid.uuid4())

        user = User(
            id=shared_id,
            email=request.email,
            password_hash=hashed_password,
            role="Provider",
            first_name=request.provider_name,
            provider_name=request.provider_name,
            is_active=True,
            is_verified=True,
        )
        db.add(user)

        new_provider = InsuranceProvider(
            id=shared_id,
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
            "provider_id": shared_id,
            "provider_name": new_provider.provider_name,
        }

    except HTTPException:
        raise
    except Exception as error:
        db.rollback()
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
        # FIND PROVIDER (prefer User table for auth)
        # ==========================================

        user = (
            db.query(User)
            .filter(
                User.email == request.email,
                User.role == "Provider",
                User.is_active == True,
            )
            .first()
        )

        if user:
            password_valid = verify_password(request.password, user.password_hash)
            if not password_valid:
                return {"status": "Failed", "message": "Invalid password"}

            user.last_login = datetime.utcnow()
            db.commit()

            access_token = create_access_token(
                {
                    "sub": user.id,
                    "email": user.email,
                    "role": "provider",
                    "name": user.provider_name or user.first_name or "Provider",
                }
            )

            return {
                "status": "Success",
                "message": "Login successful",
                "access_token": access_token,
                "provider_id": user.id,
                "provider_name": user.provider_name or user.first_name or "Provider",
            }

        # ==========================================
        # FALLBACK: InsuranceProvider (legacy records)
        # ==========================================

        provider = (
            db.query(InsuranceProvider)
            .filter(InsuranceProvider.email == request.email)
            .first()
        )

        if not provider:
            return {"status": "Failed", "message": "Provider account not found"}

        password_valid = verify_password(request.password, provider.password_hash)
        if not password_valid:
            return {"status": "Failed", "message": "Invalid password"}

        access_token = create_access_token(
            {
                "sub": provider.id,
                "email": provider.email,
                "role": "provider",
                "name": provider.provider_name or "Provider",
            }
        )

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

        # Deduplicate by provider_name, keeping the first (oldest) record per name
        seen_names = set()
        result = []

        for provider in providers:
            name = provider.provider_name
            if name in seen_names:
                continue
            seen_names.add(name)
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
