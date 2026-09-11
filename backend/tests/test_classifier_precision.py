"""
Classifier Precision Tests A-I
Validates that radiologist_referral is only returned for genuine imaging orders.
"""
import sys, os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.document_classifier import classify_document


# ============================================
# TEST A: Clinical Physician Report
# Expected: clinical_notes or neurological_exam_report, NOT radiologist_referral
# ============================================
def test_a_clinical_physician_report():
    """Clinical Physician Report should NOT be radiologist_referral."""
    text = (
        "CLINICAL PHYSICIAN REPORT - NEUROLOGY\n"
        "Patient: Sarah Johnson\n"
        "HISTORY OF PRESENT ILLNESS:\n"
        "Patient presents with recurrent episodes of severe throbbing headache\n"
        "accompanied by visual disturbances and left-sided numbness.\n"
        "NEUROLOGICAL EXAMINATION:\n"
        "- Cranial nerves: intact\n"
        "- Motor strength: 4/5 left upper extremity\n"
        "- Reflexes: hyperreflexia left side\n"
        "ASSESSMENT:\n"
        "Recurrent migraine with aura.\n"
        "ICD-10 diagnosis code: G43.109.\n"
        "PLAN:\n"
        "MRI Brain with and without contrast recommended.\n"
        "Prior authorization requested for MRI Brain with and without contrast."
    )
    doc_type = classify_document(text)
    assert doc_type in ("neurological_exam_report", "clinical_notes"), \
        f"Expected neurological_exam_report or clinical_notes, got {doc_type}"


# ============================================
# TEST B: Laboratory Report
# Expected: lab_results
# ============================================
def test_b_laboratory_report():
    """Laboratory Report should classify as lab_results."""
    text = (
        "LABORATORY REPORT - NEUROLOGY\n"
        "Patient: Sarah Johnson\n"
        "COMPLETE BLOOD COUNT (CBC):\n"
        "- WBC: 6.8 x10^3/uL\n"
        "- Hemoglobin: 13.2 g/dL\n"
        "BASIC METABOLIC PANEL:\n"
        "- Glucose: 92 mg/dL\n"
        "- Creatinine: 0.8 mg/dL\n"
        "- eGFR: 98 mL/min/1.73m2\n"
        "RENAL FUNCTION FOR CONTRAST:\n"
        "- eGFR: 98 mL/min/1.73m2\n"
        "- Serum creatinine: 0.8 mg/dL\n"
        "Lab results are within normal limits."
    )
    doc_type = classify_document(text)
    assert doc_type == "lab_results", f"Expected lab_results, got {doc_type}"


# ============================================
# TEST C: Current Radiology Imaging Report
# Expected: radiology_report, NOT radiologist_referral
# ============================================
def test_c_current_radiology_report():
    """Current Radiology Imaging Report should NOT be radiologist_referral."""
    text = (
        "RADIOLOGY IMAGING REPORT\n"
        "Facility: City General Hospital\n"
        "Radiology Department\n"
        "Ordering Physician: Dr. Michael Chen\n"
        "EXAMINATION:\n"
        "CT Brain without contrast\n"
        "FINDINGS:\n"
        "- No acute intracranial abnormality\n"
        "- No mass lesion or midline shift\n"
        "IMPRESSION:\n"
        "Normal CT brain without contrast.\n"
        "RECOMMENDATION:\n"
        "Given the inconclusive CT findings, MRI Brain recommended.\n"
        "Prior CT was non-diagnostic for the clinical presentation.\n"
        "This CT scan represents prior imaging that was inconclusive."
    )
    doc_type = classify_document(text)
    assert doc_type in ("radiology_report", "prior_imaging_report"), \
        f"Expected radiology_report or prior_imaging_report, got {doc_type}"


# ============================================
# TEST D: Prior Imaging Report
# Expected: prior_imaging_report, NOT radiologist_referral
# ============================================
def test_d_prior_imaging_report():
    """Prior Imaging Report should classify as prior_imaging_report."""
    text = (
        "PRIOR IMAGING REPORT\n"
        "Patient: Sarah Johnson\n"
        "Previous x-ray of skull performed on 2026-01-15.\n"
        "Prior imaging: skull x-ray was inconclusive.\n"
        "Comparison with prior study from January 2026.\n"
        "History of imaging: prior ultrasound of head.\n"
        "No significant change from prior study.\n"
        "Earlier imaging from 2025-06-15 showed normal results."
    )
    doc_type = classify_document(text)
    assert doc_type == "prior_imaging_report", \
        f"Expected prior_imaging_report, got {doc_type}"


