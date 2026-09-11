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


# ==========================================
# DETERMINISTIC CONDITION EVIDENCE KEYWORDS
# ==========================================
# Maps a normalized required condition to explicit evidence phrases
# that, when present in the extracted clinical text, satisfy the
# condition. This is a safe deterministic check performed BEFORE
# semantic matching: a condition is only ever matched when its
# supporting evidence actually appears in the text (never on
# assumption), which catches medically-equivalent wording that plain
# semantic similarity under-scores (e.g. "motor weakness" for
# "Neurological deficits").

CONDITION_EVIDENCE_KEYWORDS = {
    "neurological deficits": [
        "neurological deficit",
        "motor weakness",
        "muscle weakness",
        "reflex abnormality",
        "abnormal reflexes",
        "reduced coordination",
        "coordination problems",
        "balance impairment",
        "delayed response time",
        "numbness",
        "tingling",
        "paresthesia",
        "sensory loss",
        "loss of sensation",
        "gait disturbance",
        "foot drop",
        "facial droop",
        "slurred speech",
        "hemiparesis",
        "paraparesis",
    ],
}


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
    # DOCUMENT-TYPE ALIASES
    # ==========================================
    # Maps an uploaded document type to the required document
    # types it can satisfy. E.g. a neurological exam report
    # IS clinical documentation and should satisfy the
    # "clinical_notes" requirement.

    DOC_TYPE_ALIASES = {
        "neurological_exam_report": [
            "clinical_notes"
        ],
    }

    # Build a set of all document types that the uploaded
    # documents satisfy (direct match + aliases).
    # Keys are normalized (underscores become spaces) to
    # match the normalized_uploaded_docs values.
    satisfied_docs = set(normalized_uploaded_docs)

    normalized_alias_map = {
        normalize_text(k): [normalize_text(v) for v in vals]
        for k, vals in DOC_TYPE_ALIASES.items()
    }

    for uploaded_doc in normalized_uploaded_docs:

        aliases = normalized_alias_map.get(
            uploaded_doc, []
        )

        for alias in aliases:

            satisfied_docs.add(alias)

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
            in satisfied_docs
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

            confidence_scores.append(
                0.0
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
        # DETERMINISTIC MEDICAL EVIDENCE CHECK
        # --------------------------------------
        # Before falling back to semantic similarity, look for explicit
        # supporting evidence phrases in the clinical text (e.g. "motor
        # weakness" for "Neurological deficits"). The condition is only
        # matched when the evidence actually appears in the text.

        evidence_phrases = CONDITION_EVIDENCE_KEYWORDS.get(
            normalized_condition,
            []
        )

        if any(

            phrase in combined_clinical_text

            for phrase in evidence_phrases
        ):

            print(
                "Condition matched "
                "through clinical evidence "
                "keywords"
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

            confidence_scores.append(
                0.0
            )

    # ==========================================
    # CHECK REQUIRED EVIDENCE (CONDITIONAL RULES)
    # ==========================================
    # Evidence requirements describe clinical proof that must
    # be present in the uploaded documents' text — not just
    # document-type presence. Each rule may be unconditional
    # (mandatory=True) or conditional on an entity field.

    required_evidence = policy_rules.get(
        "required_evidence", []
    )

    evidence_satisfied = 0
    evidence_total = 0

    for evidence_rule in required_evidence:
        label = evidence_rule.get("label", "")
        patterns = evidence_rule.get(
            "evidence_patterns", []
        )
        mandatory = evidence_rule.get(
            "mandatory", True
        )
        condition_key = evidence_rule.get(
            "condition_key"
        )

        # Skip conditional rules whose condition is not met
        if not mandatory and condition_key:
            condition_met = bool(
                extracted_entities.get(condition_key)
            )
            if not condition_met:
                continue

        evidence_total += 1

        # Check clinical text for any evidence pattern
        # Normalize each pattern before comparison so that hyphenated
        # terms ("x-ray" → "x ray") and short synonyms that survived
        # normalize_text() are compared on equal footing.
        found = any(
            normalize_text(pattern) in combined_clinical_text
            for pattern in patterns
        )

        if found:
            evidence_satisfied += 1
            confidence_scores.append(1.0)
            print(
                f"Evidence satisfied: {label}"
            )
        else:
            missing_requirements.append(
                label
            )
            confidence_scores.append(0.0)
            print(
                f"Evidence MISSING: {label}"
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
        in satisfied_docs

        for doc in required_documents
    )

    all_evidence_satisfied = (
        evidence_total == 0
        or evidence_satisfied == evidence_total
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
    # FINAL DECISION LOGIC
    # ==========================================
    # Compute the deterministic decision FIRST so explanations
    # can reference the actual decision (not the RAG prediction).

    if (
        all_documents_present
        and all_evidence_satisfied
        and missing_document_count == 0
        and avg_confidence >= 75
    ):
        decision = "Approved"
    elif missing_document_count > 0:
        decision = "Pending Additional Information"
    elif avg_confidence >= 60:
        decision = "Manual Review"
    else:
        decision = "Pending Additional Information"

    # ==========================================
    # EXPLANATIONS
    # ==========================================
    # Build explanation input from the actual matching results.

    explanation_input = {
        "decision": decision,
        "confidence_score": avg_confidence,
        "matched_conditions": matched_conditions,
        "missing_documents": missing_requirements,
        "medical_evidence": xai_result.get("medical_evidence", {}),
        "matched_policy_clauses": xai_result.get("matched_policy_clauses", []),
    }

    provider_explanation = ""

    patient_explanation = ""

    xai_reasoning = ""

    try:

        provider_explanation = (
            generate_provider_explanation(
                explanation_input
            )
        )

        patient_explanation = (
            generate_patient_explanation(
                explanation_input
            )
        )

        xai_reasoning = (
            generate_xai_reasoning(
                explanation_input
            )
        )

    except Exception as error:

        print(
            "EXPLANATION ERROR:",
            str(error)
        )

    # ------------------------------------------
    # RETURN RESULT
    # ------------------------------------------

    if decision == "Approved":

        return {

            "decision":
                decision,

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

    return {

        "decision":
        decision,

        "confidence_score":
        avg_confidence,

        "matched_conditions":
        matched_conditions,

        "missing_requirements":
        missing_requirements,

        "provider_explanation":
        provider_explanation,

        "patient_explanation":
        patient_explanation,

        "xai_reasoning":
        xai_reasoning,
    }