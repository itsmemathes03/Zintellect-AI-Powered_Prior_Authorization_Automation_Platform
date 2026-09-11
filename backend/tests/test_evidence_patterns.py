"""
Evidence Pattern Matching Tests
Validates that normalize_text(pattern) matches normalized clinical text
for all 6 critical evidence patterns in the MRI Section 3.6 rules.
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
# TEST 1: ICD-10 evidence matches "icd 10"
# ============================================
def test_icd10_evidence_with_hyphen():
    """ICD-10 G43.1 in clinical text should satisfy ICD-10 evidence."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "",
        "full_clinical_text": (
            "ICD-10 G43.1 diagnosis code documented. "
            "Prior x-ray inconclusive. Radiologist referral order form attached. "
            "Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "icd-10 diagnosis code present" not in m, \
        f"ICD-10 evidence should be satisfied, missing={m}"


# ============================================
# TEST 2: x-ray evidence (hyphenated)
# ============================================
def test_xray_evidence_hyphenated():
    """'x-ray' in clinical text should match the 'x-ray' pattern (via normalization)."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Prior x-ray inconclusive",
        "full_clinical_text": (
            "Prior x-ray of skull was inconclusive. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "prior lower-cost imaging inconclusive" not in m, \
        f"Prior imaging evidence should be satisfied via x-ray pattern, missing={m}"


# ============================================
# TEST 3: x-ray evidence (no hyphen)
# ============================================
def test_xray_evidence_no_hyphen():
    """'x ray' (no hyphen) in clinical text should also match the 'x-ray' pattern."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Prior x ray inconclusive",
        "full_clinical_text": (
            "Prior x ray of skull was inconclusive. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "prior lower-cost imaging inconclusive" not in m, \
        f"Prior imaging evidence should be satisfied via x ray pattern, missing={m}"


# ============================================
# TEST 4: ultrasound evidence
# ============================================
def test_ultrasound_evidence():
    """'ultrasound' in clinical text should satisfy prior imaging evidence."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Prior ultrasound inconclusive",
        "full_clinical_text": (
            "Prior ultrasound was inconclusive. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "prior lower-cost imaging inconclusive" not in m, \
        f"Prior imaging evidence should be satisfied via ultrasound, missing={m}"


# ============================================
# TEST 5: inconclusive evidence (direct)
# ============================================
def test_inconclusive_evidence():
    """'inconclusive' in clinical text should satisfy prior imaging evidence."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Imaging was inconclusive",
        "full_clinical_text": (
            "Imaging was inconclusive. No definitive diagnosis. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "prior lower-cost imaging inconclusive" not in m, \
        f"Prior imaging evidence should be satisfied via inconclusive, missing={m}"


# ============================================
# TEST 6: new symptoms evidence (symlink corruption was breaking this)
# ============================================
def test_new_symptoms_evidence():
    """'new symptoms' should NOT be corrupted by 'pt' synonym and should match."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Repeat imaging justified: new symptoms",
        "is_repeat_imaging": True,
        "full_clinical_text": (
            "Repeat imaging justified: new symptoms since last scan. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "repeat imaging justification if within 90 days" not in m, \
        f"Repeat imaging evidence should be satisfied via new symptoms, missing={m}"


# ============================================
# TEST 7: post-treatment evidence (hyphen was breaking this)
# ============================================
def test_post_treatment_evidence():
    """'post-treatment' should match after normalization strips the hyphen."""
    entities = {
        "diagnosis": "Recurrent migraine ICD-10 G43.1",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "Repeat imaging: post-treatment progression",
        "is_repeat_imaging": True,
        "full_clinical_text": (
            "Repeat imaging needed: post-treatment disease progression. "
            "Radiologist referral order form attached. Lab results eGFR 85."
        ),
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "repeat imaging justification if within 90 days" not in m, \
        f"Repeat imaging evidence should be satisfied via post-treatment, missing={m}"


# ============================================
# TEST 8: No evidence at all -> all mandatory evidence missing
# ============================================
def test_no_evidence_all_missing():
    """With no clinical evidence, all mandatory evidence rules should be missing."""
    entities = {
        "diagnosis": "Migraine",
        "procedure_requested": "MRI Brain Scan",
        "symptoms": ["headache"],
        "treatment_history": "",
        "full_clinical_text": "Patient has headache. No additional documentation.",
    }
    result = _match(entities, ["clinical_notes", "prior_imaging_report", "radiologist_referral", "lab_results"])
    m = _missing(result)
    assert "icd-10 diagnosis code present" in m, "ICD-10 should be missing"
    assert "prior lower-cost imaging inconclusive" in m, "Prior imaging should be missing"
    assert result["decision"] != "Approved", "Should not be Approved without evidence"
