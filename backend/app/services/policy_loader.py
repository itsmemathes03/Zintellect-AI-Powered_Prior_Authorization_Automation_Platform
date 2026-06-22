import json
from app.database.db import SessionLocal
from app.models.policy_model import (
    InsurancePolicy
)

from app.services.semantic_matcher import (
    semantic_match
)

from app.services.text_normalizer import (
    normalize_text
)

from app.services.rag.chunking_service import (
    create_chunks,
    create_hierarchical_policy_chunks
)

from app.services.embeddings.embedding_service import (
    generate_embeddings
)

from app.services.retrieval.vector_db_service import (
    store_policy_embeddings
)


def load_policy(procedure_name):

    db = SessionLocal()

    try:

        # =====================================
        # SAFETY CHECK
        # =====================================

        if not procedure_name:

            return {
                "procedure": "unknown"
            }

        # =====================================
        # HANDLE LIST OUTPUT
        # =====================================

        if isinstance(procedure_name, list):

            procedure_name = " ".join(
                procedure_name
            )

        normalized_input = normalize_text(
            procedure_name
        )

        print(
            "\n=== POLICY SEARCH DEBUG ==="
        )

        print(
            "Requested Procedure:",
            normalized_input
        )

        # =====================================
        # LOAD ALL POLICIES
        # =====================================

        policies = db.query(
            InsurancePolicy
        ).all()

        if not policies:

            print("No policies found")

            return {
                "procedure": "unknown"
            }

        # =====================================
        # FIND BEST SEMANTIC MATCH
        # =====================================

        best_policy = None
        best_score = 0

        for policy in policies:

            stored_procedure = normalize_text(
                policy.procedure_name
            )

            score = semantic_match(
                normalized_input,
                stored_procedure
            )

            print(
                f"Matching "
                f"{normalized_input}"
                f" <-> "
                f"{stored_procedure}"
                f" = {score}"
            )

            if score > best_score:

                best_score = score
                best_policy = policy

        # =====================================
        # MATCH THRESHOLD
        # =====================================

        if best_score < 0.55:

            print(
                "No policy matched"
            )

            return {
                "procedure": "unknown"
            }

        # =====================================
        # SUCCESS
        # =====================================

        print(
            "Matched Policy:",
            best_policy.procedure_name
        )

        print(
            "Confidence:",
            best_score
        )

        # =====================================
        # POLICY CHUNKING
        # =====================================

        policy_text = (
            best_policy.policy_text
        )

        policy_chunks = create_chunks(
            text=policy_text,
            document_type="insurance_policy"
        )

        # =====================================
        # ADD METADATA
        # =====================================

        for chunk in policy_chunks:

            chunk["policy_id"] = str(
                best_policy.id
            )

            chunk["document_type"] = (
                "insurance_policy"
            )

        # =====================================
        # GENERATE EMBEDDINGS
        # =====================================

        embedded_chunks = (
            generate_embeddings(
                policy_chunks,
                model_type="policy"
            )
        )

        # =====================================
        # STORE IN CHROMADB
        # =====================================

        store_policy_embeddings(
            embedded_chunks
        )

        return {

            "policy_id":
                str(
                    best_policy.id
                ),

            "procedure":
                best_policy.procedure_name,

            "policy_text":
                best_policy.policy_text,

            "required_documents":
                json.loads(
                    best_policy.required_documents
                ),

            "required_conditions":
                json.loads(
                    best_policy.required_conditions
                ),

            "match_score":
                round(
                    best_score,
                    2
                ),

            "total_chunks":
                len(
                    policy_chunks
                )
        }

    except Exception as error:

        print(
            "Policy Loader Error:",
            str(error)
        )

        return {
            "procedure": "unknown"
        }

    finally:

        db.close()