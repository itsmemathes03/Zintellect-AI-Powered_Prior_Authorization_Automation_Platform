from __future__ import annotations

import os
import json

import google.generativeai as genai


# =====================================================
# GEMINI CONFIGURATION
# =====================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Configure the SDK once at import time
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# =====================================================
# SYSTEM INSTRUCTION
# =====================================================

SYSTEM_INSTRUCTION = """\
You are a senior clinical authorization review specialist writing
formal explanations for healthcare insurance prior-authorization
decisions. Your audience is licensed insurance providers and
utilization management reviewers.

Your task: Given a structured decision record, produce a
professional explanation of WHY this decision was reached. You
are explaining an existing decision — never making a new one.

OUTPUT STRUCTURE:
- Paragraph 1: State the decision and the procedure. Summarize
  the patient's clinical context as described in the clinical
  summary.
- Paragraph 2: Explain how the submitted clinical evidence maps
  to each applicable policy criterion. For each criterion, state
  whether it was satisfied and which piece of evidence supports
  that determination.
- Paragraph 3 (if Approved): Highlight the specific evidence
  that satisfies the policy requirements and why the request
  meets medical-necessity standards.
  (if Denied): Identify each policy criterion that was NOT
  satisfied, explain what evidence was missing or insufficient,
  and state what would be needed for reconsideration.
  (if Manual Review): Explain what triggered the need for manual
  review, which criteria could not be automatically adjudicated,
  and what additional information a human reviewer should
  evaluate.

RULES:
1. NEVER change, question, or second-guess the authorization
   decision. You are only explaining it.
2. NEVER invent clinical information, symptoms, diagnoses,
   policy requirements, or evidence not provided in the input.
3. ONLY reference the facts given: decision, procedure,
   clinical summary, policy criteria, evidence, and reasons.
4. Clearly connect clinical evidence to policy criteria using
   specific references (e.g., "the submitted physical therapy
   records demonstrate...").
5. Use formal healthcare and insurance industry language
   appropriate for a utilization management audience.
6. Return ONLY the explanation text — no headers, no bullet
   points, no markdown formatting, no meta-commentary, no
   labels like "Explanation:". Just plain paragraphs.
7. Write 2 to 4 paragraphs, approximately 150 to 350 words.
"""


# =====================================================
# BUILD USER MESSAGE
# =====================================================

def build_explanation_request(
    decision,
    procedure,
    clinical_summary,
    policy_criteria,
    evidence,
    reasons,
):
    """Build the user message payload for the Gemini API."""

    user_message = (
        f"Provide a detailed authorization decision explanation "
        f"for the following case.\n\n"
        f"DECISION: {decision}\n"
        f"PROCEDURE: {procedure}\n\n"
        f"CLINICAL SUMMARY:\n{clinical_summary}\n\n"
        f"APPLICABLE POLICY CRITERIA:\n"
    )

    for i, criterion in enumerate(policy_criteria, 1):
        user_message += f"{i}. {criterion}\n"

    user_message += "\nSUBMITTED CLINICAL EVIDENCE:\n"
    for i, item in enumerate(evidence, 1):
        user_message += f"{i}. {item}\n"

    if reasons:
        user_message += "\nDECISION REASONS:\n"
        for i, reason in enumerate(reasons, 1):
            user_message += f"{i}. {reason}\n"

    return user_message


# =====================================================
# GEMINI API CALL
# =====================================================

async def generate_ai_explanation(
    decision,
    procedure,
    clinical_summary,
    policy_criteria,
    evidence,
    reasons,
):
    """Call the Google Gemini API to generate a professional explanation.

    Returns a dict: {"explanation": "...", "model": "..."}
    Raises RuntimeError on API failure.
    """

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Please set it in your .env file."
        )

    user_message = build_explanation_request(
        decision=decision,
        procedure=procedure,
        clinical_summary=clinical_summary,
        policy_criteria=policy_criteria,
        evidence=evidence,
        reasons=reasons,
    )

    try:
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=SYSTEM_INSTRUCTION,
        )

        # Use generate_content_async for async compatibility
        response = await model.generate_content_async(
            user_message,
            generation_config=genai.GenerationConfig(
                temperature=0.4,
                max_output_tokens=1024,
            ),
        )

        explanation = response.text.strip()

        return {
            "explanation": explanation,
            "model": GEMINI_MODEL,
        }

    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")
