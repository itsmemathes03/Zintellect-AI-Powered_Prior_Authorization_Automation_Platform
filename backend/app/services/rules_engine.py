def evaluate_prior_authorization(entities, policy_rules=None):
    """Evaluate prior authorization requirements based on policy rules.

    If policy_rules is provided, the engine evaluates requirements
    from the policy's required_conditions and required_documents
    rather than hard-coded procedure-specific branches.

    When policy_rules is None, falls back to checking treatment
    history (backward-compatible legacy path).
    """

    diagnosis = str(
        entities.get("diagnosis", "")
    ).lower()

    treatment_history = entities.get(
        "treatment_history", {}
    )

    # -----------------------------------------------
    # POLICY-DRIVEN PATH
    # -----------------------------------------------
    if policy_rules is not None:

        required_conditions = [
            cond.strip().lower()
            for cond in policy_rules.get(
                "required_conditions", []
            )
            if cond and cond.strip()
        ]

        required_documents = [
            doc.strip().lower()
            for doc in policy_rules.get(
                "required_documents", []
            )
            if doc and doc.strip()
        ]

        # Check if physical therapy / conservative therapy
        # is a policy requirement
        needs_pt = any(
            "physical therapy" in c
            or "conservative therapy" in c
            or "treatment history" in c
            for c in required_conditions
        ) or any(
            "physical therapy" in d
            or "treatment history" in d
            for d in required_documents
        )

        if needs_pt:
            pt_found = _check_physical_therapy(
                treatment_history
            )

            if not pt_found:
                return {
                    "decision": "Pending Information",
                    "reason": "Physical therapy history missing."
                }

        if required_conditions or required_documents:
            return {
                "decision": "Manual Review",
                "reason": "Policy requirements require human evaluation."
            }

    # -----------------------------------------------
    # LEGACY PATH (no policy_rules)
    # -----------------------------------------------
    # Backward-compatible: check treatment history
    # without procedure-specific branching.
    pt_found = _check_physical_therapy(treatment_history)

    if pt_found:
        return {
            "decision": "Approved",
            "reason": "Patient completed conservative therapy."
        }

    # -----------------------------------------------
    # DEFAULT CASE
    # -----------------------------------------------
    return {
        "decision": "Manual Review",
        "reason": "Insufficient policy information available."
    }


def _check_physical_therapy(treatment_history):
    """Check if physical therapy evidence exists in treatment data."""
    if isinstance(treatment_history, dict):
        if "physical_therapy" in treatment_history:
            pt_info = treatment_history["physical_therapy"]
            if pt_info and (
                pt_info.get("duration")
                or pt_info.get("outcome")
                or pt_info.get("exercises")
            ):
                return True
    elif isinstance(treatment_history, str):
        if "physical therapy" in treatment_history.lower():
            return True
    return False