# ============================================
# TEST E: Genuine Radiologist Referral / Order Form
# Expected: radiologist_referral
# ============================================
def test_e_genuine_radiologist_referral():
    """Genuine Radiologist Referral / Order Form should classify as radiologist_referral."""
    text = (
        "RADIOLOGIST REFERRAL / ORDER FORM\n"
        "Ordering Physician: Dr. Michael Chen, MD\n"
        "Radiology Order for: MRI Brain\n"
        "CPT Code: 70553\n"
        "Body Part: Brain\n"
        "Laterality: Bilateral\n"
        "Contrast: Yes\n"
        "Clinical Indication: Recurrent migraine with aura\n"
        "This is an imaging order for MRI Brain with contrast."
    )
    doc_type = classify_document(text)
    assert doc_type == "radiologist_referral", \
        f"Expected radiologist_referral, got {doc_type}"


# ============================================
# TEST F: Generic Referral Letter
# Expected: referral_letter, NOT radiologist_referral
# ============================================
def test_f_generic_referral_letter():
    """Generic Referral Letter should NOT be radiologist_referral."""
    text = (
        "REFERRAL LETTER\n"
        "Date: August 25, 2026\n"
        "Dear Colleague,\n"
        "I am referring Sarah Johnson for specialist consultation.\n"
        "Referred to neurologist for evaluation of recurrent headaches.\n"
        "Consult requested for neurological assessment.\n"
        "Referred for evaluation of migraine symptoms.\n"
        "Thank you for your assistance."
    )
    doc_type = classify_document(text)
    assert doc_type == "referral_letter", \
        f"Expected referral_letter, got {doc_type}"


# ============================================
# TEST G: Document with only "prior authorization"
# Expected: NOT radiologist_referral
# ============================================
def test_g_prior_authorization_only():
    """Document containing only 'prior authorization' should NOT be radiologist_referral."""
    text = (
        "INSURANCE PRIOR AUTHORIZATION REQUEST\n"
        "Patient: Sarah Johnson\n"
        "Insurance Provider: HealthShield\n"
        "Procedure: MRI Brain\n"
        "Prior authorization requested.\n"
        "Insurance referral submitted.\n"
        "Payer policy requires prior authorization.\n"
        "Coverage criteria must be met."
    )
    doc_type = classify_document(text)
    assert doc_type != "radiologist_referral", \
        f"Should NOT be radiologist_referral, got {doc_type}"


# ============================================
# TEST H: Document with "Ordering Physician" but no imaging order
# Expected: NOT radiologist_referral
# ============================================
def test_h_ordering_physician_no_order():
    """'Ordering Physician' alone should NOT make a document radiologist_referral."""
    text = (
        "DIAGNOSTIC IMAGING REPORT\n"
        "Ordering Physician: Dr. Michael Chen\n"
        "EXAMINATION: CT Brain without contrast\n"
        "FINDINGS: Normal CT brain.\n"
        "IMPRESSION: No acute abnormality.\n"
        "RECOMMENDATION: MRI Brain recommended."
    )
    doc_type = classify_document(text)
    assert doc_type != "radiologist_referral", \
        f"Should NOT be radiologist_referral, got {doc_type}"


# ============================================
# TEST I: Genuine MRI order with CPT + body part + laterality + contrast
# Expected: radiologist_referral
# ============================================
def test_i_genuine_mri_order():
    """Genuine MRI order with CPT code should classify as radiologist_referral."""
    text = (
        "IMAGING ORDER\n"
        "Procedure: MRI Brain with and without contrast\n"
        "CPT Code: 70553\n"
        "Body Part: Brain\n"
        "Laterality: Bilateral\n"
        "Contrast: Yes - gadolinium\n"
        "Ordering Physician: Dr. Michael Chen, MD\n"
        "Clinical Indication: Recurrent migraine with aura.\n"
        "Radiology order submitted."
    )
    doc_type = classify_document(text)
    assert doc_type == "radiologist_referral", \
        f"Expected radiologist_referral, got {doc_type}"
