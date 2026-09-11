import ollama
import json
import re
import os

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# =====================================================
# OLLAMA CONFIGURATION (environment-driven)
# =====================================================
# Ensure .env values take precedence over any system-level
# env vars that may override them (e.g. OLLAMA_MODEL).
load_dotenv(override=True)

# The model name is configurable via the OLLAMA_MODEL env
# var instead of being hardcoded, e.g.:
#   OLLAMA_MODEL=qwen2.5:1.5b-instruct
MODEL_NAME = os.getenv(
    "OLLAMA_MODEL",
    "qwen2.5:1.5b-instruct"
)

# Single-inference timeout (seconds). Prevents a request from
# hanging when Ollama is busy or unavailable.
OLLAMA_TIMEOUT = float(
    os.getenv(
        "OLLAMA_TIMEOUT",
        "300"
    )
)

OLLAMA_HOST = os.getenv(
    "OLLAMA_HOST",
    "http://localhost:11434"
)

# One shared client so the timeout applies to every call.
_ollama_client = ollama.Client(
    host=OLLAMA_HOST,
    timeout=OLLAMA_TIMEOUT
)


# =====================================================
# DEFAULT EMPTY RESPONSE
# =====================================================

def get_empty_entities():

    return {
        "diagnosis": "",
        "symptoms": [],
        "medications": [],
        "treatment_history": {
            "physical_therapy": {
                "duration": "",
                "exercises": [],
                "outcome": ""
            }
        },
        "procedure_requested": ""
    }


# =====================================================
# VALIDATED ENTITY SCHEMA (Pydantic boundary)
# =====================================================
# Every LLM output is validated against this model before
# it reaches the DB / rules engine / policy matcher. This
# kills silent field-mismatch crashes (e.g. missing
# treatment_history.physical_therapy) at the boundary.

class PhysicalTherapyHistory(BaseModel):

    duration: str = ""

    exercises: list = Field(default_factory=list)

    outcome: str = ""


class TreatmentHistory(BaseModel):

    physical_therapy: PhysicalTherapyHistory = Field(
        default_factory=PhysicalTherapyHistory
    )


class MedicalEntities(BaseModel):

    diagnosis: str = ""

    symptoms: list = Field(default_factory=list)

    medications: list = Field(default_factory=list)

    treatment_history: TreatmentHistory = Field(
        default_factory=TreatmentHistory
    )

    procedure_requested: str = ""


def normalize_entities(parsed):
    """
    Validate/normalize any parsed LLM output (or garbage) into the
    canonical entity dict shape. Never raises; falls back to the
    empty schema on invalid input.

    The qwen2.5:1.5b model frequently returns type mismatches:
      - symptoms/medications as a string instead of a list
      - diagnosis/procedure_requested as a list instead of a string
      - treatment_history as a string instead of a dict
    This pre-processing coerces those before Pydantic validation so
    the entire entity dict is not wiped to empty by a single
    type mismatch.
    """

    try:

        source = (
            parsed
            if isinstance(parsed, dict)
            else {}
        )

        # ---- Coerce list fields that LLM may return as strings ----
        for key in ("symptoms", "medications"):
            val = source.get(key)
            if isinstance(val, str):
                source[key] = (
                    [val] if val.strip()
                    else []
                )
            elif not isinstance(val, list):
                source[key] = []

        # ---- Coerce string fields that LLM may return as lists ----
        for key in ("diagnosis", "procedure_requested"):
            val = source.get(key)
            if isinstance(val, list):
                source[key] = (
                    " ".join(str(v) for v in val)
                    if val else ""
                )
            elif val is None:
                source[key] = ""
            elif not isinstance(val, str):
                source[key] = str(val)

        # ---- Coerce nested treatment_history ----
        th = source.get("treatment_history")
        if isinstance(th, str):
            source["treatment_history"] = {}
        elif isinstance(th, dict):
            pt = th.get("physical_therapy")
            if isinstance(pt, str):
                th["physical_therapy"] = {}
            elif pt is None:
                th["physical_therapy"] = {}

        return MedicalEntities.model_validate(
            source
        ).model_dump()

    except Exception as normalize_error:

        print(
            "ENTITY NORMALIZATION ERROR:",
            str(normalize_error)
        )

        return get_empty_entities()


# =====================================================
# MEDICAL ENTITY EXTRACTION
# =====================================================

