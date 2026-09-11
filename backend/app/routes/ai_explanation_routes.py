from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from app.services.gemini_service import generate_ai_explanation


router = APIRouter(prefix="/ai", tags=["AI Explanation"])


# =====================================================
# REQUEST / RESPONSE SCHEMAS
# =====================================================


class ExplanationRequest(BaseModel):
    """Input: structured decision data from the authorization pipeline."""

    decision: str = Field(
        ..., description="Authorization decision: Approved, Denied, or Manual Review"
    )
    procedure: str = Field(
        ..., description="Name of the medical procedure"
    )
    clinical_summary: str = Field(
        ..., description="Summary of the patient's clinical information"
    )
    policy_criteria: List[str] = Field(
        default_factory=list,
        description="List of applicable policy criteria",
    )
    evidence: List[str] = Field(
        default_factory=list,
        description="Supporting clinical evidence submitted",
    )
    reasons: List[str] = Field(
        default_factory=list,
        description="Reasons for the decision (denial reasons, review triggers, etc.)",
    )


class ExplanationResponse(BaseModel):
    """Output: AI-generated explanation."""

    explanation: str
    model: str


# =====================================================
# POST /ai/explanation
# =====================================================


@router.post("/explanation", response_model=ExplanationResponse)
async def ai_explanation(req: ExplanationRequest):
    """Generate an AI-powered explanation for a prior authorization decision.

    The AI only explains the decision — it never changes, overrides,
    or questions the authorization outcome.
    """

    try:
        result = await generate_ai_explanation(
            decision=req.decision,
            procedure=req.procedure,
            clinical_summary=req.clinical_summary,
            policy_criteria=req.policy_criteria,
            evidence=req.evidence,
            reasons=req.reasons,
        )
        return ExplanationResponse(
            explanation=result["explanation"],
            model=result["model"],
        )

    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
