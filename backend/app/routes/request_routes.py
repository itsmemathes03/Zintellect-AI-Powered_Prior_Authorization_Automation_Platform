from fastapi import APIRouter, UploadFile, File, Form, Depends, BackgroundTasks
from typing import Annotated, List

from pydantic import WithJsonSchema

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

from app.services.ai_service import extract_medical_entities, normalize_entities

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

from app.services.cleanup_service import cleanup_request_files
from app.services.n8n_service import notify_n8n

router = APIRouter()

# ==========================================
# SWAGGER UI FILE UPLOAD TYPE
# ==========================================
# FastAPI 0.115+ generates `contentMediaType: application/octet-stream`
# (OpenAPI 3.1 style) for UploadFile fields in request bodies, which
# Swagger UI renders as `array<string>` with no file chooser. Overriding
# the JSON schema to the legacy `format: binary` restores the proper
# multi-file picker in Swagger UI.
# Runtime behaviour is unchanged -- the underlying type is still UploadFile.

SwaggerUploadFile = Annotated[
    UploadFile,
    WithJsonSchema({"type": "string", "format": "binary"}),
]

# ==========================================
# ALLOWED FILE TYPES
# ==========================================

ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".tiff",
    ".tif",
    ".webp"
]

# ==========================================
# MAX FILE SIZE = 5 MB
# ==========================================

MAX_FILE_SIZE = 5 * 1024 * 1024


# ==========================================
# SUBMIT PRIOR AUTH REQUEST
# ==========================================


