"""
End-to-End Pipeline Trace: Neurology MRI Request
Tests three realistic Neurology PDFs through the complete pipeline.
"""
import sys, os, json

try:
    __import__("pysqlite3")
    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.text_normalizer import normalize_text
from app.services.document_classifier import classify_document
from app.services.policy_extraction_service import extract_policy_rules
from app.services.policy_matcher import match_policy_requirements
from app.database.db import SessionLocal
from app.models.policy_model import InsurancePolicy


# ============================================
# REALISTIC NEUROLOGY PDF CONTENT
# ============================================
# These simulate what OCR would extract from actual Neurology PDFs.
# Each is a realistic medical document for an MRI Brain request.

PDF1_CLINICAL_NOTES = """
CLINICAL PHYSICIAN REPORT - NEUROLOGY

Patient: Sarah Johnson
Date of Birth: March 12, 1982
Date of Visit: August 25, 2026
Referring Physician: Dr. Michael Chen, MD

HISTORY OF PRESENT ILLNESS:
Patient presents with recurrent episodes of severe throbbing headache
accompanied by visual disturbances and left-sided numbness. Symptoms
have been progressive over the past 3 months. Previous conservative
management with triptans and prophylactic medications has been
inadequate.

NEUROLOGICAL EXAMINATION:
- Cranial nerves: intact
- Motor strength: 4/5 left upper extremity
- Sensory: decreased sensation left hand
- Reflexes: hyperreflexia left side
- Coordination: mild intention tremor
- Gait: slightly unsteady

ASSESSMENT:
Recurrent migraine with aura, possible intracranial pathology.
ICD-10 diagnosis code: G43.109 - Migraine with aura, not intractable,
without status migrainosus.

PLAN:
MRI Brain with and without contrast recommended to rule out structural
abnormality. Prior CT scan was inconclusive. Patient has no implanted
devices. No contrast allergy.

RECOMMENDATION:
Prior authorization requested for MRI Brain with and without contrast.
""".strip()

PDF2_LABORATORY = """
LABORATORY REPORT - NEUROLOGY

Patient: Sarah Johnson
Date: August 20, 2026
Ordering Physician: Dr. Michael Chen

COMPLETE BLOOD COUNT (CBC):
- WBC: 6.8 x10^3/uL (normal)
- RBC: 4.5 x10^6/uL (normal)
- Hemoglobin: 13.2 g/dL (normal)
- Hematocrit: 39.5% (normal)
- Platelets: 245 x10^3/uL (normal)

BASIC METABOLIC PANEL:
- Glucose: 92 mg/dL (normal)
- BUN: 15 mg/dL (normal)
- Creatinine: 0.8 mg/dL (normal)
- eGFR: 98 mL/min/1.73m2 (normal)

RENAL FUNCTION FOR CONTRAST:
- eGFR: 98 mL/min/1.73m2
- Serum creatinine: 0.8 mg/dL
- No renal impairment. Safe for contrast administration.

THYROID FUNCTION:
- TSH: 2.4 mIU/L (normal)

NOTES:
Lab results are within normal limits. Renal function adequate for
IV contrast administration. No contraindications for MRI with contrast.
""".strip()

PDF3_RADIOLOGY = """
RADIOLOGY IMAGING REPORT

Facility: City General Hospital
Radiology Department
Report Date: August 18, 2026
Ordering Physician: Dr. Michael Chen

EXAMINATION:
CT Brain without contrast

CLINICAL INDICATION:
Recurrent headaches with visual disturbances. Rule out intracranial
pathology.

TECHNIQUE:
Axial images of the brain were obtained without IV contrast.

FINDINGS:
- No acute intracranial abnormality
- No mass lesion or midline shift
- No evidence of hemorrhage
- Ventricles are normal in size and configuration
- Gray-white matter differentiation is preserved
- No skull fracture

IMPRESSION:
Normal CT brain without contrast. No acute intracranial abnormality.

RECOMMENDATION:
Given the inconclusive CT findings and ongoing neurological symptoms,
MRI Brain with and without contrast is recommended for further
evaluation. Prior CT was non-diagnostic for the clinical presentation.

This CT scan represents prior imaging that was inconclusive, and MRI
is now warranted to complete the diagnostic workup.
""".strip()


