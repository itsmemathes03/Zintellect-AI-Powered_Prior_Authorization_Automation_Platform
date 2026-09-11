"""
Deterministic chunk-ID assignment for insurance policies.

Stdlib-only on purpose: keeps the helper unit-testable without
pulling the ML stack (sentence-transformers / chromadb).
"""

import hashlib


def apply_deterministic_chunk_ids(chunks, policy_id, policy_text):
    """
    Assign stable chunk IDs of the form
    {policy_id}_{content_hash}_{index} plus policy metadata.

    Same policy text -> same IDs -> vector-store upsert is
    idempotent (no duplicate vectors across repeated matches).
    """

    content_hash = hashlib.sha256(
        (policy_text or "").encode("utf-8")
    ).hexdigest()[:16]

    for index, chunk in enumerate(chunks):

        chunk["chunk_id"] = (
            f"{policy_id}_{content_hash}_{index}"
        )

        chunk["policy_id"] = str(policy_id)

        chunk["document_type"] = "insurance_policy"

    return chunks
