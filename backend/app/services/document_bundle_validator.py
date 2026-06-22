def validate_document_bundle(
    procedure_requested,
    uploaded_document_types
):

    missing_documents = []

    # HANDLE AI LIST OUTPUT
    if isinstance(procedure_requested, list):

        procedure_requested = " ".join(
            procedure_requested
        )

    procedure_requested = (
        procedure_requested.lower()
    )

    # MRI WORKFLOW REQUIREMENTS
    if "mri" in procedure_requested:

        required_documents = [

            "clinical_notes",

            "physical_therapy_history",

            "lab_results"
        ]

        for doc in required_documents:

            if doc not in uploaded_document_types:

                missing_documents.append(doc)

    return missing_documents