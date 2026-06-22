from fastapi import (

    APIRouter,

    UploadFile,

    File,

    Form
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
    save_uploaded_file
)

from app.services.extraction_service import (
    extract_text
)

from app.services.policy_extraction_service import (
    extract_policy_rules
)

from app.services.file_service import (
    save_uploaded_file,
    delete_temp_file
)

router = APIRouter()

# ==========================================
# UPLOAD INSURANCE POLICY
# ==========================================

@router.post("/upload-policy")

async def upload_policy(

    providerId: str = Form(...),

    insuranceProvider: str = Form(...),

    procedureName: str = Form(...),

    file: UploadFile = File(...)
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
        # STORE POLICY
        # ==========================================

        new_policy = InsurancePolicy(

            id=policy_id,

            insurance_provider_id=
            providerId,

            insurance_provider=
            insuranceProvider,

            procedure_name=
            procedureName.lower(),

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
        # DELETE TEMP FILE
        # ==========================================

        delete_temp_file(
            full_file_path
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