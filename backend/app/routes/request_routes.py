from fastapi import APIRouter, UploadFile, File, Form, Depends
from typing import List
import uuid
import json
import os
import time

from sqlalchemy.orm import Session

from app.database.db import SessionLocal

from app.models.request_model import PriorAuthRequest

from app.models.member_model import InsuranceMember

from app.services.file_service import save_uploaded_file, delete_temp_file

from app.services.extraction_service import extract_text

from app.services.phi_service import deidentify_text

from app.services.document_classifier import classify_document

from app.services.ai_service import extract_medical_entities

from app.services.rag.chunking_service import create_chunks

from app.services.embeddings.embedding_service import generate_embeddings

from app.services.retrieval.vector_db_service import store_medical_embeddings


from app.services.explanation_service import (
    generate_provider_explanation,
    generate_patient_explanation,
    generate_xai_reasoning,
    generate_explanation,
)

from app.services.audit_service import create_audit_log

from app.services.notification_service import create_notification

from app.services.stage_service import create_stage, update_stage


from app.services.policy_loader import load_policy

from app.services.policy_matcher import match_policy_requirements

from app.services.auth_middleware import verify_jwt_token

router = APIRouter()

# ==========================================
# ALLOWED FILE TYPES
# ==========================================

ALLOWED_EXTENSIONS = [".pdf", ".txt"]

# ==========================================
# MAX FILE SIZE = 5 MB
# ==========================================

MAX_FILE_SIZE = 5 * 1024 * 1024


# ==========================================
# SUBMIT PRIOR AUTH REQUEST
# ==========================================


