def detect_missing_evidence(entities):

    missing_items = []

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

    # DIAGNOSIS CHECK
    if diagnosis == "":

        missing_items.append(
            "Diagnosis information missing"
        )

    # MRI RULE CHECK
    if "mri" in procedure_requested:

        # HANDLE DICTIONARY FORMAT
        if isinstance(treatment_history, dict):

            if (
                "physical_therapy"
                not in treatment_history
            ):

                missing_items.append(
                    "Physical therapy history missing"
                )

        # HANDLE STRING FORMAT
        elif isinstance(
            treatment_history,
            str
        ):

            if (
                "physical therapy"
                not in treatment_history.lower()
            ):

                missing_items.append(
                    "Physical therapy history missing"
                )

        else:

            missing_items.append(
                "Physical therapy history missing"
            )

    return missing_items