from app.services.text_normalizer import (
    normalize_text
)


def classify_document(text):

    # ==========================================
    # SAFETY CHECK
    # ==========================================

    if not text:

        return "unknown"

    text = normalize_text(text)

    # ==========================================
    # SCORE TRACKER
    # ==========================================

    text = text.lower()

    scores = {

        "non_medical":0,
        "clinical_notes":0,
        "lab_results":0,
        "radiology_report":0,
        "prescription":0,
        "discharge_summary":0,
        "progress_notes":0,
        "referral_letter":0,
        "medical_necessity_letter":0,
        "physical_therapy_history":0,
        "insurance_document":0,
        "neurological_exam_report":0,
        "emergency_assessment":0,
        "unknown":0
    }

    # ==========================================
    # NON-MEDICAL KEYWORDS
    # ==========================================

    non_medical_keywords = [

        "abstract",
        "introduction",
        "literature survey",
        "references",
        "research paper",
        "conference",
        "journal",
        "machine learning",
        "artificial intelligence",
        "tcp ip",
        "osi model",
        "assignment",
        "semester",
        "student"
    ]

    # ==========================================
    # CLINICAL NOTES KEYWORDS
    # ==========================================
        
    clinical_keywords = [
        "history of present illness",
        "chief complaint",
        "assessment and plan",
        "physical examination",
        "soap note",
        "consultation note",
        "review of systems",
        "medical decision making",
        "follow up plan",
        "clinical findings",
        "physician assessment",
        "progress note"
    ]

    radiology_keywords = [

        "mri",
        "ct scan",
        "radiology report",
        "impression",
        "findings",
        "radiologist",
        "x ray",
        "ultrasound",
        "imaging findings",
        "brain mri",
        "lumbar spine mri",
        "disc narrowing",
        "degenerative changes",
        "imaging report"
    ]



    # ==========================================
    # PHYSICAL THERAPY KEYWORDS
    # ==========================================

    pt_keywords = [

        "physical therapy",
        "physiotherapy",
        "mobility rehabilitation",
        "therapy included",
        "therapy history",
        "rehabilitation exercises",
        "stretching exercises",
        "strengthening exercises",
        "posture correction",
        "physical therapist",
        "therapy sessions",
        "rehab program",
        "conservative therapy"
    ]

    # ==========================================
    # LAB / IMAGING KEYWORDS
    # ==========================================

    lab_keywords = [

        "blood report",
        "lab results",
        "lab findings",
        "pathology report",
        "blood investigations",
        "cbc",
        "hemoglobin",
        "glucose",
        "wbc",
        "rbc",
        "platelet",
        "serum",
        "urine analysis",
        "biochemistry",
        "laboratory report"
    ]

    # ==========================================
    # NEUROLOGICAL REPORT KEYWORDS
    # ==========================================

    neuro_keywords = [

        "neurological findings",
        "neurological examination",
        "neurological symptoms",
        "balance impairment",
        "reduced coordination",
        "delayed response time",
        "coordination problems",
        "neurological deficit",
        "motor weakness",
        "reflex abnormality"
    ]

    # ==========================================
    # EMERGENCY ASSESSMENT KEYWORDS
    # ==========================================

    emergency_keywords = [

        "emergency assessment",
        "trauma evaluation",
        "head trauma",
        "emergency department",
        "minor head injury",
        "acute trauma"
    ]

    # ==========================================
    # INSURANCE KEYWORDS
    # ==========================================

    insurance_keywords = [

        "prior authorization",
        "insurance referral",
        "payer policy",
        "coverage criteria",
        "medical necessity",
        "authorization request",
        "coverage guidelines",
        "insurance policy"
    ]

    # ==========================================
    # PRESCRIPTION KEYWORDS
    # ==========================================

    prescription_keywords = [

        "rx",
        "prescription",
        "dosage",
        "tablet",
        "capsule",
        "medicine",
        "drug",
        "take once daily"
    ]


    # ==========================================
    # DISCHARGE SUMMARY KEYWORDS
    # ==========================================

    discharge_keywords = [

        "discharge summary",
        "hospital course",
        "condition on discharge",
        "follow up instructions",
        "admission date",
        "discharge date",
        "discharge medications"
    ]


    # ==========================================
    # PROGRESS NOTES KEYWORDS
    # ==========================================

    progress_keywords = [

        "progress notes",
        "follow up visit",
        "daily notes",
        "clinical progress",
        "treatment response",
        "patient improving"
    ]


    # ==========================================
    # REFERRAL LETTER KEYWORDS
    # ==========================================

    referral_keywords = [

        "referral letter",
        "referred to",
        "specialist consultation",
        "consult requested",
        "referred for evaluation"
    ]


    # ==========================================
    # MEDICAL NECESSITY KEYWORDS
    # ==========================================

    medical_necessity_keywords = [

        "medical necessity",
        "medically necessary",
        "clinical justification",
        "justification",
        "treatment required",
        "recommended procedure"
    ]

    # ==========================================
    # SCORE CALCULATION
    # ==========================================

    for keyword in non_medical_keywords:

        if keyword in text:

            scores["non_medical"] += 1

    for keyword in clinical_keywords:

        if keyword in text:

            scores["clinical_notes"] += 2
    for keyword in radiology_keywords:

        if keyword in text:

            scores[
                "radiology_report"
            ] += 2

    for keyword in pt_keywords:

        if keyword in text:

            scores[
                "physical_therapy_history"
            ] += 1

    for keyword in lab_keywords:

        if keyword in text:

            scores["lab_results"] += 2

    for keyword in neuro_keywords:

        if keyword in text:

            scores[
                "neurological_exam_report"
            ] += 2

    for keyword in emergency_keywords:

        if keyword in text:

            scores[
                "emergency_assessment"
            ] += 2

    for keyword in insurance_keywords:

        if keyword in text:

            scores[
                "insurance_document"
            ] += 2



    for keyword in prescription_keywords:

        if keyword in text:

                    scores[
                        "prescription"
                    ] += 2


    for keyword in discharge_keywords:

        if keyword in text:

                    scores[
                        "discharge_summary"
                    ] += 2


    for keyword in progress_keywords:

        if keyword in text:

                    scores[
                        "progress_notes"
                    ] += 2


    for keyword in referral_keywords:

        if keyword in text:

                    scores[
                        "referral_letter"
                    ] += 2


    for keyword in medical_necessity_keywords:

        if keyword in text:

                    scores[
                        "medical_necessity_letter"
                    ] += 2

    # ==========================================
    # PRIORITY BOOSTING
    # ==========================================

    # Imaging reports should dominate
    # over clinical notes

    if scores["lab_results"] >= 2:

        scores["lab_results"] += 5

    # Neurological reports should dominate
    # over clinical notes

    if scores[
        "neurological_exam_report"
    ] >= 2:

        scores[
            "neurological_exam_report"
        ] += 5

    # Emergency reports boost

    if scores[
        "emergency_assessment"
    ] >= 2:

        scores[
            "emergency_assessment"
        ] += 4


        if scores[
                "medical_necessity_letter"
            ] >= 2:

                scores[
                    "medical_necessity_letter"
                ] += 5


        if scores[
                "discharge_summary"
            ] >= 2:

                scores[
                    "discharge_summary"
                ] += 4


        if scores[
                "prescription"
            ] >= 2:

                scores[
                    "prescription"
                ] += 3

    # ==========================================
    # DEBUG LOGGING
    # ==========================================

    print("\n===================================")
    print("DOCUMENT CLASSIFICATION DEBUG")
    print("===================================")

    print(scores)

    # ==========================================
    # SELECT HIGHEST SCORE
    # ==========================================

    document_type = max(
        scores,
        key=scores.get
    )

    print(
        "Predicted Document Type:",
        document_type
    )

    # ==========================================
    # SAFETY CHECK
    # ==========================================

    if scores[document_type] == 0:

        return "unknown"

    return document_type