@router.post("/submit-request")
async def submit_request(
    token_data: dict = Depends(verify_jwt_token),
    patientName: str = Form(...),
    patientId: str = Form(...),
    diagnosis: str = Form(...),
    procedureCode: str = Form(...),
    doctorName: str = Form(...),
    insuranceProvider: str = Form(...),
    insuranceId: str = Form(...),
    files: List[UploadFile] = File(...),
):

    start_time = time.time()

    db: Session = SessionLocal()

    temp_paths = []
    uploaded_files = []
    uploaded_document_types = []

    import traceback

    try:
        request_id = str(uuid.uuid4())

        create_stage(request_id, "Request Created", "completed")

        print("\n===================================")
        print("NEW PRIOR AUTH REQUEST")
        print("===================================")

        print("Authenticated Provider:", token_data)

        # ==========================================
        # VERIFY INSURANCE MEMBERSHIP
        # ==========================================

        member = (
            db.query(InsuranceMember)
            .filter(
                InsuranceMember.insurance_provider == insuranceProvider,
                InsuranceMember.insurance_id == insuranceId,
                InsuranceMember.patient_name == patientName,
            )
            .first()
        )

        if not member:
            return {
                "request_id": request_id,
                "status": "Rejected",
                "message": "Insurance verification failed",
            }

        # ==========================================
        # CREATE REQUEST ENTRY
        # ==========================================

        new_request = PriorAuthRequest(
            id=request_id,
            patient_name=patientName,
            patient_id=patientId,
            diagnosis=diagnosis,
            procedure_code=procedureCode,
            doctor_name=doctorName,
            insurance_provider=insuranceProvider,
            uploaded_files="",
            status="Processing",
            processing_stage="Uploading files",
        )

        db.add(new_request)

        db.commit()

        combined_text = ""

        entities = {}

        missing_items = []

        explanation = ""

        confidence_score = 0.0

        # ==========================================
        # PROCESS FILES
        # ==========================================

        for file in files:
            print(f"\nProcessing File: {file.filename}")

            file_extension = os.path.splitext(file.filename)[1].lower()

            # ==========================================
            # FILE TYPE VALIDATION
            # ==========================================
            if file_extension not in ALLOWED_EXTENSIONS:
                for path in temp_paths:
                    delete_temp_file(path)

                return {
                    "request_id": request_id,
                    "status": "Rejected",
                    "message": f"Unsupported file type: {file_extension}",
                }

            # ==========================================
            # FILE SIZE VALIDATION
            # ==========================================

            file.file.seek(0, 2)

            file_size = file.file.tell()

            file.file.seek(0)

            if file_size > MAX_FILE_SIZE:
                for path in temp_paths:
                    delete_temp_file(path)

                return {
                    "request_id": request_id,
                    "status": "Rejected",
                    "message": "File exceeds 5 MB limit",
                }

            # ==========================================
            # SAVE FILE
            # ==========================================
            file_data = save_uploaded_file(file, request_id)

            full_file_path = file_data["temp_path"]

            temp_paths.append(full_file_path)

            uploaded_files.append(file.filename)

            new_request.uploaded_files = json.dumps(uploaded_files)

            print("FILE EXISTS:", os.path.exists(full_file_path))

            db.commit()

            update_stage(request_id, "OCR Completed", "completed")

            # ==========================================
            # EXTRACT TEXT
            # ==========================================

            new_request.processing_stage = "Extracting document text"

            db.commit()

            raw_text = extract_text(full_file_path)
            raw_text = raw_text[:2500]

            if not raw_text.strip():
                for path in temp_paths:
                    delete_temp_file(path)

                return {
                    "request_id": request_id,
                    "status": "Rejected",
                    "message": "Uploaded document contains no readable text.",
                }

            print("\n=== EXTRACTED TEXT SAMPLE ===")
            print(raw_text[:500])

            # ==========================================
            # DOCUMENT CLASSIFICATION
            # ==========================================

            new_request.processing_stage = "Classifying documents"

            db.commit()

            document_type = classify_document(raw_text)

            print("Detected Document Type:", document_type)

            uploaded_document_types.append(document_type)

            # ==========================================
            # REJECT NON MEDICAL FILES
            # ==========================================

            if document_type == "non_medical":
                for path in temp_paths:
                    delete_temp_file(path)

                return {
                    "request_id": request_id,
                    "status": "Rejected",
                    "uploaded_document_types": uploaded_document_types,
                    "message": "Uploaded document is not a valid healthcare document.",
                }

            # ==========================================
            # COMBINE ALL CLINICAL TEXT
            # ==========================================

            combined_text += "\n" + raw_text

        print("\n===================================")
        print("COMBINED CLINICAL TEXT")
        print("===================================")

        print(combined_text[:2000])

        # ==========================================
        # PHI MASKING
        # ==========================================

        new_request.processing_stage = "Running PHI masking"

        db.commit()

        clean_text = deidentify_text(combined_text)
        clean_text = clean_text[:2500]

        update_stage(request_id, "PHI Masking Completed", "completed")

        # ==========================================
        # AI EXTRACTION
        # ==========================================

        new_request.processing_stage = "Running healthcare AI extraction"

        db.commit()

        try:
            ai_output = extract_medical_entities(clean_text)

            print("\n===================================")
            print("RAW AI OUTPUT")
            print("===================================")

            print(ai_output)

            ai_output = ai_output.replace("```json", "").replace("```", "").strip()

            entities = json.loads(ai_output)

            # chunks = create_chunks(

            #     text=clean_text,

            #     request_id=request_id,

            #     document_type="clinical_notes"
            # )

            # update_stage(

            #     request_id,

            #     "Chunking Completed",

            #     "completed"
            # )

            # embedded_chunks = generate_embeddings(

            #     chunks,

            #     model_type="medical"
            # )

            # store_medical_embeddings(
            #     embedded_chunks
            # )

            # update_stage(

            #     request_id,

            #     "Embeddings Generated",

            #     "completed"
            # )

        except Exception as e:
            print("AI Extraction Error:", str(e))

            entities = {
                "diagnosis": "",
                "symptoms": [],
                "medications": [],
                "treatment_history": {},
                "procedure_requested": "",
                "error": str(e),
            }

        print("\n===================================")
        print("EXTRACTED ENTITIES")
        print("===================================")

        print(json.dumps(entities, indent=2))

        # ==========================================
        # SAFETY CHECK
        # ==========================================

        diagnosis_value = str(entities.get("diagnosis", "")).strip()

        procedure_value = str(entities.get("procedure_requested", "")).strip()

        if diagnosis_value == "" and procedure_value == "":
            return {
                "request_id": request_id,
                "status": "Manual Review",
                "confidence_score": 0.40,
                "uploaded_files": uploaded_files,
                "uploaded_document_types": uploaded_document_types,
                "processing_time_seconds": round(time.time() - start_time, 2),
                "message": "Critical clinical information could not be reliably extracted.",
            }

        # ==========================================
        # LOAD POLICY FROM DATABASE
        # ==========================================

        new_request.processing_stage = "Loading insurance policy"

        db.commit()

        procedure_name = entities.get("procedure_requested", "").strip()

        if not procedure_name:
            procedure_name = procedureCode

        policy_rules = load_policy(procedure_name)

        print("\n===================================")
        print("MATCHED POLICY")
        print("===================================")

        print(policy_rules)

        # ==========================================
        # POLICY MATCHING
        # ==========================================

        new_request.processing_stage = "Matching payer requirements"

        db.commit()

        entities["full_clinical_text"] = combined_text[:2500]

        policy_result = match_policy_requirements(
            entities, uploaded_document_types, policy_rules
        )

        print("\n===================================")
        print("POLICY MATCH RESULT")
        print("===================================")

        print(policy_result)

        decision = policy_result["decision"]

        missing_items = policy_result["missing_requirements"]

        confidence_score = policy_result.get("confidence_score", 0)

        # ==========================================
        # FINAL DB UPDATE
        # ==========================================

        new_request.status = decision

        provider_id = token_data.get("provider_id", token_data.get("sub", "unknown"))

        create_notification(
            user_id=provider_id,
            role="provider",
            notification_type="prior_authorization",
            message=f"Request {request_id} processed successfully.",
            request_id=request_id,
        )

        provider_id = token_data.get(
            "provider_id", token_data.get("sub", token_data.get("email", "System"))
        )

        create_audit_log(
            request_id=request_id,
            action=f"Decision: {decision}",
            performed_by=provider_id,
        )

        # ==========================================
        # DOCUMENT SIMILARITY CHECK
        # ==========================================

        try:
            from app.services.document_similarity_service import (
                analyze_document_similarity,
            )

            if temp_paths:
                sim_result = analyze_document_similarity(
                    temp_paths,
                    exclude_request_id=request_id,
                    threshold=0.7,
                )
                new_request.similarity_score = sim_result["max_similarity"]
                if sim_result["has_duplicates"] and sim_result["matches"]:
                    top_match = sim_result["matches"][0]
                    new_request.duplicate_request_id = top_match["request_id"]
                    new_request.duplicate_flag = (
                        "suspected_duplicate"
                        if sim_result["is_suspected_duplicate"]
                        else "similar"
                    )
        except Exception as sim_err:
            print("Similarity Check Warning:", sim_err)

        new_request.processing_stage = "Completed"

        db.commit()

        # ==========================================
        # DELETE TEMP FILES
        # ==========================================

        total_time = round(time.time() - start_time, 2)

        # ==========================================
        # FINAL RESPONSE
        # ==========================================

        return {
            "request_id": request_id,
            "status": decision,
            "confidence_score": confidence_score,
            "uploaded_files": uploaded_files,
            "uploaded_document_types": uploaded_document_types,
            "extracted_entities": entities,
            "policy_rules": policy_rules,
            "missing_requirements": missing_items,
            "processing_time_seconds": total_time,
            "provider_explanation": policy_result.get("provider_explanation", ""),
            "patient_explanation": policy_result.get("patient_explanation", ""),
            "xai_reasoning": policy_result.get("xai_reasoning", ""),
            "policy_context": policy_result.get("policy_context", ""),
            "retrieved_chunks": policy_result.get("retrieved_chunks", []),
        }

    except Exception as e:
        tb = traceback.format_exc()
        print("\n===================================")
        print("SUBMIT REQUEST ERROR")
        print("===================================")
        print(tb)
        return {
            "request_id": request_id,
            "status": "Error",
            "message": f"Processing error: {str(e)}",
        }

    finally:
        for path in temp_paths:
            delete_temp_file(path)

        db.close()


# ==========================================
# LIVE REQUEST STATUS
# ==========================================


@router.get("/request-status/{request_id}")
def get_request_status(request_id: str):

    db: Session = SessionLocal()

    try:
        request = (
            db.query(PriorAuthRequest).filter(PriorAuthRequest.id == request_id).first()
        )

        if not request:
            return {"message": "Request not found"}

        return {
            "request_id": request.id,
            "status": request.status,
            "processing_stage": request.processing_stage,
        }

    finally:
        db.close()


# ==========================================
# GET ALL REQUESTS
# ==========================================


@router.get("/all-requests")
def get_all_requests():

    db: Session = SessionLocal()

    try:
        requests = db.query(PriorAuthRequest).all()

        result = []

        for request in requests:
            result.append(
                {
                    "request_id": request.id,
                    "patient_name": request.patient_name,
                    "insurance_provider": request.insurance_provider,
                    "status": request.status,
                    "procedure_code": request.procedure_code,
                }
            )

        return {"status": "Success", "requests": result}

    finally:
        db.close()
