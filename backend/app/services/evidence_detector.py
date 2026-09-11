def detect_missing_evidence(entities, policy_rules=None):
    """Detect missing clinical evidence based on policy requirements.

    If policy_rules is provided, the detector evaluates which
    required_conditions from the policy are not satisfied by the
    extracted clinical entities.  This makes evidence detection
    policy-driven rather than procedure-specific.

    When policy_rules is None, only the generic diagnosis check
    is performed (no hard-coded procedure branches).
    """

    missing_items = []

    diagnosis = str(
        entities.get("diagnosis", "")
    ).lower()

    treatment_history = entities.get(
        "treatment_history", {}
    )

    # -----------------------------------------------
    # GENERIC DIAGNOSIS CHECK
    # -----------------------------------------------
    if diagnosis == "":

        missing_items.append(
            "Diagnosis information missing"
        )

    # -----------------------------------------------
    # POLICY-DRIVEN CONDITION CHECK
    # -----------------------------------------------
    # If policy_rules supplies required_conditions, check
    # whether each condition is evidenced in the clinical text.
    if policy_rules is not None:

        required_conditions = [
            cond.strip()
            for cond in policy_rules.get(
                "required_conditions", []
            )
            if cond and cond.strip()
        ]

        full_text = str(
            entities.get("full_clinical_text", "")
        ).lower()

        symptoms = entities.get("symptoms", [])
        symptoms_text = " ".join(
            str(s).lower() for s in symptoms
        )

        combined = f"{diagnosis} {symptoms_text} {full_text}"

        # Map condition labels to evidence phrases that
        # satisfy them.  This is a policy-agnostic bridge
        # between requirement labels and clinical text.
        condition_evidence = {
            "physical therapy history": [
                "physical therapy",
                "pt completed",
                "conservative therapy",
                "rehabilitation",
                "therapy sessions",
            ],
            "muscular weakness": [
                "muscle weakness",
                "muscular weakness",
                "motor weakness",
            ],
            "neurological deficits": [
                "neurological deficit",
                "neurological findings",
                "motor weakness",
                "numbness",
                "tingling",
            ],
        }

        for condition in required_conditions:

            condition_lower = condition.lower()

            # Check if the condition label itself appears
            if condition_lower in combined:
                continue

            # Check known evidence phrases for this condition
            evidence_phrases = condition_evidence.get(
                condition_lower, []
            )

            if any(
                phrase in combined
                for phrase in evidence_phrases
            ):
                continue

            # Condition not evidenced
            missing_items.append(condition)

    # -----------------------------------------------
    # TREATMENT HISTORY CHECK (generic, policy-driven)
    # -----------------------------------------------
    # If the policy requires physical therapy history,
    # verify it exists in the treatment data.
    if policy_rules is not None:

        required_conditions = [
            cond.strip().lower()
            for cond in policy_rules.get(
                "required_conditions", []
            )
            if cond and cond.strip()
        ]

        needs_pt = any(
            "physical therapy" in c
            or "conservative therapy" in c
            for c in required_conditions
        )

        if needs_pt:
            if isinstance(treatment_history, dict):
                if "physical_therapy" not in treatment_history:
                    missing_items.append(
                        "Physical therapy history missing"
                    )
            elif isinstance(treatment_history, str):
                if "physical therapy" not in treatment_history.lower():
                    missing_items.append(
                        "Physical therapy history missing"
                    )
            else:
                missing_items.append(
                    "Physical therapy history missing"
                )

    return missing_items
