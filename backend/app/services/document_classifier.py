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
        "radiologist_referral":0,
        "prior_imaging_report":0,
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

    # The ONLY document types the classifier may ever return.
    # Guarantees every document gets exactly one valid normalized
    # type (never a merged/derived label).
    supported_document_types = set(
        scores.keys()
    )

    # ==========================================
    # NON-MEDICAL KEYWORDS
    # ==========================================

    # Generic non-medical signals. These are deliberately broad
    # (event/competition, business/startup, government/scheme,
    # education/recruitment) so ANY clearly unrelated document is
    # detected -- not just "MSME" or "hackathon" PDFs.
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
        "student",

        # event / competition
        "hackathon",
        "competition",
        "problem statement",
        "participants",
        "registration",
        "submission deadline",
        "winners",
        "prize",
        "mentors",
        "workshop",
        "webinar",
        "seminar",
        "exhibition",
        "event brochure",
        "agenda",
        "program schedule",
        "call for proposals",
        "awareness campaign",

        # business / startup / government
        "startup",
        "start-ups",
        "entrepreneur",
        "innovation",
        "ministry",
        "government",
        "enterprise",
        "small and medium enterprises",
        "business plan",
        "pitch deck",
        "funding",
        "scheme",
        "project proposal",
        "annual report",
        "invoice",
        "purchase order",
        "terms and conditions",
        "privacy policy",

        # education / recruitment
        "recruitment",
        "internship",
        "curriculum",
        "syllabus",
        "college",
        "university",
        "examination",
        "question paper"
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
        "progress note",
        "physician report",
        "clinical report",
        "clinical physician report",
        "clinical assessment"
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
    # RADIOLOGIST ORDER / REFERRAL KEYWORDS
    # ==========================================
    # Section 3.6 requires a Radiologist Referral / Order Form
    # containing CPT code, body part, laterality, contrast Y/N.
    # These keywords distinguish a radiology-specific order from
    # a generic referral letter.

    radiologist_referral_keywords = [

        "radiology order",
        "imaging order",
        "mri order",
        "ct order",
        "pet order",
        "radiologist referral",
        "order form",
        "cpt code",
        "body part",
        "laterality",
        "contrast yes",
        "contrast y/n",
        "contrast administered",
        "radiology request",
        "imaging request",
        "nuclear medicine order",
    ]

    # ==========================================
    # PRIOR IMAGING REPORT KEYWORDS
    # ==========================================
    # Section 3.6 requires a Prior Imaging Report from previous
    # lower-cost imaging (X-ray, ultrasound). These keywords
    # distinguish a PRIOR/previous imaging report from the
    # CURRENT requested imaging report.

    prior_imaging_keywords = [

        "prior imaging report",
        "previous imaging report",
        "prior imaging study",
        "previous imaging study",
        "prior x-ray report",
        "previous x-ray report",
        "prior ultrasound report",
        "previous ultrasound report",
        "prior radiograph",
        "previous radiograph",
        "comparison with prior",
        "comparison with previous",
        "comparison study",
        "comparison film",
        "earlier imaging",
        "history of imaging",
        "previous scan",
        "prior scan",
        "comparison with prior study",
        "no significant change from prior",
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


    for keyword in radiologist_referral_keywords:

        if keyword in text:

                    scores[
                        "radiologist_referral"
                    ] += 2


    for keyword in prior_imaging_keywords:

        if keyword in text:

                    scores[
                        "prior_imaging_report"
                    ] += 2


    for keyword in medical_necessity_keywords:

        if keyword in text:

                    scores[
                        "medical_necessity_letter"
                    ] += 2

    # ==========================================
    # PRIORITY BOOSTING
    # ==========================================

    # Clinical notes with 2+ strong signals should dominate
    # over incidental keyword matches (e.g. mentioning "prior ct"
    # in a physician report does NOT make it a prior imaging report).

    if scores["clinical_notes"] >= 4:

        scores["clinical_notes"] += 8

    # Lab reports should dominate over clinical notes

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

    # Radiologist referral reports should dominate
    # over generic referral letters

    if scores["radiologist_referral"] >= 2:

        scores["radiologist_referral"] += 6

    # Prior imaging reports should dominate
    # over current radiology reports

    if scores["prior_imaging_report"] >= 2:

        scores["prior_imaging_report"] += 6

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
    # NON-MEDICAL GATE
    # ==========================================
    # A document is "clearly unrelated" when it carries at least
    # NON_MEDICAL_GATE distinct generic non-medical signals AND that
    # evidence is at least as strong as the best medical signal.
    # This deterministically sends unrelated documents (event
    # brochures, competition problem statements, academic work,
    # business/startup material, government schemes) to
    # "non_medical" without weakening any valid medical
    # classification: a genuine clinical document with one stray
    # non-medical word never reaches the gate.

    non_medical_gate = 3

    best_medical_score = max(
        scores[doc_type]
        for doc_type in scores
        if doc_type not in ("non_medical", "unknown")
    )

    if (
        scores["non_medical"] >= non_medical_gate
        and scores["non_medical"] >= best_medical_score
    ):

        print(
            "Non-medical evidence is decisive -> non_medical"
        )

        return "non_medical"

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

    # ==========================================
    # VALID TYPE GUARANTEE
    # ==========================================
    # Defensive whitelist: even if the scoring above is ever changed
    # or corrupted, only one of the supported document types above
    # (or "unknown") can ever be returned.

    if document_type not in supported_document_types:

        return "unknown"

    return document_type
