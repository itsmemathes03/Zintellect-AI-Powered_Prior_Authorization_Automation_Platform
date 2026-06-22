def evaluate_prior_authorization(entities):

    diagnosis = str(
        entities.get("diagnosis", "")
    ).lower()

    procedure_requested = str(
        entities.get(
            "procedure_requested",
            ""
        )
    ).lower()

    treatment_history = entities.get(
        "treatment_history",
        {}
    )

    # MRI PRIOR AUTHORIZATION RULE
    if "mri" in procedure_requested:

        # HANDLE DICTIONARY FORMAT
        if isinstance(treatment_history, dict):

            if (
                "physical_therapy"
                in treatment_history
            ):

                return {

                    "decision": "Approved",

                    "reason":
                    "Patient completed conservative therapy before MRI request."
                }

        # HANDLE STRING FORMAT
        elif isinstance(
            treatment_history,
            str
        ):

            if (
                "physical therapy"
                in treatment_history.lower()
            ):

                return {

                    "decision": "Approved",

                    "reason":
                    "Patient completed conservative therapy before MRI request."
                }

        return {

            "decision":
            "Pending Information",

            "reason":
            "Physical therapy history missing for MRI authorization."
        }

    # DEFAULT CASE
    return {

        "decision":
        "Manual Review",

        "reason":
        "Insufficient policy information available."
    }