from fastapi import (

    APIRouter,

    UploadFile,

    File,

    Form,

    Depends
)

import uuid
import json
import os

from sqlalchemy.orm import Session

from app.database.db import SessionLocal

from app.models.policy_model import (
    InsurancePolicy
)

from app.models.provider_model import (
    InsuranceProvider
)
from app.services.file_service import (
    save_uploaded_file,
    delete_temp_file,
    POLICY_DIR
)

from app.services.encryption_service import (
    encrypt_file,
    decrypt_file
)

from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.services.extraction_service import (
    extract_text
)

from app.services.policy_extraction_service import (
    extract_policy_rules
)

from app.services.auth_middleware import verify_jwt_token
from app.services.n8n_service import notify_policy_uploaded

router = APIRouter()

# ==========================================
# UPLOAD INSURANCE POLICY
# ==========================================

@router.post("/upload-policy")

async def upload_policy(

    providerId: str = Form(...),

    insuranceProvider: str = Form(...),

    procedureName: str = Form(...),

    file: UploadFile = File(...),

    payload: dict = Depends(verify_jwt_token)
):

    db: Session = SessionLocal()

    try:

        # ==========================================
        # VERIFY PROVIDER
        # ==========================================

        provider = db.query(
            InsuranceProvider
        ).filter(

            InsuranceProvider.id
            == providerId

        ).first()

        if not provider:

            return {

                "status":
                "Failed",

                "message":
                "Invalid insurance provider"
            }

        # ==========================================
        # GENERATE POLICY ID
        # ==========================================

        policy_id = str(uuid.uuid4())

        # ==========================================
        # SAVE TEMP FILE
        # ==========================================

        file_data = save_uploaded_file(
            file,
            policy_id
        )

        full_file_path = file_data[
            "temp_path"
        ]

        print(
            "FILE PATH:",
            full_file_path
        )

        print(
            "FILE EXISTS:",
            os.path.exists(
                full_file_path
            )
        )

        # ==========================================
        # EXTRACT POLICY TEXT
        # ==========================================

        policy_text = extract_text(
            full_file_path
        )

        # ==========================================
        # VALIDATE EXTRACTION
        # ==========================================

        if not policy_text.strip():

            return {

                "status":
                "Failed",

                "message":
                "Unable to extract policy text"
            }

        # ==========================================
        # EXTRACT POLICY RULES
        # ==========================================

        policy_rules = extract_policy_rules(
            policy_text
        )

        # ==========================================
        # DUPLICATE POLICY DETECTION
        # ==========================================
        # Check whether an active policy already exists for the
        # same insurance provider + procedure.  If so, reject
        # the upload to avoid confusing duplicate records.

        procedure_lower = procedureName.lower()
        existing_policy = (
            db.query(InsurancePolicy)
            .filter(
                InsurancePolicy.insurance_provider_id == providerId,
                InsurancePolicy.procedure_name == procedure_lower,
            )
            .first()
        )

        if existing_policy:
            delete_temp_file(full_file_path)
            return {
                "status": "Failed",
                "message": (
                    f"A policy for procedure '{procedureName}' "
                    f"already exists for this provider "
                    f"(policy_id: {existing_policy.id}). "
                    f"Please delete the existing policy before "
                    f"uploading a new version."
                ),
                "existing_policy_id": existing_policy.id,
            }

        # ==========================================
        # STORE POLICY
        # ==========================================

        new_policy = InsurancePolicy(

            id=policy_id,

            insurance_provider_id=
            providerId,

            insurance_provider=
            insuranceProvider,

            procedure_name=
            procedure_lower,

            policy_text=
            policy_text,

            required_documents=
            json.dumps(

                policy_rules.get(
                    "required_documents",
                    []
                )
            ),

            required_conditions=
            json.dumps(

                policy_rules.get(
                    "required_conditions",
                    []
                )
            )
        )

        db.add(new_policy)

        db.commit()

        # ==========================================
        # PERSIST SOURCE PDF (ENCRYPTED AT REST)
        # ==========================================
        # The only artifact that outlives the request lifecycle is
        # the policy source document. Store it Fernet-encrypted under
        # uploads/policies and record the path for later download.

        try:

            os.makedirs(
                POLICY_DIR,
                exist_ok=True
            )

            encrypted_path = encrypt_file(
                full_file_path,
                os.path.join(
                    POLICY_DIR,
                    f"{policy_id}.bin"
                )
            )

            new_policy.policy_file_path = encrypted_path

            db.commit()

        except Exception as encrypt_error:

            # Policy text is already persisted in the DB; failure to
            # archive the source file must not fail the upload.
            print(
                "POLICY ARCHIVE ERROR:",
                str(encrypt_error)
            )

        # ==========================================
        # DELETE TEMP FILE
        # ==========================================

        delete_temp_file(
            full_file_path
        )

        # ==========================================
        # DISPATCH POLICY UPLOADED EVENT (fire-and-forget)
        # ==========================================
        notify_policy_uploaded(
            policy_id=policy_id,
            provider_id=providerId,
            insurance_provider=insuranceProvider,
            procedure_name=procedureName,
            required_documents=policy_rules.get("required_documents", []),
            required_conditions=policy_rules.get("required_conditions", []),
        )

        # ==========================================
        # SUCCESS RESPONSE
        # ==========================================

        return {

            "status":
            "Success",

            "message":
            "Insurance policy uploaded successfully",

            "policy_id":
            policy_id,

            "provider_id":
            providerId,

            "insurance_provider":
            insuranceProvider,

            "procedure_name":
            procedureName,

            "extracted_rules":
            policy_rules
        }

    except Exception as e:

        return {

            "status":
            "Failed",

            "message":
            str(e)
        }

    finally:

        db.close()

