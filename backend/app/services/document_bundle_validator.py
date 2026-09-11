def validate_document_bundle(
    procedure_requested,
    uploaded_document_types,
    policy_rules=None
):
    """Validate that uploaded documents satisfy policy requirements.

    If policy_rules is provided, document validation is driven
    entirely by the policy's required_documents list.  This makes
    the validator procedure-agnostic -- MRI, CT, Knee, or any future
    procedure is handled through the same data-driven path.

    When policy_rules is None the function falls back to an
    empty list (no hard-coded procedure branches), preserving
    backward compatibility while removing procedure-specific logic.
    """

    missing_documents = []

    # -----------------------------------------------
    # POLICY-DRIVEN PATH (preferred)
    # -----------------------------------------------
    if policy_rules is not None:

        required_documents = [
            doc.strip()
            for doc in policy_rules.get(
                "required_documents", []
            )
            if doc and doc.strip()
        ]

        normalised_uploads = [
            doc.lower().strip().replace("_", " ")
            if isinstance(doc, str)
            else str(doc).lower().strip().replace("_", " ")
            for doc in uploaded_document_types
        ]

        for required_doc in required_documents:

            normalised_req = required_doc.lower().strip().replace("_", " ")

            if normalised_req not in normalised_uploads:
                missing_documents.append(required_doc)

        return missing_documents

    # -----------------------------------------------
    # FALLBACK -- no policy rules supplied
    # -----------------------------------------------
    return missing_documents
