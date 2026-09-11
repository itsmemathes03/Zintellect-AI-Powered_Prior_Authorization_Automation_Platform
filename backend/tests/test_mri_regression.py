"""
MRI Section 3.6 Regression Tests A-E
Validates that the policy validation correctly enforces Section 3.6 requirements.
"""
import sys, os

try:
    __import__("pysqlite3")
    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.db import SessionLocal
from app.models.policy_model import InsurancePolicy
from app.services.policy_extraction_service import extract_policy_rules
from app.services.policy_matcher import match_policy_requirements
from app.services.document_classifier import classify_document


def _load_policy_rules():
    db = SessionLocal()
    p = db.query(InsurancePolicy).first()
    text = p.policy_text
    idx = text.find("3.6")
    end_idx = text.find("3.7", idx)
    section = text[idx:end_idx]
    scoped = extract_policy_rules(section)
    db.close()
    return {
        "policy_id": str(p.id),
        "procedure": p.procedure_name,
        "policy_text": section,
        "required_documents": scoped["required_documents"],
        "required_conditions": scoped["required_conditions"],
        "required_evidence": scoped.get("required_evidence", []),
        "match_score": 0.95,
        "total_chunks": 5,
    }


POLICY_RULES = _load_policy_rules()


def _match(entities, uploaded):
    return match_policy_requirements(entities, uploaded, POLICY_RULES)


def _missing(result):
    return [m.lower() for m in result.get("missing_requirements", [])]


