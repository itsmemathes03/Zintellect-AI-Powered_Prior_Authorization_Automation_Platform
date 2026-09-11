import json


# ==========================================
# EXTRACT MATCHED POLICY CLAUSES
# ==========================================

def extract_policy_clauses(
        retrieved_chunks
):

    clauses = []

    for chunk in retrieved_chunks:

        clause = {

            "chunk_id":
                chunk.get(
                    "chunk_id"
                ),

            "section_number":
                chunk.get(
                    "section_number",
                    "N/A"
                ),

            "clause_text":
                chunk.get(
                    "chunk_text",
                    ""
                )[:300]
        }

        clauses.append(
            clause
        )

    return clauses


# ==========================================
# EXTRACT MEDICAL EVIDENCE
# ==========================================

def extract_medical_evidence(
        entities
):

    evidence = []

    diagnosis = entities.get(
        "diagnosis"
    )

    procedure = entities.get(
        "procedure_requested"
    )

    symptoms = entities.get(
        "symptoms",
        []
    )

    medications = entities.get(
        "medications",
        []
    )

    if diagnosis:

        evidence.append(
            f"Diagnosis: {diagnosis}"
        )

    if procedure:

        evidence.append(
            f"Procedure Requested: {procedure}"
        )

    for symptom in symptoms:

        evidence.append(
            f"Symptom: {symptom}"
        )

    for medication in medications:

        evidence.append(
            f"Medication: {medication}"
        )

    return evidence


# ==========================================
# CHECK MISSING DOCUMENTS
# ==========================================

def detect_missing_documents(
        uploaded_documents,
        required_documents
):

    missing = []

    uploaded_lower = [

        doc.lower()

        for doc in uploaded_documents
    ]

    for document in required_documents:

        if document.lower() not in uploaded_lower:

            missing.append(
                document
            )

    return missing


# ==========================================
# GENERATE EXPLANATION
# ==========================================

def generate_explanation(

        decision,

        confidence_score,

        entities,

        retrieved_chunks,

        required_documents=None,

        uploaded_documents=None
):

    policy_clauses = (
        extract_policy_clauses(
            retrieved_chunks
        )
    )

    medical_evidence = (
        extract_medical_evidence(
            entities
        )
    )

    missing_documents = []

    if (

        required_documents
        and
        uploaded_documents

    ):

        missing_documents = (
            detect_missing_documents(
                uploaded_documents,
                required_documents
            )
        )

    explanation = {

        "decision":
            decision,

        "confidence_score":
            confidence_score,

        "medical_evidence":
            medical_evidence,

        "matched_policy_clauses":
            policy_clauses,

        "missing_documents":
            missing_documents
    }

    return explanation


# ==========================================
# FRONTEND EXPLANATION CARD
# ==========================================

def build_explanation_card(
        explanation
):

    card = {

        "decision":
            explanation[
                "decision"
            ],

        "confidence":
            explanation[
                "confidence_score"
            ],

        "why":

            explanation[
                "medical_evidence"
            ],

        "policy_matches":

            explanation[
                "matched_policy_clauses"
            ],

        "missing_documents":

            explanation[
                "missing_documents"
            ]
    }

    return card


# ==========================================
# JSON RESPONSE
# ==========================================

def explanation_to_json(
        explanation
):

    return json.dumps(
        explanation,
        indent=4
    )