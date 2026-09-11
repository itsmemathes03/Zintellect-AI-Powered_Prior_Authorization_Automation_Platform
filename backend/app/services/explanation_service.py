def generate_explanation(
    decision,
    reason,
    missing_items
):

    explanation = f"Decision: {decision}\n"

    explanation += f"Reason: {reason}\n"

    # Missing evidence section
    if missing_items:

        explanation += "\nMissing Evidence:\n"

        for item in missing_items:

            explanation += f"- {item}\n"

    else:

        explanation += (
            "\nAll required supporting evidence provided."
        )

    return explanation

# ==========================================
# PROVIDER EXPLANATION
# ==========================================

def generate_provider_explanation(
        xai_result
):

    decision = xai_result.get(
        "decision",
        "Unknown"
    )

    confidence = xai_result.get(
        "confidence_score",
        0
    )

    missing_docs = xai_result.get(
        "missing_documents",
        []
    )

    return {
        "decision": decision,
        "confidence_score": confidence,
        "missing_documents": missing_docs,
        "message":
            "Decision generated using "
            "HMH-RAGES policy reasoning."
    }


# ==========================================
# PATIENT EXPLANATION
# ==========================================

def generate_patient_explanation(
        xai_result
):

    decision = xai_result.get(
        "decision",
        "Unknown"
    )

    missing_docs = xai_result.get(
        "missing_documents",
        []
    )

    if missing_docs:

        return (
            f"Your request is "
            f"{decision}. "
            f"Please upload: "
            f"{', '.join(missing_docs)}."
        )

    return (
        f"Your request is "
        f"{decision}. "
        f"No additional documents "
        f"are required."
    )


# ==========================================
# XAI REASONING
# ==========================================

def generate_xai_reasoning(
        xai_result
):

    return {

        "decision":
            xai_result.get(
                "decision"
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
            )
    }