# ============================================
# TEST A: radiology_report only
# ============================================
def test_a_radiology_report_only():
    """A single radiology_report should NOT satisfy prior_imaging_report or conservative_workup."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "",
        "medications": [],
        "full_clinical_text": "Brain MRI performed. Findings: no acute abnormality.",
    }
    result = _match(entities, ["radiology_report"])
    m = _missing(result)

    assert result["decision"] != "Approved", f"Should NOT be Approved, got {result['decision']}"
    assert "radiologist_referral" in m, "radiologist_referral should be missing"
    assert "prior_imaging_report" in m, "prior_imaging_report should be missing"
    assert "clinical_notes" in m, "clinical_notes should be missing"
    assert "lab_results" in m, "lab_results should be missing"
    assert "conservative_workup" not in POLICY_RULES["required_documents"], \
        "conservative_workup should NOT be a document requirement"


# ============================================
# TEST B: neurological + lab + radiology
# ============================================
def test_b_neuro_lab_radiology():
    """neurological_exam_report -> clinical_notes, lab_results direct, radiology_report does NOT satisfy prior_imaging."""
    entities = {
        "diagnosis": "Recurrent migraine with aura ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["severe headache", "visual disturbance"],
        "treatment_history": "Prior x-ray inconclusive",
        "medications": [],
        "full_clinical_text": (
            "ICD-10 G43.1. Prior x-ray inconclusive. "
            "Lab results eGFR 85. Neurological findings: motor weakness."
        ),
    }
    result = _match(entities, ["neurological_exam_report", "lab_results", "radiology_report"])
    m = _missing(result)

    assert result["decision"] != "Approved", f"Should NOT be Approved, got {result['decision']}"
    assert "clinical_notes" not in m, "clinical_notes should be satisfied via neurological alias"
    assert "lab_results" not in m, "lab_results should be satisfied directly"
    assert "radiologist_referral" in m, "radiologist_referral should still be missing"
    assert "prior_imaging_report" in m, "prior_imaging_report should still be missing"
    assert "icd-10 diagnosis code present" not in m, "ICD-10 evidence should be satisfied"
    assert "prior lower-cost imaging inconclusive" not in m, "Prior imaging evidence should be satisfied"


# ============================================
# TEST C: Complete MRI request
# ============================================
def test_c_complete_mri():
    """All 4 required documents + all evidence -> Approved."""
    entities = {
        "diagnosis": "Recurrent migraine with aura ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["severe headache", "visual disturbance", "numbness in left hand"],
        "treatment_history": "Prior x-ray of skull was inconclusive",
        "medications": [],
        "full_clinical_text": (
            "ICD-10 diagnosis code G43.1 documented. "
            "Prior x-ray of skull performed on 2026-01-15 was inconclusive, no definitive diagnosis. "
            "Radiologist referral order form with CPT code 70553 attached. "
            "Physician clinical notes included. "
            "Prior imaging report from January 2026 showing inconclusive results. "
            "Lab results: eGFR 85 mL/min, renal function normal for contrast."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)

    assert result["decision"] == "Approved", f"Should be Approved, got {result['decision']}"
    assert len(m) == 0, f"Should have no missing requirements, got {m}"
    assert result["confidence_score"] >= 75, f"Confidence should be >= 75, got {result['confidence_score']}"


# ============================================
# TEST D: Generic referral letter
# ============================================
def test_d_generic_referral():
    """A generic referral_letter must NOT satisfy radiologist_referral."""
    doc_type = classify_document(
        "Referred to neurologist for evaluation. Referral letter to specialist. Consult requested."
    )
    assert doc_type == "referral_letter", f"Classifier should return referral_letter, got {doc_type}"

    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "",
        "medications": [],
        "full_clinical_text": "Referred to neurologist for evaluation. ICD-10 G43.1.",
    }
    result = _match(entities, ["referral_letter"])
    m = _missing(result)

    assert "radiologist_referral" in m, "radiologist_referral should be missing"
    assert result["decision"] != "Approved", f"Should NOT be Approved, got {result['decision']}"


# ============================================
# TEST E: Current radiology report
# ============================================
def test_e_current_radiology():
    """A current radiology_report must NOT satisfy prior_imaging_report."""
    doc_type = classify_document(
        "Brain MRI findings: no acute abnormality. Impression: normal study. Radiology report."
    )
    assert doc_type == "radiology_report", f"Classifier should return radiology_report, got {doc_type}"

    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "",
        "medications": [],
        "full_clinical_text": "Brain MRI findings: no acute abnormality. Impression: normal study.",
    }
    result = _match(entities, ["radiology_report"])
    m = _missing(result)

    assert "prior_imaging_report" in m, "prior_imaging_report should be missing"
    assert result["decision"] != "Approved", f"Should NOT be Approved, got {result['decision']}"


# ============================================
# TEST F: Classifier distinguishes new types
# ============================================
def test_f_classifier_distinguishes_types():
    """Classifier correctly identifies radiologist_referral vs referral_letter vs radiology_report vs prior_imaging."""
    # Radiologist order form -> radiologist_referral
    t1 = classify_document(
        "MRI order form. CPT code 70553. Body part: brain. Laterality: bilateral. "
        "Contrast: yes. Ordering physician: Dr. Smith. Radiology order."
    )
    assert t1 == "radiologist_referral", f"Expected radiologist_referral, got {t1}"

    # Generic referral -> referral_letter (NOT radiologist_referral)
    t2 = classify_document(
        "Referral letter. Referred to neurologist for evaluation. Consult requested."
    )
    assert t2 == "referral_letter", f"Expected referral_letter, got {t2}"

    # Current MRI report -> radiology_report (NOT prior_imaging_report)
    t3 = classify_document(
        "Brain MRI findings: no acute abnormality. Impression: normal study. Radiology report."
    )
    assert t3 == "radiology_report", f"Expected radiology_report, got {t3}"

    # Prior imaging report -> prior_imaging_report (NOT radiology_report)
    t4 = classify_document(
        "Prior x-ray report from 2025-06-15. Previous imaging: skull x-ray inconclusive. "
        "Comparison with prior study. History of imaging: prior ultrasound."
    )
    assert t4 == "prior_imaging_report", f"Expected prior_imaging_report, got {t4}"