@router.post("/submit-request")
async def submit_request(
    background_tasks: BackgroundTasks,
    token_data: dict = Depends(verify_jwt_token),
    patientName: str = Form(...),
    patientId: str = Form(...),
    diagnosis: str = Form(...),
    procedureCode: str = Form(...),
    doctorName: str = Form(""),
    insuranceProvider: str = Form(...),
    insuranceId: str = Form(...),
    files: List[SwaggerUploadFile] = File(...),
):

    start_time = time.time()
    _timing = {}  # collects per-stage elapsed seconds
    _timing["00_total_start"] = start_time

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
        MAX_FILES = 10

        if len(files) > MAX_FILES:
            return {
                "status": "Rejected",
                "message": f"Maximum {MAX_FILES} files are allowed."
            }

        _timing["01_files_loop_start"] = time.time()
        _file_index = 0

        for file in files:
            _file_index += 1
            _file_start = time.time()
            print(f"\nProcessing File #{_file_index}: {file.filename}")

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

            _ocr_start = time.time()
            raw_text = extract_text(full_file_path)
            _ocr_elapsed = round(time.time() - _ocr_start, 1)
            if len(raw_text.strip()) < 20:
                return {
                    "request_id": request_id,
                    "status": "Rejected",
                    "message": "Unable to extract sufficient text from the document."
                }
            raw_text = raw_text[:4000]
            print(f"  [DIAG] OCR: {_ocr_elapsed}s | chars={len(raw_text)} | preview={raw_text[:80].replace(chr(10),' ')}")

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

            _cls_start = time.time()
            document_type = classify_document(raw_text)
            _cls_elapsed = round(time.time() - _cls_start, 1)

            print("Detected Document Type:", document_type)
            print(f"  [DIAG] classify: {_cls_elapsed}s")

            # Prevent duplicate document types (e.g. two lab reports)
            # from being recorded more than once.
            if document_type not in uploaded_document_types:
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
            _file_elapsed = round(time.time() - _file_start, 1)
            print(f"  [DIAG] File #{_file_index} total: {_file_elapsed}s")

        _timing["02_files_loop_end"] = time.time()
        _timing["03_combined_chars"] = len(combined_text)

        print("\n===================================")
        print("COMBINED CLINICAL TEXT")
        print("===================================")

        print(combined_text[:2000])
        print(f"\n  [DIAG] Combined text: {len(combined_text)} chars from {_file_index} files")

        # ==========================================
        # PHI MASKING
        # ==========================================

        new_request.processing_stage = "Running PHI masking"

        db.commit()

        _phi_start = time.time()
        clean_text = deidentify_text(combined_text)
        _phi_elapsed = round(time.time() - _phi_start, 1)
        clean_text = clean_text[:8000]
        print(f"  [DIAG] PHI masking: {_phi_elapsed}s | before={len(combined_text)} -> after={len(clean_text)} chars")

        update_stage(request_id, "PHI Masking Completed", "completed")

        # ==========================================
        # AI EXTRACTION
        # ==========================================

        new_request.processing_stage = "Running healthcare AI extraction"

        db.commit()

        from app.services.ai_service import MODEL_NAME as _AI_MODEL, OLLAMA_TIMEOUT as _AI_TIMEOUT, OLLAMA_HOST as _AI_HOST
        print(f"\n  [DIAG] AI config: model={_AI_MODEL} timeout={_AI_TIMEOUT}s host={_AI_HOST}")
        print(f"  [DIAG] clean_text length: {len(clean_text)} chars")

        _ai_start = time.time()

        try:
            ai_output = extract_medical_entities(clean_text)

            _ai_elapsed = round(time.time() - _ai_start, 1)
            print(f"  [DIAG] extract_medical_entities returned in {_ai_elapsed}s")

            print("\n===================================")
            print("RAW AI OUTPUT")
            print("===================================")

            print(ai_output)

            _json_start = time.time()
            ai_output = ai_output.replace("```json", "").replace("```", "").strip()
            entities = json.loads(ai_output)
            _json_elapsed = round(time.time() - _json_start, 1)
            print(f"  [DIAG] JSON parse: {_json_elapsed}s")

        except Exception as e:
            _ai_elapsed = round(time.time() - _ai_start, 1)
            print(f"  [DIAG] extract_medical_entities EXCEPTION after {_ai_elapsed}s")
            print(f"  [DIAG] EXCEPTION TYPE: {type(e).__name__}")
            print(f"  [DIAG] EXCEPTION MODULE: {type(e).__module__}")
            print(f"  [DIAG] AI Extraction Error: {repr(e)}")

            entities = normalize_entities({})
            entities["error"] = str(e)

        print("\n===================================")
        print("EXTRACTED ENTITIES")
        print("===================================")

        print(json.dumps(entities, indent=2))

        # ==========================================
        # SAFETY CHECK
        # ==========================================

        diagnosis_value = str(entities.get("diagnosis", "")).strip()
        procedure_value = str(entities.get("procedure_requested", "")).strip()
        print(f"  [DIAG] Safety check: diagnosis='{diagnosis_value[:60]}' procedure='{procedure_value[:60]}'")

        if diagnosis_value == "" and procedure_value == "":
            print(f"  [DIAG] *** SAFETY CHECK FAILED — returning Manual Review ***")

            new_request.status = "Manual Review"
            new_request.confidence_score = 0.40
            new_request.processing_stage = "Safety check failed"
            db.commit()

            print(f"  [DIAG] Total time: {round(time.time() - start_time, 1)}s")
            return {
                "request_id": request_id,
                "status": "Manual Review",
                "confidence_score": 0.40,
                "uploaded_files": uploaded_files,
                "uploaded_document_types": uploaded_document_types,
                "processing_time_seconds": round(time.time() - start_time, 2),
                "message": "Critical clinical information could not be reliably extracted.",
            }
        print(f"  [DIAG] Safety check PASSED")

        # ==========================================
        # LOAD POLICY FROM DATABASE
        # ==========================================

        new_request.processing_stage = "Loading insurance policy"

        db.commit()

        procedure_name = entities.get("procedure_requested", "").strip()

        if not procedure_name:
            procedure_name = procedureCode

        print(
            f"\nInsurance Provider: {insuranceProvider}"
        )

        _policy_start = time.time()
        policy_rules = load_policy(procedure_name, insurance_provider=insuranceProvider)
        _policy_elapsed = round(time.time() - _policy_start, 1)
        print(f"  [DIAG] Policy load: {_policy_elapsed}s | procedure='{procedure_name}' provider='{insuranceProvider}'")
        print(f"  [DIAG] Matched policy: {policy_rules.get('procedure','?')} score={policy_rules.get('match_score','?')}")

        # ==========================================
        # NO POLICY FOR PROVIDER → EARLY EXIT
        # ==========================================

        if policy_rules.get("no_provider_policy"):

            new_request.status = "No Policy Available"
            new_request.processing_stage = "No policy configured"
            db.commit()

            print(
                f"\nNo insurance policy found for provider: {insuranceProvider}. "
                f"Skipping policy evaluation."
            )

            provider_id = token_data.get(
                "provider_id", token_data.get("sub", token_data.get("email", "System"))
            )

            create_audit_log(
                request_id=request_id,
                action="No Policy Available",
                performed_by=provider_id,
            )

            return {
                "request_id": request_id,
                "status": "No Policy Available",
                "confidence_score": 0.0,
                "uploaded_files": uploaded_files,
                "uploaded_document_types": uploaded_document_types,
                "extracted_entities": entities,
                "policy_rules": policy_rules,
                "missing_requirements": [],
                "processing_time_seconds": round(time.time() - start_time, 2),
                "message": (
                    f"No insurance policy is configured for provider '{insuranceProvider}'. "
                    f"Policy evaluation could not be performed."
                ),
            }

        print("\n===================================")
        print("MATCHED POLICY")
        print("===================================")

        # policy_text contains Unicode characters (e.g. "≤", "≥") that the
        # Windows console (cp1252) cannot print; ensure_ascii keeps this
        # debug print encoding-safe so a matched policy cannot crash the
        # request after matching succeeds.
        print(json.dumps(policy_rules, indent=2, ensure_ascii=True))

        # ==========================================
        # POLICY MATCHING
        # ==========================================

        new_request.processing_stage = "Matching payer requirements"

        db.commit()

        entities["full_clinical_text"] = combined_text[:8000]

        _match_start = time.time()
        policy_result = match_policy_requirements(
            entities, uploaded_document_types, policy_rules
        )
        _match_elapsed = round(time.time() - _match_start, 1)
        print(f"  [DIAG] Policy match: {_match_elapsed}s | decision={policy_result.get('decision','?')} confidence={policy_result.get('confidence_score','?')}")
        print(f"  [DIAG] Required docs: {policy_rules.get('required_documents',[])}")
        print(f"  [DIAG] Uploaded docs: {uploaded_document_types}")
        print(f"  [DIAG] Required conditions: {policy_rules.get('required_conditions',[])}")
        print(f"  [DIAG] Matched conditions: {policy_result.get('matched_conditions',[])}")
        print(f"  [DIAG] Missing: {policy_result.get('missing_requirements',[])}")

        print("\n===================================")
        print("POLICY MATCH RESULT")
        print("===================================")

        # Same encoding safety as the policy_rules print above: the RAG
        # policy_context / retrieved_chunks contain raw policy text.
        print(json.dumps(policy_result, indent=2, ensure_ascii=True, default=str))

        decision = policy_result["decision"]

        missing_items = policy_result["missing_requirements"]

        confidence_score = policy_result.get("confidence_score", 0)

        # ==========================================
        # FINAL DB UPDATE
        # ==========================================
        # HCI-03: AI recommendation is preserved but NOT treated as the
        # final authorization decision.  The request enters "Awaiting
        # Review" so a human provider/reviewer must approve, reject, or
        # request additional information.
        # The AI recommendation is stored in new fields so it survives
        # the human decision (the human decision does NOT overwrite it).

        new_request.ai_recommendation = decision
        new_request.status = "Awaiting Review"
        new_request.confidence_score = confidence_score

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
            action=f"AI Recommendation: {decision}",
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

        print(f"\n  [DIAG] ========== TIMING SUMMARY ==========")
        print(f"  [DIAG] Total request time: {total_time}s")
        print(f"  [DIAG] AI extraction:     {_ai_elapsed}s")
        print(f"  [DIAG] Policy load:       {_policy_elapsed}s")
        print(f"  [DIAG] Policy match:      {_match_elapsed}s")
        print(f"  [DIAG] ====================================\n")

        # ==========================================
        # DISPATCH TO N8N (fire-and-forget)
        # ==========================================
        # HCI-03: Do NOT send the existing n8n prior_authorization_decision
        # event when the AI recommendation is first generated.  That would
        # trigger an Approved/Rejected email BEFORE human review.
        # n8n receives the final human decision only (from review_routes).
        # The existing n8n workflow and nodes are unchanged.

        _n8n_provider_id = token_data.get(
            "provider_id", token_data.get("sub", "")
        )
        _n8n_provider_name = token_data.get(
            "name", ""
        )

        # No notify_n8n dispatch here — wait for human decision.

        # ==========================================
        # FINAL RESPONSE
        # ==========================================

        return {
            "request_id": request_id,
            "status": "Awaiting Review",
            "ai_recommendation": decision,
            "confidence_score": confidence_score,
            "uploaded_files": uploaded_files,
            "uploaded_document_types": uploaded_document_types,
            "extracted_entities": entities,
            "policy_rules": policy_rules,
            "matched_conditions": policy_result.get("matched_conditions", []),
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
def get_all_requests(payload: dict = Depends(verify_jwt_token)):
    db: Session = SessionLocal()
    try:
        requests = db.query(PriorAuthRequest).all()
        result = []
        for request in requests:
            result.append({
                "request_id": request.id,
                "patient_name": request.patient_name,
                "insurance_provider": request.insurance_provider,
                "status": request.status,
                "procedure_code": request.procedure_code,
            })
        return {"status": "Success", "requests": result}
    finally:
        db.close()