# ==========================================
# DOWNLOAD ORIGINAL POLICY PDF
# (decrypted on the fly - file is stored
#  Fernet-encrypted at rest)
# ==========================================

@router.get("/policy-file/{policy_id}")
def download_policy_file(
    policy_id: str,
    payload: dict = Depends(verify_jwt_token)
):

    db: Session = SessionLocal()

    temp_decrypted_path = None

    try:

        policy = db.query(
            InsurancePolicy
        ).filter(
            InsurancePolicy.id == policy_id
        ).first()

        if not policy or not policy.policy_file_path:

            return {
                "status": "Failed",
                "message": "Policy file not found"
            }

        if not os.path.exists(policy.policy_file_path):

            return {
                "status": "Failed",
                "message": "Policy archive missing on disk"
            }

        base_name = (
            os.path.splitext(
                os.path.basename(policy.policy_file_path)
            )[0]
        )

        safe_name = f"{base_name}_{policy.procedure_name}.pdf".replace(" ", "_")

        temp_decrypted_path = os.path.join(
            POLICY_DIR,
            f"tmp_{base_name}.pdf"
        )

        decrypt_file(
            policy.policy_file_path,
            temp_decrypted_path
        )

        return FileResponse(
            path=temp_decrypted_path,
            filename=safe_name,
            media_type="application/pdf",
            background=BackgroundTask(
                delete_temp_file,
                temp_decrypted_path
            )
        )

    finally:

        db.close()


# ==========================================
# GET PROVIDER POLICIES
# ==========================================

@router.get("/provider-policies/{provider_id}")

def get_provider_policies(

    provider_id: str
):

    db: Session = SessionLocal()

    try:

        policies = db.query(
            InsurancePolicy
        ).filter(

            InsurancePolicy.insurance_provider_id
            == provider_id

        ).all()

        result = []

        for policy in policies:

            result.append({

                "policy_id":
                policy.id,

                "procedure_name":
                policy.procedure_name,

                "insurance_provider":
                policy.insurance_provider
            })

        return {

            "status":
            "Success",

            "policies":
            result
        }

    except Exception as e:

        return {

            "status":
            "Failed",

            "message":
            str(e)
        }

    finally:

        db.close()

# ==========================================
# DELETE POLICY
# ==========================================

@router.delete("/delete-policy/{policy_id}")

def delete_policy(

    policy_id: str
):

    db: Session = SessionLocal()

    try:

        policy = db.query(
            InsurancePolicy
        ).filter(

            InsurancePolicy.id
            == policy_id

        ).first()

        if not policy:

            return {

                "status":
                "Failed",

                "message":
                "Policy not found"
            }

        db.delete(policy)

        db.commit()

        return {

            "status":
            "Success",

            "message":
            "Policy deleted successfully"
        }

    except Exception as e:

        return {

            "status":
            "Failed",

            "message":
            str(e)
        }

    finally:

        db.close()