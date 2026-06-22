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
        ]
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
    # CT POLICY SPECIAL HANDLING
    # ==========================================

    procedure_name = extracted_policy[
        "procedure"
    ].lower()

    # REMOVE EMERGENCY REQUIREMENT
    # TO AVOID FALSE MANUAL REVIEWS

    if "ct brain scan" in procedure_name:

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
        extracted_policy[
            "required_documents"
        ]
    )

    print(
        "Required Conditions:",
        extracted_policy[
            "required_conditions"
        ]
    )

    return extracted_policy