# ============================================
# LOAD POLICY
# ============================================

def _load_policy():
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


POLICY_RULES = _load_policy()


# ============================================
# PIPELINE TRACE
# ============================================

def run_pipeline():
    print("=" * 80)
    print("END-TO-END PIPELINE TRACE: NEUROLOGY MRI REQUEST")
    print("=" * 80)
    print()

    # ---- STEP 1: Document Classification ----
    print("=" * 60)
    print("STEP 1: DOCUMENT CLASSIFICATION")
    print("=" * 60)

    pdfs = {
        "Clinical Physician Report": PDF1_CLINICAL_NOTES,
        "Laboratory Report": PDF2_LABORATORY,
        "Radiology Imaging Report": PDF3_RADIOLOGY,
    }

    uploaded_document_types = []
    combined_text = ""

    for name, text in pdfs.items():
        doc_type = classify_document(text)
        uploaded_document_types.append(doc_type)
        combined_text += "\n" + text
        print(f"\n  {name}:")
        print(f"    Length: {len(text)} chars")
        print(f"    Classifier output: {doc_type}")
        # Show score breakdown
        from app.services.text_normalizer import normalize_text
        norm = normalize_text(text)
        # Quick keyword check
        for kw in ["mri", "neurological findings", "eGFR", "prior imaging",
                    "radiology order", "cpt code", "inconclusive", "x-ray"]:
            if kw in norm:
                print(f"    Contains keyword: \"{kw}\"")

    print(f"\n  Combined uploaded_document_types: {uploaded_document_types}")
    print(f"  Combined text length: {len(combined_text)} chars")

    # ---- STEP 2: AI Entity Extraction (simulated) ----
    print()
    print("=" * 60)
    print("STEP 2: AI ENTITY EXTRACTION (simulated from clinical text)")
    print("=" * 60)

    # In production, this comes from extract_medical_entities() via Ollama.
    # Here we simulate what the AI would extract from these PDFs.
    entities = {
        "diagnosis": "Recurrent migraine with aura ICD-10 G43.109",
        "procedure_requested": "MRI Brain with and without contrast",
        "symptoms": [
            "severe throbbing headache",
            "visual disturbances",
            "left-sided numbness",
            "motor weakness",
            "hyperreflexia"
        ],
        "treatment_history": "Prior CT scan inconclusive. Triptans inadequate.",
        "medications": ["triptans", "prophylactic medications"],
        "full_clinical_text": combined_text[:8000],
        # Entity flags (would come from AI extraction in production)
        "is_repeat_imaging": False,
        "has_implanted_device": False,
        "contrast_used": True,  # "MRI with contrast" requested
    }

    print(f"  diagnosis: {repr(entities['diagnosis'])}")
    print(f"  procedure_requested: {repr(entities['procedure_requested'])}")
    print(f"  symptoms: {entities['symptoms']}")
    print(f"  treatment_history: {repr(entities['treatment_history'])}")
    print(f"  is_repeat_imaging: {entities['is_repeat_imaging']}")
    print(f"  has_implanted_device: {entities['has_implanted_device']}")
    print(f"  contrast_used: {entities['contrast_used']}")

    # ---- STEP 3: Policy Search ----
    print()
    print("=" * 60)
    print("STEP 3: POLICY SEARCH")
    print("=" * 60)

    print(f"  Matched policy procedure: {POLICY_RULES['procedure']}")
    print(f"  Match score: {POLICY_RULES['match_score']}")

    # ---- STEP 4: Section Scoping ----
    print()
    print("=" * 60)
    print("STEP 4: SECTION SCOPING (Section 3.6)")
    print("=" * 60)

    # ---- STEP 5: Required Documents ----
    print()
    print("=" * 60)
    print("STEP 5: REQUIRED DOCUMENTS")
    print("=" * 60)

    for doc in POLICY_RULES["required_documents"]:
        print(f"  - {doc}")

    # ---- STEP 6: Required Evidence ----
    print()
    print("=" * 60)
    print("STEP 6: REQUIRED EVIDENCE RULES")
    print("=" * 60)

    for ev in POLICY_RULES.get("required_evidence", []):
        cond = f" (conditional on: {ev['condition_key']})" if ev['condition_key'] else " (mandatory)"
        print(f"  - {ev['label']}{cond}")
        print(f"    Patterns: {ev['evidence_patterns']}")

    # ---- STEP 7: Policy Matching ----
    print()
    print("=" * 60)
    print("STEP 7: POLICY MATCHING")
    print("=" * 60)

    result = match_policy_requirements(entities, uploaded_document_types, POLICY_RULES)

    print(f"  Decision: {result['decision']}")
    print(f"  Confidence: {result['confidence_score']}")
    print(f"  Missing requirements: {result.get('missing_requirements', [])}")
    print(f"  Matched conditions: {result.get('matched_conditions', [])}")

    # ---- STEP 8: Detailed Evidence Trace ----
    print()
    print("=" * 60)
    print("STEP 8: DETAILED EVIDENCE TRACE")
    print("=" * 60)

    # Show what normalized text looks like
    diagnosis_norm = normalize_text(str(entities["diagnosis"]))
    symptoms_text = normalize_text(" ".join([str(s) for s in entities["symptoms"]]))
    treatment_text = normalize_text(str(entities["treatment_history"]))
    full_clinical_text = normalize_text(entities["full_clinical_text"])

    combined_clinical_text = normalize_text(f"""
{diagnosis_norm}
{symptoms_text}
{treatment_text}
{full_clinical_text}
""")

    print(f"\n  Combined clinical text (first 300 chars):")
    print(f"  {repr(combined_clinical_text[:300])}")

    # Check each evidence pattern against combined text
    print(f"\n  Evidence pattern matching detail:")
    for ev in POLICY_RULES.get("required_evidence", []):
        label = ev["label"]
        patterns = ev["evidence_patterns"]
        mandatory = ev["mandatory"]
        condition_key = ev.get("condition_key")

        # Check if conditional rule is active
        if not mandatory and condition_key:
            condition_met = bool(entities.get(condition_key))
            if not condition_met:
                print(f"\n  {label}: SKIPPED (condition '{condition_key}' not met)")
                continue

        # Check each pattern
        matched_patterns = []
        for p in patterns:
            norm_p = normalize_text(p)
            if norm_p in combined_clinical_text:
                matched_patterns.append(f"\"{p}\" (as \"{norm_p}\")")

        found = len(matched_patterns) > 0
        status = "SATISFIED" if found else "MISSING"
        print(f"\n  {label}: {status}")
        if found:
            print(f"    Matched by: {', '.join(matched_patterns)}")
        else:
            print(f"    None of the patterns found in clinical text")
            for p in patterns:
                norm_p = normalize_text(p)
                if norm_p in combined_clinical_text:
                    print(f"      \"{p}\" -> \"{norm_p}\": FOUND")
                else:
                    print(f"      \"{p}\" -> \"{norm_p}\": NOT FOUND")

    # ---- STEP 9: Document Matching Detail ----
    print()
    print("=" * 60)
    print("STEP 9: DOCUMENT MATCHING DETAIL")
    print("=" * 60)

    DOC_TYPE_ALIASES = {"neurological_exam_report": ["clinical_notes"]}
    satisfied_docs = set(normalize_text(d) for d in uploaded_document_types)
    for uploaded in uploaded_document_types:
        aliases = DOC_TYPE_ALIASES.get(uploaded, [])
        for alias in aliases:
            satisfied_docs.add(normalize_text(alias))

    print(f"  Uploaded types (normalized): {satisfied_docs}")
    for doc in POLICY_RULES["required_documents"]:
        norm_doc = normalize_text(doc)
        found = norm_doc in satisfied_docs
        status = "SATISFIED" if found else "MISSING"
        print(f"  Required: {doc} -> {status}")

    return result


if __name__ == "__main__":
    result = run_pipeline()

    print()
    print("=" * 80)
    print("FINAL RESULT")
    print("=" * 80)
    print(json.dumps(result, indent=2, default=str))
