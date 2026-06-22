import json

from sqlalchemy.orm import Session

from app.models.policy_model import (
    InsurancePolicy
)


def load_policy_from_db(

    db: Session,

    procedure_requested
):

    if not procedure_requested:

        return {

            "procedure": "unknown",

            "required_documents": [],

            "required_conditions": []
        }

    procedure_text = str(
        procedure_requested
    ).lower()

    # ==========================================
    # SEARCH MATCHING POLICY
    # ==========================================

    policies = db.query(
        InsurancePolicy
    ).all()

    for policy in policies:

        stored_procedure = str(
            policy.procedure_name
        ).lower()

        # SIMPLE SEMANTIC MATCH

        if (

            "mri" in procedure_text

            and

            "mri" in stored_procedure

        ):

            return {

                "procedure":
                stored_procedure,

                "required_documents":
                json.loads(
                    policy.required_documents
                ),

                "required_conditions":
                json.loads(
                    policy.required_conditions
                )
            }

        if stored_procedure in procedure_text:

            return {

                "procedure":
                stored_procedure,

                "required_documents":
                json.loads(
                    policy.required_documents
                ),

                "required_conditions":
                json.loads(
                    policy.required_conditions
                )
            }

    # ==========================================
    # NO MATCH
    # ==========================================

    return {

        "procedure": "unknown",

        "required_documents": [],

        "required_conditions": []
    }