def extract_medical_entities(clinical_text):

    prompt = f"""
You are an advanced healthcare prior authorization AI.

Extract ONLY explicitly mentioned medical information.

Rules:
- No hallucinations
- No assumptions
- Return STRICT JSON ONLY
- No markdown
- No explanations

JSON Format:

{{
    "diagnosis":"",
    "symptoms":[],
    "medications":[],
    "treatment_history":
    {{
        "physical_therapy":
        {{
            "duration":"",
            "exercises":[],
            "outcome":""
        }}
    }},
    "procedure_requested":""
}}

Clinical Documents:
{clinical_text}
"""

    # ===== DIAGNOSTIC: timing the Ollama call =====
    import time as _time
    print("\n=== BEFORE OLLAMA CALL ===")
    print("MODEL:", MODEL_NAME)
    print("TIMEOUT:", OLLAMA_TIMEOUT)
    print("HOST:", OLLAMA_HOST)
    print("TEXT LENGTH:", len(clinical_text))
    _ollama_start = _time.time()
    # ===== END DIAGNOSTIC =====

    try:

        response = _ollama_client.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            # Force the model to emit valid JSON only (no markdown,
            # no explanations), which the prompt also requests.
            format="json",
            options={
                "temperature": 0,
                "top_p": 0.1
            }
        )

        # ===== DIAGNOSTIC: after Ollama call =====
        _ollama_elapsed = _time.time() - _ollama_start
        print("=== AFTER OLLAMA CALL ===")
        print("OLLAMA ELAPSED:", round(_ollama_elapsed, 1), "seconds")
        # ===== END DIAGNOSTIC =====

        result = response["message"]["content"]

        print("\nRAW OLLAMA RESPONSE")
        print(result)

        result = result.replace(
            "```json",
            ""
        )

        result = result.replace(
            "```",
            ""
        )

        result = result.strip()

        json_match = re.search(
            r"\{.*\}",
            result,
            re.DOTALL
        )

        if json_match:
            result = json_match.group(0)

        try:
            parsed = json.loads(result)

        except Exception:

            parsed = get_empty_entities()

        lower_text = clinical_text.lower()

        # ===================================
        # FALLBACK DIAGNOSIS
        # ===================================

        if not parsed.get("diagnosis"):

            # --- Regex: extract "Clinical indication: ..." from radiology ---
            ci_match = re.search(
                r'clinical indication[:\s]+(.+?)(?:\n|$)',
                lower_text
            )
            if ci_match:
                parsed["diagnosis"] = (
                    ci_match.group(1).strip().title()
                )

            elif "intracranial injury" in lower_text:
                parsed["diagnosis"] = (
                    "Possible intracranial injury"
                )

            elif "head injury" in lower_text:
                parsed["diagnosis"] = (
                    "Head injury"
                )

            elif "neurological deficit" in lower_text:
                parsed["diagnosis"] = (
                    "Neurological abnormality"
                )

            elif "neurological examination" in lower_text:
                parsed["diagnosis"] = (
                    "Neurological condition"
                )

            elif "chief complaint" in lower_text:
                parsed["diagnosis"] = (
                    "Clinical condition"
                )

            elif "headache" in lower_text:
                parsed["diagnosis"] = (
                    "Headache"
                )

            elif "weakness" in lower_text or "numbness" in lower_text:
                parsed["diagnosis"] = (
                    "Neurological symptom"
                )

        # ===================================
        # FALLBACK PROCEDURE
        # ===================================

        if not parsed.get(
                "procedure_requested"
        ):

            # --- Regex: extract "requested procedure: ..." ---
            proc_match = re.search(
                r'(?:requested procedure|procedure requested|exam ordered)[:\s]+(.+?)(?:\n|$)',
                lower_text
            )
            if proc_match:
                parsed[
                    "procedure_requested"
                ] = proc_match.group(1).strip().title()

            elif "ct brain scan" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "CT Brain Scan"

            elif "ct brain imaging" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "CT Brain Scan"

            elif "brain mri" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "Brain MRI"

            elif "mri brain" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "MRI Brain Scan"

            elif "mri" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "MRI"

            elif "ct chest" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "CT Chest"

            elif "ct scan" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "CT Scan"

            elif "x-ray" in lower_text or "x ray" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "X-Ray"

            elif "ultrasound" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "Ultrasound"

            elif "biopsy" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "Biopsy"

        # ===================================
        # FALLBACK SYMPTOMS
        # ===================================

        symptoms = []

        symptom_keywords = [

            "headache",
            "dizziness",
            "loss of consciousness",
            "neurological deficit",
            "balance impairment",
            "reduced coordination",
            "delayed response time"
        ]

        for keyword in symptom_keywords:

            if keyword in lower_text:
                symptoms.append(
                    keyword
                )

        if (
                not parsed.get("symptoms")
                and
                symptoms
        ):

            parsed["symptoms"] = symptoms

        final_output = normalize_entities(parsed)

        print(
            json.dumps(
                final_output,
                indent=2
            )
        )

        return json.dumps(final_output)

    except Exception as error:

        # ===== DIAGNOSTIC: exact exception details =====
        _ollama_elapsed = _time.time() - _ollama_start
        print("=== OLLAMA CALL FAILED ===")
        print("OLLAMA ELAPSED:", round(_ollama_elapsed, 1), "seconds")
        print("AI SERVICE ERROR TYPE:", type(error).__name__)
        print("AI SERVICE ERROR MODULE:", type(error).__module__)
        print("AI SERVICE ERROR:", repr(error))
        # ===== END DIAGNOSTIC =====

        return json.dumps(
            normalize_entities(get_empty_entities())
        )


