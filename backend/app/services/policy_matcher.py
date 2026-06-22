from app.services.text_normalizer import (
    normalize_text
)

from app.services.semantic_matcher import (
    semantic_match
)

from app.services.rag.hierarchical_rag import (
    run_hierarchical_rag
)

from app.services.xai.xai_service import (
    generate_explanation
)

from app.services.ai_service import (
    generate_provider_explanation,
    generate_patient_explanation,
    generate_xai_reasoning
)


def match_policy_requirements(
    extracted_entities,
    uploaded_document_types,
    policy_rules
):

    missing_requirements = []
    matched_conditions = []
    confidence_scores = []

    # ==========================================
    # UNKNOWN POLICY CHECK
    # ==========================================

    if policy_rules.get("procedure") == "unknown":

        return {

            "decision":
            "Manual Review",

            "confidence_score":
            0,

            "matched_conditions":
            [],

            "missing_requirements": [
                "No matching insurance policy found"
            ]
        }

    # ==========================================
    # CLEAN POLICY DATA
    # ==========================================

    required_documents = [

        doc.strip()

        for doc in policy_rules.get(
            "required_documents",
            []
        )

        if doc
        and doc.strip()
        and doc.strip() != "[]"
    ]

    required_conditions = [

        condition.strip()

        for condition in policy_rules.get(
            "required_conditions",
            []
        )

        if condition
        and condition.strip()
        and condition.strip() != "[]"
    ]

    # ==========================================
    # NORMALIZE DOCUMENT TYPES
    # ==========================================

    normalized_uploaded_docs = [

        normalize_text(doc)

        for doc in uploaded_document_types
    ]

    # ==========================================
    # CLINICAL CONTENT
    # ==========================================

    diagnosis = normalize_text(

        str(
            extracted_entities.get(
                "diagnosis",
                ""
            )
        )
    )

    symptoms = extracted_entities.get(
        "symptoms",
        []
    )

    symptoms_text = normalize_text(

        " ".join(

            [
                str(symptom)

                for symptom in symptoms
            ]
        )
    )

    treatment_history = extracted_entities.get(
        "treatment_history",
        {}
    )

    treatment_text = normalize_text(
        str(treatment_history)
    )

    # ==========================================
    # FULL CLINICAL TEXT SUPPORT
    # ==========================================

    full_clinical_text = normalize_text(

        extracted_entities.get(
            "full_clinical_text",
            ""
        )
    )

    combined_clinical_text = normalize_text(

        f"""
        {diagnosis}
        {symptoms_text}
        {treatment_text}
        {full_clinical_text}
        """
    )

    # ==========================================
    # CHECK REQUIRED DOCUMENTS
    # ==========================================

        # --------------------------------------
        # DIRECT DOCUMENT TYPE MATCH
        # --------------------------------------

    for required_doc in required_documents:

        normalized_required_doc = normalize_text(
            required_doc
        )

        found_match = (
            normalized_required_doc
            in normalized_uploaded_docs
        )

        print(
            f"Required: {normalized_required_doc}"
        )

        print(
            f"Uploaded: {normalized_uploaded_docs}"
        )

        print(
            f"Found: {found_match}"
        )

        if found_match:

            confidence_scores.append(
                1.0
            )

        else:

            missing_requirements.append(
                required_doc
            )


    # ==========================================
    # CHECK REQUIRED CONDITIONS
    # HYBRID MATCHING
    # ==========================================

    for required_condition in required_conditions:

        normalized_condition = normalize_text(
            required_condition
        )

        # --------------------------------------
        # EXACT MATCH
        # --------------------------------------

        if normalized_condition in combined_clinical_text:

            print(
                f"Exact Match Found: "
                f"{normalized_condition}"
            )

            matched_conditions.append(
                required_condition
            )

            confidence_scores.append(1.0)

            continue

        # --------------------------------------
        # SPECIAL THERAPY RULES
        # --------------------------------------

        therapy_keywords = [

            "conservative therapy",
            "therapy completion",
            "physical therapy",
            "therapy sessions",
            "rehabilitation",
            "completed therapy",
            "therapy completed"
        ]

        if (
            "conservative therapy"
            in normalized_condition
        ):

            if any(

                keyword in combined_clinical_text

                for keyword in therapy_keywords
            ):

                print(
                    "Therapy condition matched "
                    "through medical keywords"
                )

                matched_conditions.append(
                    required_condition
                )

                confidence_scores.append(0.95)

                continue

        # --------------------------------------
        # SEMANTIC MATCH
        # --------------------------------------

        score = semantic_match(

            normalized_condition,

            combined_clinical_text
        )

        print(
            f"Condition Match: "
            f"{normalized_condition} "
            f"= {score}"
        )

        if score > 0.25:

            matched_conditions.append(
                required_condition
            )

            confidence_scores.append(score)

        else:

            missing_requirements.append(
                required_condition
            )

    # ==========================================
    # REMOVE DUPLICATES
    # ==========================================

    missing_requirements = list(
        set(missing_requirements)
    )

    matched_conditions = list(
        set(matched_conditions)
    )

    # ==========================================
    # CALCULATE CONFIDENCE
    # ==========================================

    if len(confidence_scores) > 0:

        avg_confidence = round(

            (
                sum(confidence_scores)
                / len(confidence_scores)
            ) * 100,

            2
        )

    else:

        avg_confidence = 0

    # ==========================================
    # CONFIDENCE SAFETY
    # ==========================================

    avg_confidence = min(
        avg_confidence,
        100
    )

    # ==========================================
    # DOCUMENT COMPLETENESS CHECK
    # ==========================================

    required_doc_count = len(
        required_documents
    )

    uploaded_doc_count = len(
        normalized_uploaded_docs
    )

    all_documents_present = all(

        normalize_text(doc)
        in normalized_uploaded_docs

        for doc in required_documents
    )

    missing_document_count = len(
        missing_requirements
    )
    # ==========================================
    # DEBUG LOGGING
    # ==========================================

    print("\n===================================")
    print("POLICY MATCHING DEBUG")
    print("===================================")

    print(
        "Required Documents:",
        required_documents
    )

    print(
        "Required Conditions:",
        required_conditions
    )

    print(
        "Matched Conditions:",
        matched_conditions
    )

    print(
        "Missing Requirements:",
        missing_requirements
    )

    print(
        "Confidence:",
        avg_confidence
    )

    # ==========================================
    # HMH-RAGES
    # ==========================================

    rag_result = {

        "decision": None,
        "confidence_score": avg_confidence,
        "retrieved_chunks": [],
        "policy_context": "",
        "medical_summary": ""
    }

    try:

        policy_chunks = []

        if policy_rules.get(
            "policy_text"
        ):

            from app.services.rag.chunking_service import (
                create_hierarchical_policy_chunks
            )

            policy_chunks = (
                create_hierarchical_policy_chunks(

                    policy_rules[
                        "policy_text"
                    ],

                    policy_rules.get(
                        "policy_id",
                        "unknown"
                    )
                )
            )

        if len(policy_chunks) > 0:

            rag_result = (
                run_hierarchical_rag(

                    extracted_entities,

                    policy_chunks,

                    top_k=5
                )
            )

    except Exception as error:

        print(
            "RAG ERROR:",
            str(error)
        )
    # ==========================================
    # XAI
    # ==========================================

    xai_result = {

            "decision": "",
            "confidence_score":
                avg_confidence,

            "medical_evidence": [],

            "matched_policy_clauses": [],

            "missing_documents":
                missing_requirements
    }

    xai_result = {
            "summary":
                "AI explanation unavailable.",

            "reason":
                "Explanation generation failed."
    }
    try:

            xai_result = generate_explanation(

                    decision=
                        rag_result.get(
                            "decision",
                            ""
                        ),

                    confidence_score=
                        rag_result.get(
                            "confidence_score",
                            avg_confidence
                        ),

                    entities=
                        extracted_entities,

                    retrieved_chunks=
                        rag_result.get(
                            "retrieved_chunks",
                            []
                        ),

                    required_documents=
                        policy_rules.get(
                            "required_documents",
                            []
                        ),

                    uploaded_documents=
                        uploaded_document_types
                )

    except Exception as error:

                print(
                    "XAI ERROR:",
                    str(error)
                )

    # ==========================================
    # QWEN EXPLANATIONS
    # ==========================================

    provider_explanation = ""

    patient_explanation = ""

    xai_reasoning = ""

    try:

        provider_explanation = (
            generate_provider_explanation(
                xai_result
            )
        )

        patient_explanation = (
            generate_patient_explanation(
                xai_result
            )
        )

        xai_reasoning = (
            generate_xai_reasoning(
                xai_result
            )
        )

    except Exception as error:

        print(
            "QWEN ERROR:",
            str(error)
        )

    # ==========================================
    # FINAL DECISION LOGIC
    # ==========================================

    # ------------------------------------------
    # APPROVED
    # ------------------------------------------
    if (
        all_documents_present
        and missing_document_count == 0
        and avg_confidence >= 75
    ):

        return {

            "decision":
                "Approved",

            "confidence_score":
                avg_confidence,

            "matched_conditions":
                matched_conditions,

            "missing_requirements":
                [],

            "provider_explanation":
                provider_explanation,

            "patient_explanation":
                patient_explanation,

            "xai_reasoning":
                xai_reasoning,

            "policy_context":
                rag_result.get(
                    "policy_context",
                    ""
                ),

            "retrieved_chunks":
                rag_result.get(
                    "retrieved_chunks",
                    []
                )
        }

    # ------------------------------------------
    # MANUAL REVIEW
    # ------------------------------------------
# ==========================================
# MISSING DOCUMENTS
# ==========================================

    if missing_document_count > 0:

        return {

            "decision":
            "Pending Additional Information",

            "confidence_score":
            avg_confidence,

            "matched_conditions":
            matched_conditions,

            "missing_requirements":
            missing_requirements
        }
    
    if avg_confidence >= 60:

        return {

            "decision":
            "Manual Review",

            "confidence_score":
            avg_confidence,

            "matched_conditions":
            matched_conditions,

            "missing_requirements":
            missing_requirements
        }

    # ------------------------------------------
    # PENDING INFO
    # ------------------------------------------

    return {

        "decision":
        "Pending Additional Information",

        "confidence_score":
        avg_confidence,

        "matched_conditions":
        matched_conditions,

        "missing_requirements":
        missing_requirements
    }