import re


def extract_policy_rules(policy_text):

    extracted_policy = {

        "procedure": "",

        "required_documents": [],

        "required_conditions": []
    }

    # ==========================================
    # SAFETY CHECK
    # ==========================================

    if not policy_text:

        return extracted_policy

    text = policy_text.lower()

    # ==========================================
    # EXTRACT PROCEDURE NAME
    # ==========================================

    procedure_patterns = [

        r'procedure:\s*([^\n\r]+)',

        r'procedure name:\s*([^\n\r]+)',

        r'requested procedure:\s*([^\n\r]+)',

        r'ct brain scan',

        r'mri lumbar spine',

        r'mri brain',

        r'knee replacement'
    ]

    for pattern in procedure_patterns:

        procedure_match = re.search(

            pattern,

            text,

            re.IGNORECASE
        )

        if procedure_match:

            if procedure_match.groups():

                extracted_policy[
                    "procedure"
                ] = (

                    procedure_match
                    .group(1)
                    .strip()
                )

            else:

                extracted_policy[
                    "procedure"
                ] = pattern

            break

    # ==========================================
    # REQUIRED DOCUMENT RULES
    # ==========================================

    document_rules = {

        "clinical_notes": [

            "clinical notes",
            "patient clinical notes",
            "physician notes",
            "doctor notes",
            "clinical findings",
            "assessment",
            "chief complaint"
        ],

        "lab_results": [

            "lab reports",
            "lab findings",
            "blood investigations",
            "imaging reports",
            "x ray",
            "mri",
            "ct imaging",
            "radiology report",
            "scan results"
        ],

        "neurological_exam_report": [

            "neurological examination",
            "neurological findings",
            "neurological report",
            "balance impairment",
            "coordination assessment",
            "neurological symptoms"
        ],

        "physical_therapy_history": [

            "physical therapy history",
            "physical therapy documentation",
            "physical therapy records",
            "physical therapy required",
            "pt history",
            "pt documentation",
            "rehabilitation history",
            "conservative therapy documentation",
            "therapy completion records",
            "physical therapy completed",
            "rehabilitation completed"
        ],

        "radiologist_referral": [

            "radiologist referral",
            "order form",
            "radiology order",
            "imaging order",
            "radiology referral",
            "referral form",
            "referral order",
            "referring physician",
            "referral request"
        ],

        "prior_imaging_report": [

            "prior imaging",
            "previous imaging",
            "prior radiology",
            "prior x-ray",
            "previous x-ray",
            "prior ultrasound",
            "previous ultrasound",
            "prior ct",
            "previous ct",
            "prior scan",
            "earlier imaging",
            "previous scan"
        ],

    }

    # ==========================================
    # DETECT REQUIRED DOCUMENTS
    # ==========================================

    for document_type, keywords in (

        document_rules.items()
    ):

        if any(

            keyword in text

            for keyword in keywords
        ):

            extracted_policy[
                "required_documents"
            ].append(document_type)

    # ==========================================
    # REQUIRED CONDITIONS
    # ==========================================

    condition_rules = {

        "Severe headache": [

            "severe headache",
            "persistent headache",
            "acute headache"
        ],

        "Dizziness": [

            "dizziness",
            "vertigo",
            "balance issues"
        ],

        "Loss of consciousness": [

            "loss of consciousness",
            "brief loc",
            "blackout episode",
            "unconsciousness"
        ],

        "Neurological deficits": [

            "neurological deficit",
            "neurological symptoms",
            "neurological findings",
            "coordination problems",
            "balance impairment",
            "reduced coordination"
        ],

        "Intracranial injury suspicion": [

            "intracranial injury",
            "brain injury",
            "head trauma",
            "cranial trauma"
        ],

        "Conservative therapy completed": [

            "conservative therapy",
            "failed conservative treatment",
            "physical therapy completed",
            "rehabilitation completed",
            "therapy completion"
        ],

        "Severe mobility limitation": [

            "mobility limitation",
            "severe mobility limitation",
            "difficulty walking"
        ],

        "Persistent lower back pain": [

            "persistent lower back pain",
            "chronic lumbar pain",
            "lumbar pain",
            "back pain"
        ],

        "Numbness": [

            "numbness",
            "tingling sensation",
            "loss of sensation"
        ],

        "Muscular weakness": [

            "muscular weakness",
            "muscle weakness",
            "reduced muscle strength"
        ]
    }

    # ==========================================
    # DETECT REQUIRED CONDITIONS
    # ==========================================

    for condition, keywords in (

        condition_rules.items()
    ):

        if any(

            keyword in text

            for keyword in keywords
        ):

            extracted_policy[
                "required_conditions"
            ].append(condition)

    # ==========================================
    # POLICY-DRIVEN DOCUMENT FILTERING
    # ==========================================
    # Remove emergency_assessment if the policy does not
    # explicitly require it.  This avoids false manual
    # reviews for non-emergency imaging policies.

    if "emergency_assessment" in extracted_policy.get(
        "required_documents", []
    ):
        # Only keep emergency_assessment if the policy text
        # explicitly mentions emergency or urgent evaluation
        policy_text_lower = text.lower()
        has_emergency = any(
            kw in policy_text_lower
            for kw in [
                "emergency",
                "urgent",
                "stat",
                "emergency assessment",
            ]
        )
        if not has_emergency:
            extracted_policy[
                "required_documents"
            ] = [
                doc
                for doc in extracted_policy[
                    "required_documents"
                ]
                if doc != "emergency_assessment"
            ]

    # ==========================================
    # REMOVE DUPLICATES
    # ==========================================

    extracted_policy[
        "required_documents"
    ] = list(

        set(
            extracted_policy[
                "required_documents"
            ]
        )
    )

    extracted_policy[
        "required_conditions"
    ] = list(

        set(
            extracted_policy[
                "required_conditions"
            ]
        )
    )

    # ==========================================
    # EMPTY SAFETY
    # ==========================================

    if not extracted_policy["procedure"]:

        extracted_policy[
            "procedure"
        ] = "unknown"

    # ==========================================
    # CONDITIONAL EVIDENCE REQUIREMENTS
    # ==========================================
    # For imaging policies (MRI / CT / PET), the numbered rules
    # describe clinical evidence that must be present in the
    # uploaded documents — not just document-type presence.
    # Each rule has:
    #   - label: human-readable requirement name
    #   - evidence_patterns: phrases that prove the rule is met
    #     when found in the combined clinical text
    #   - mandatory: True = always required for this procedure type,
    #     False = only required when the condition applies
    #   - condition_key: when mandatory=False, the entity field
    #     that must be truthy for the rule to activate

    text_lower = text

    # Detect imaging policy scope from keywords
    is_imaging_policy = any(
        kw in text_lower
        for kw in [
            "diagnostic imaging",
            "mri",
            "ct scan",
            "pet scan",
            "nuclear medicine",
        ]
    )

    required_evidence = []

    if is_imaging_policy:
        required_evidence = [
            {
                "label": "ICD-10 diagnosis code present",
                "evidence_patterns": [
                    "icd 10",
                    "icd10",
                    "diagnosis code",
                    "diagnostic code",
                ],
                "mandatory": True,
                "condition_key": None,
            },
            {
                "label": "Prior lower-cost imaging inconclusive",
                "evidence_patterns": [
                    "inconclusive",
                    "inadequate",
                    "non diagnostic",
                    "insufficient",
                    "no definitive",
                    "prior imaging",
                    "previous imaging",
                    "x-ray",
                    "ultrasound",
                    "prior workup",
                ],
                "mandatory": True,
                "condition_key": None,
            },
            {
                "label": "Repeat imaging justification (if within 90 days)",
                "evidence_patterns": [
                    "repeat imaging",
                    "repeat scan",
                    "disease progression",
                    "new symptoms",
                    "post-treatment",
                    "clinical justification",
                    "90 days",
                ],
                "mandatory": False,
                "condition_key": "is_repeat_imaging",
            },
            {
                "label": "Implant compatibility letter (if implanted device)",
                "evidence_patterns": [
                    "implant compatibility",
                    "device compatibility",
                    "pacemaker compatibility",
                    "cochlear implant",
                    "mri compatible",
                    "mr conditional",
                    "device manufacturer",
                ],
                "mandatory": False,
                "condition_key": "has_implanted_device",
            },
            {
                "label": "Contrast renal function documentation (if contrast used)",
                "evidence_patterns": [
                    "egfr",
                    "renal function",
                    "kidney function",
                    "creatinine",
                    "nephrology",
                    "contrast",
                    "e gfr",
                ],
                "mandatory": False,
                "condition_key": "contrast_used",
            },
        ]

    extracted_policy["required_evidence"] = required_evidence

    # ==========================================
    # DEBUG LOGGING
    # ==========================================

    print("\n===================================")
    print("EXTRACTED POLICY RULES")
    print("===================================")

    print(
        "Procedure:",
        extracted_policy["procedure"]
    )

    print(
        "Required Documents:",
        extracted_policy["required_documents"]
    )

    print(
        "Required Conditions:",
        extracted_policy["required_conditions"]
    )

    print(
        "Required Evidence:",
        [
            e["label"]
            for e in extracted_policy["required_evidence"]
        ]
    )

    return extracted_policy