# =====================================================
# PROVIDER EXPLANATION
# =====================================================

def generate_provider_explanation(
        xai_result
):

    decision = xai_result.get(
        "decision",
        "Manual Review"
    )

    confidence = xai_result.get(
        "confidence_score",
        0
    )

    missing_docs = xai_result.get(
        "missing_documents",
        []
    )

    medical_evidence = xai_result.get(
        "medical_evidence",
        {}
    )

    matched_conditions = xai_result.get(
        "matched_conditions",
        []
    )

    explanation = (
        f"Decision: {decision}\n"
        f"Confidence Score: "
        f"{confidence}%\n\n"
    )

    if matched_conditions:

        explanation += (
            "Matched Policy Conditions:\n"
        )

        for cond in matched_conditions:

            explanation += (
                f"- {cond}\n"
            )

        explanation += "\n"

    if missing_docs:

        explanation += (
            "Missing Requirements:\n"
        )

        for doc in missing_docs:

            explanation += (
                f"- {doc}\n"
            )

    else:

        explanation += (
            "All policy requirements "
            "have been satisfied."
        )

    return explanation


# =====================================================
# PATIENT EXPLANATION
# =====================================================

def generate_patient_explanation(
        xai_result
):

    decision = xai_result.get(
        "decision",
        "Manual Review"
    )

    missing_docs = xai_result.get(
        "missing_documents",
        []
    )

    matched_conditions = xai_result.get(
        "matched_conditions",
        []
    )

    if decision == "Approved":

        return (
            "Your prior authorization "
            "request has been approved."
        )

    if decision == "Pending Additional Information":

        if missing_docs:

            readable = []

            for doc in missing_docs:

                readable.append(
                    doc.replace("_", " ").title()
                )

            return (
                "Your request needs additional "
                "medical documents before it "
                "can be approved. "
                "Please upload: "
                + ", ".join(readable)
            )

        return (
            "Your request is pending. "
            "Please check with your provider."
        )

    if missing_docs:

        return (
            "Your request needs some "
            "additional medical documents "
            "before approval. "
            "Please upload: "
            + ", ".join(missing_docs)
        )

    return (
        "Your request is currently under "
        "manual review by the insurance team."
    )


# =====================================================
# XAI REASONING
# =====================================================

def generate_xai_reasoning(
        xai_result
):

    decision = xai_result.get(
        "decision",
        "Manual Review"
    )

    confidence = xai_result.get(
        "confidence_score",
        0
    )

    missing_docs = xai_result.get(
        "missing_documents",
        []
    )

    matched_conditions = xai_result.get(
        "matched_conditions",
        []
    )

    medical_evidence = xai_result.get(
        "medical_evidence",
        {}
    )

    reasoning_parts = []

    reasoning_parts.append(
        f"Policy matched with confidence: {confidence}%"
    )

    if matched_conditions:

        reasoning_parts.append(
            f"Matched conditions: "
            f"{', '.join(matched_conditions)}"
        )

    if missing_docs:

        readable = []

        for doc in missing_docs:

            readable.append(
                doc.replace("_", " ").title()
            )

        reasoning_parts.append(
            f"Missing requirements: "
            f"{', '.join(readable)}"
        )

    reasoning_parts.append(
        f"Resulting decision: {decision}"
    )

    return {

        "decision": decision,

        "confidence_score": confidence,

        "medical_evidence": medical_evidence,

        "matched_conditions": matched_conditions,

        "missing_documents": missing_docs,

        "reasoning": " | ".join(reasoning_parts)
    }