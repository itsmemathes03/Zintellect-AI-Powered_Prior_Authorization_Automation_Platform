import json

from app.services.retrieval.hybrid_retriever import (
    hybrid_retrieve
)


# ==========================================
# BUILD HIERARCHICAL CONTEXT
# ==========================================

def build_context(
        retrieved_chunks
):

    sections = {}

    for chunk in retrieved_chunks:

        section = str(
            chunk.get(
                "section_number",
                0
            )
        )

        if section not in sections:
            sections[section] = []

        sections[section].append(
            chunk["chunk_text"]
        )

    context = ""

    for section_number in sorted(
            sections.keys()
    ):

        context += (
            f"\nSECTION "
            f"{section_number}\n"
        )

        context += "\n".join(
            sections[
                section_number
            ]
        )

        context += "\n"

    return context


# ==========================================
# MEDICAL EVIDENCE SUMMARY
# ==========================================

def build_medical_summary(
        entities
):

    summary = f"""
Diagnosis:
{entities.get('diagnosis', '')}

Procedure Requested:
{entities.get('procedure_requested', '')}

Symptoms:
{', '.join(
    entities.get(
        'symptoms',
        []
    )
)}

Medications:
{', '.join(
    entities.get(
        'medications',
        []
    )
)}
"""

    return summary


# ==========================================
# RULE-BASED CONFIDENCE SCORE
# ==========================================

def calculate_confidence(
        entities,
        retrieved_chunks
):

    score = 0.50

    diagnosis = entities.get(
        "diagnosis",
        ""
    )

    procedure = entities.get(
        "procedure_requested",
        ""
    )

    symptoms = entities.get(
        "symptoms",
        []
    )

    if diagnosis:
        score += 0.15

    if procedure:
        score += 0.15

    if symptoms:
        score += 0.10

    if len(
            retrieved_chunks
    ) >= 3:

        score += 0.10

    return round(
        min(
            score,
            0.99
        ),
        2
    )


# ==========================================
# POLICY DECISION
# ==========================================

def generate_decision(
        entities,
        retrieved_chunks
):

    confidence = calculate_confidence(
        entities,
        retrieved_chunks
    )

    if confidence >= 0.80:

        decision = "Approved"

    elif confidence >= 0.60:

        decision = (
            "Manual Review"
        )

    else:

        decision = "Rejected"

    return {

        "decision":
            decision,

        "confidence_score":
            confidence
    }


# ==========================================
# HIERARCHICAL RAG PIPELINE
# ==========================================

def run_hierarchical_rag(

        entities,

        policy_chunks,

        top_k=5
):

    query = f"""
Diagnosis:
{entities.get('diagnosis', '')}

Procedure:
{entities.get('procedure_requested', '')}

Symptoms:
{' '.join(
    entities.get(
        'symptoms',
        []
    )
)}
"""

    # --------------------------------------
    # HYBRID RETRIEVAL
    # --------------------------------------

    retrieved_chunks = (
        hybrid_retrieve(
            query,
            policy_chunks,
            top_k
        )
    )

    # --------------------------------------
    # BUILD CONTEXT
    # --------------------------------------

    context = build_context(
        retrieved_chunks
    )

    # --------------------------------------
    # MEDICAL SUMMARY
    # --------------------------------------

    medical_summary = (
        build_medical_summary(
            entities
        )
    )

    # --------------------------------------
    # DECISION
    # --------------------------------------

    result = generate_decision(
        entities,
        retrieved_chunks
    )

    return {

        "decision":
            result[
                "decision"
            ],

        "confidence_score":
            result[
                "confidence_score"
            ],

        "retrieved_chunks":
            retrieved_chunks,

        "policy_context":
            context,

        "medical_summary":
            medical_summary
    }