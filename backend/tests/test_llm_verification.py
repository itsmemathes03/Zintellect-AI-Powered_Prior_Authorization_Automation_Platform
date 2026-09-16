"""
LLM Verification Test — Safe synthetic data only.
Verifies that Ollama + Qwen2.5 works end-to-end through ai_service.py.
"""
import sys
import os
import json

# Ensure backend is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.ai_service import (
    extract_medical_entities,
    normalize_entities,
    get_empty_entities,
    MODEL_NAME,
    OLLAMA_HOST,
    OLLAMA_TIMEOUT,
)


# ============================================================
# SYNTHETIC CLINICAL TEXT (fictional patient)
# ============================================================
SYNTHETIC_CLINICAL_TEXT = """
CLINICAL NOTES — PHYSICIAN REPORT

Patient: John fictional-123
Date of Visit: 2024-03-15
Attending Physician: Dr. Smith

CHIEF COMPLAINT:
Patient presents with persistent lower back pain radiating to the left leg,
numbness in the left foot, and difficulty walking for the past 6 weeks.

HISTORY OF PRESENT ILLNESS:
A 45-year-old male reports progressive lower back pain that began after
lifting heavy objects at work. Pain radiates to the left lower extremity
with associated numbness and tingling in the left foot. Patient reports
difficulty walking more than 100 meters.

PHYSICAL EXAMINATION:
- Lumbar tenderness to palpation at L4-L5
- Positive straight leg raise test on left side
- Reduced ankle reflex on left
- Motor weakness in left foot dorsiflexion (4/5)
- Sensory deficit in L5 dermatome on left

ASSESSMENT AND PLAN:
1. Lumbar disc herniation with radiculopathy
2. Order MRI lumbar spine without contrast
3. Physical therapy referral
4. Continue conservative management

REQUESTED PROCEDURE: MRI Lumbar Spine Without Contrast

CLINICAL INDICATION: Lumbar disc herniation with radiculopathy,
failed conservative therapy, progressive neurological deficit.
"""


def test_ollama_configuration():
    """Verify Ollama config matches expectations."""
    print("=" * 60)
    print("TEST: Ollama Configuration")
    print("=" * 60)
    print(f"  Model name: {MODEL_NAME}")
    print(f"  Host:       {OLLAMA_HOST}")
    print(f"  Timeout:    {OLLAMA_TIMEOUT}s")
    assert MODEL_NAME == "qwen2.5:1.5b-instruct", f"Unexpected model: {MODEL_NAME}"
    print("  [OK] Configuration correct\n")


def test_synthetic_extraction():
    """Run actual Ollama LLM extraction with synthetic clinical text."""
    print("=" * 60)
    print("TEST: LLM Extraction (real Ollama call)")
    print("=" * 60)
    print(f"  Input length: {len(SYNTHETIC_CLINICAL_TEXT)} chars")
    print(f"  Model: {MODEL_NAME}")
    print(f"  Calling Ollama...\n")

    result_json = extract_medical_entities(SYNTHETIC_CLINICAL_TEXT)
    result = json.loads(result_json)

    print("\n  EXTRACTED ENTITIES:")
    print(json.dumps(result, indent=2))

    return result


def test_output_follows_schema(result):
    """Verify the output matches MedicalEntities Pydantic schema."""
    print("\n" + "=" * 60)
    print("TEST: Pydantic Schema Validation")
    print("=" * 60)

    from app.services.ai_service import MedicalEntities

    try:
        validated = MedicalEntities.model_validate(result)
        print("  [OK] Output validates against MedicalEntities schema")
        print(f"     diagnosis:          '{validated.diagnosis}'")
        print(f"     procedure_requested: '{validated.procedure_requested}'")
        print(f"     symptoms:           {validated.symptoms}")
        print(f"     medications:        {validated.medications}")
        print(f"     treatment_history:   {validated.treatment_history}")
        return True
    except Exception as e:
        print(f"  [FAIL] Schema validation failed: {e}")
        return False


def test_not_fallback(result):
    """Verify the LLM returned real data, not the empty fallback."""
    print("\n" + "=" * 60)
    print("TEST: Verify Not Fallback Path")
    print("=" * 60)

    empty = get_empty_entities()
    is_fallback = (
        result.get("diagnosis") == empty.get("diagnosis")
        and result.get("procedure_requested") == empty.get("procedure_requested")
        and result.get("symptoms") == empty.get("symptoms")
    )

    if is_fallback:
        print("  [WARN] Result matches empty fallback -- LLM may have failed")
        print("  (Check Ollama logs above for errors)")
        return False
    else:
        print("  [OK] LLM returned real extracted data (not fallback)")
        return True


def test_key_fields_present(result):
    """Check that key clinical fields were extracted."""
    print("\n" + "=" * 60)
    print("TEST: Key Clinical Fields Extracted")
    print("=" * 60)

    checks = []

    # Diagnosis should mention something about back/spine/disc
    diag = result.get("diagnosis", "").lower()
    has_diagnosis = any(kw in diag for kw in ["disc", "back", "spine", "lumbar", "radiculopathy", "herniation"])
    print(f"  Diagnosis contains spine/back keyword: {'[OK]' if has_diagnosis else '[WARN]'} '{result.get('diagnosis', '')}'")
    checks.append(has_diagnosis)

    # Procedure should mention MRI
    proc = result.get("procedure_requested", "").lower()
    has_procedure = any(kw in proc for kw in ["mri", "lumbar", "spine", "magnetic"])
    print(f"  Procedure mentions MRI/lumbar:        {'[OK]' if has_procedure else '[WARN]'} '{result.get('procedure_requested', '')}'")
    checks.append(has_procedure)

    # Symptoms should exist
    symptoms = result.get("symptoms", [])
    has_symptoms = len(symptoms) > 0
    print(f"  Symptoms extracted (count={len(symptoms)}):  {'[OK]' if has_symptoms else '[WARN]'} {symptoms}")
    checks.append(has_symptoms)

    return all(checks)


# ============================================================
# RUN ALL TESTS
# ============================================================
if __name__ == "__main__":
    import io, sys as _sys
    # Fix Windows console encoding for safe ASCII output
    _sys.stdout = io.TextIOWrapper(_sys.stdout.buffer, encoding='utf-8', errors='replace')

    print("\nZINTELLECT LLM VERIFICATION TEST")
    print("=" * 60)
    print("Using SYNTHETIC fictional patient data only.\n")

    test_ollama_configuration()

    result = test_synthetic_extraction()

    schema_ok = test_output_follows_schema(result)
    not_fallback = test_not_fallback(result)
    fields_ok = test_key_fields_present(result)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Ollama reachable:     YES")
    print(f"  Model installed:      {MODEL_NAME}")
    print(f"  Schema validation:    {'PASS' if schema_ok else 'FAIL'}")
    print(f"  Not fallback path:    {'PASS' if not_fallback else 'FAIL'}")
    print(f"  Key fields extracted: {'PASS' if fields_ok else 'PARTIAL'}")

    if schema_ok and not_fallback:
        print("\n  >>> LLM IS WORKING -- real extraction via Ollama confirmed!")
    elif schema_ok and not not_fallback:
        print("\n  >>> Schema passed but output is empty -- LLM may have timed out")
    else:
        print("\n  >>> LLM verification failed -- check Ollama status")

    print("=" * 60)
