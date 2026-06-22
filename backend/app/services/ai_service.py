import ollama
import json
import re

MODEL_NAME = "qwen2.5:1.5b"


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

    try:

        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            options={
                "temperature": 0,
                "top_p": 0.1
            }
        )

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

            if "intracranial injury" in lower_text:
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

        # ===================================
        # FALLBACK PROCEDURE
        # ===================================

        if not parsed.get(
                "procedure_requested"
        ):

            if "ct brain scan" in lower_text:
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

            elif "mri" in lower_text:
                parsed[
                    "procedure_requested"
                ] = "MRI"

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

        final_output = {

            "diagnosis":
                parsed.get(
                    "diagnosis",
                    ""
                ),

            "symptoms":
                parsed.get(
                    "symptoms",
                    []
                ),

            "medications":
                parsed.get(
                    "medications",
                    []
                ),

            "treatment_history":
                parsed.get(
                    "treatment_history",
                    {
                        "physical_therapy":
                        {
                            "duration": "",
                            "exercises": [],
                            "outcome": ""
                        }
                    }
                ),

            "procedure_requested":
                parsed.get(
                    "procedure_requested",
                    ""
                )
        }

        print(
            json.dumps(
                final_output,
                indent=2
            )
        )

        return json.dumps(final_output)

    except Exception as error:

        print(
            "AI SERVICE ERROR:",
            str(error)
        )

        return json.dumps(
            get_empty_entities()
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

    explanation = (
        f"Decision: {decision}\n"
        f"Confidence Score: "
        f"{confidence}%\n\n"
    )

    explanation += (
        "Medical Evidence:\n"
    )

    explanation += (
        json.dumps(
            medical_evidence,
            indent=2
        )
    )

    explanation += "\n\n"

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

    if decision == "Approved":

        return (
            "Your prior authorization "
            "request has been approved."
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

    return {

        "decision":
            xai_result.get(
                "decision",
                "Manual Review"
            ),

        "confidence_score":
            xai_result.get(
                "confidence_score",
                0
            ),

        "medical_evidence":
            xai_result.get(
                "medical_evidence",
                {}
            ),

        "matched_policy_clauses":
            xai_result.get(
                "matched_policy_clauses",
                []
            ),

        "missing_documents":
            xai_result.get(
                "missing_documents",
                []
            ),

        "explanation":
            (
                "Decision generated using "
                "clinical entity extraction, "
                "policy matching, hybrid retrieval, "
                "and explainable AI reasoning."
            )
    }