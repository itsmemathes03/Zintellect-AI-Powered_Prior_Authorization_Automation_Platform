import hashlib
import json
import re

from app.database.db import SessionLocal
from app.models.policy_model import (
    InsurancePolicy
)

from app.services.semantic_matcher import (
    semantic_match
)

from app.services.text_normalizer import (
    normalize_text
)

from app.services.rag.chunking_service import (
    create_chunks,
    create_hierarchical_policy_chunks
)


# ==========================================
# PROCEDURE-TO-SECTION MAPPING
# ==========================================
# Maps procedure keywords to the policy section
# number that contains the relevant requirements.
# Used to scope policy_text, required_documents,
# and required_conditions to the correct section.

PROCEDURE_SECTION_MAP = {
    "cardiac": "3.1",
    "cardiovascular": "3.1",
    "knee replacement": "3.3",
    "hip replacement": "3.3",
    "spinal fusion": "3.3",
    "arthroscopy": "3.3",
    "shoulder replacement": "3.3",
    "orthopaedic": "3.3",
    "orthopedic": "3.3",
    "musculoskeletal": "3.3",
    "chemotherapy": "3.2",
    "radiation therapy": "3.2",
    "oncology": "3.2",
    "inpatient admission": "3.4",
    "elective inpatient": "3.4",
    "mental health": "3.5",
    "substance abuse": "3.5",
    "mri": "3.6",
    "ct scan": "3.6",
    "ct brain": "3.6",
    "pet scan": "3.6",
    "nuclear medicine": "3.6",
    "diagnostic imaging": "3.6",
    "x-ray": "3.6",
    "x ray": "3.6",
    "ultrasound": "3.6",
    "biologics": "3.7",
    "biologic drug": "3.7",
    "immunosuppressant": "3.7",
    "maternity": "3.8",
    "newborn": "3.8",
    "obstetric": "3.8",
}

from app.services.embeddings.embedding_service import (
    generate_embeddings
)

from app.services.retrieval.vector_db_service import (
    store_policy_embeddings
)

from app.services.policy_chunk_ids import (
    apply_deterministic_chunk_ids
)


# ==========================================
# STOPWORDS FOR BODY-TEXT MATCHING
# ==========================================
# Verbose AI-extracted procedure phrases (e.g. "MRI brain scan with and
# without contrast") dilute semantic similarity; dropping stopwords lets
# the meaningful procedure words dominate the match.

_BODY_MATCH_STOPWORDS = {
    "a", "an", "and", "for", "in", "of", "or", "the", "to",
    "with", "without", "on", "at", "is", "are", "was", "were",
    "be", "by", "as", "due", "should", "must", "may", "can",
}


def _best_policy_body_score(
    normalized_input,
    policy_text
):
    """Best semantic match between the requested procedure and individual
    lines of the policy body text.

    Policy rows sometimes store a generic placeholder in ``procedure_name``
    (e.g. "medical procedure") while the actual procedures (MRI, CT scan,
    etc.) are described inside ``policy_text``. Matching against the body
    text lets those policies still be found.
    """

    if not normalized_input or not policy_text:

        return 0

    # Drop single-character tokens (e.g. "x" from "x ray") and stopwords
    # ("with", "and", ...) so they neither flood the candidate cap nor
    # dilute the semantic match with verbose AI-extracted phrases.

    tokens = [

        token

        for token in normalized_input.split()

        if (
            len(token) >= 2
            and token not in _BODY_MATCH_STOPWORDS
        )
    ]

    if not tokens:

        return 0

    # Match against the stopword-free core of the phrase rather than the
    # full (possibly verbose) procedure text.

    core_input = " ".join(
        tokens
    )

    token_pattern = re.compile(

        r"\b(?:"
        + "|".join(

            re.escape(token)

            for token in tokens
        )
        + r")\b"
    )

    candidates = []

    for line in policy_text.splitlines():

        line_lower = line.strip().lower()

        if not line_lower:

            continue

        # Cheap pre-filter: only embed lines that mention the
        # requested procedure words (bounds embedding cost).

        if token_pattern.search(
            line_lower
        ):

            hit_count = len(

                token_pattern.findall(
                    line_lower
                )
            )

            candidates.append(
                (hit_count, line_lower)
            )

    # Rank by how many procedure words a line mentions, then cap, so
    # the most relevant lines are scored even when a common word
    # appears early in the document.

    candidates.sort(
        key=lambda item: item[0],
        reverse=True
    )

    candidates = candidates[:30]

    best_score = 0

    for _, line in candidates:

        score = semantic_match(
            core_input,
            line
        )

        if score > best_score:

            best_score = score

    return best_score


# ==========================================
# PROCEDURE-TO-SECTION SCOPING
# ==========================================
# For comprehensive multi-section policies (e.g.
# HealthShield 39K manual), scope the policy_text
# to the section relevant to the requested procedure.
# This prevents irrelevant sections (e.g. Orthopaedic
# Section 3.3) from polluting RAG retrieval and
# required_documents / required_conditions extraction.

_SECTION_HEADER_RE = re.compile(
    r'(?:^|\n)\s*(\d+\.\d+)\s+(.+)',
    re.MULTILINE
)


def _find_relevant_section(policy_text, procedure_name):
    """Find the policy section most relevant to the requested procedure."""

    normalized = normalize_text(procedure_name)

    # --- Step 1: look up procedure in explicit mapping ---
    for keyword, section_num in PROCEDURE_SECTION_MAP.items():
        if keyword in normalized:
            return section_num

    # --- Step 2: scan section headers for procedure words ---
    tokens = [
        t for t in normalized.split()
        if len(t) >= 3
    ]
    if not tokens:
        return None

    best_header = None
    best_hits = 0

    for match in _SECTION_HEADER_RE.finditer(policy_text):
        header_text = match.group(2).lower()
        hits = sum(1 for t in tokens if t in header_text)
        if hits > best_hits:
            best_hits = hits
            best_header = match.group(1)

    if best_hits > 0:
        return best_header

    return None


def _extract_section_text(policy_text, section_number):
    """Extract text from a specific section to the next same-level section."""

    pattern = re.compile(
        r'(?:^|\n)\s*' + re.escape(section_number) + r'[\s.]',
        re.MULTILINE
    )

    match = pattern.search(policy_text)
    if not match:
        return None

    start = match.start()
    remaining = policy_text[start:]

    # Find end: next subsection (e.g. 3.7) or next major section (SECTION 4+)
    end_re = re.compile(
        r'(?:^|\n)\s*(?:\d+\.\d+\s+\S|SECTION\s*\d+)',
        re.MULTILINE
    )
    end_match = end_re.search(remaining[5:])
    if end_match:
        return remaining[: end_match.start() + 5].strip()
    return remaining.strip()


def load_policy(procedure_name, insurance_provider=None):
    db = SessionLocal()

    try:

        # =====================================
        # SAFETY CHECK
        # =====================================

        if not procedure_name:

            return {
                "procedure": "unknown"
            }

        # =====================================
        # HANDLE LIST OUTPUT
        # =====================================

        if isinstance(procedure_name, list):

            procedure_name = " ".join(
                procedure_name
            )

        normalized_input = normalize_text(
            procedure_name
        )

        print(
            "\n=== POLICY SEARCH DEBUG ==="
        )

        print(
            "Requested Procedure:",
            normalized_input
        )

        # =====================================
        # FILTER BY INSURANCE PROVIDER
        # =====================================

        print(
            "Requested Insurance Provider:",
            insurance_provider or "(none)"
        )

        if insurance_provider:
            policies = db.query(
                InsurancePolicy
            ).filter(
                InsurancePolicy.insurance_provider == insurance_provider
            ).all()
        else:
            policies = db.query(
                InsurancePolicy
            ).all()

        if not policies:

            print("No policies found for provider:", insurance_provider)

            return {
                "procedure": "unknown",
                "no_provider_policy": True
            }

        # =====================================
        # FIND BEST SEMANTIC MATCH
        # =====================================

        best_policy = None
        best_score = 0

        for policy in policies:

            stored_procedure = normalize_text(
                policy.procedure_name
            )

            name_score = semantic_match(
                normalized_input,
                stored_procedure
            )

            # =====================================
            # ALSO MATCH AGAINST POLICY BODY TEXT
            # =====================================
            # Many policies store a generic placeholder in
            # ``procedure_name`` (e.g. "medical procedure") while the
            # real procedure is described inside ``policy_text``. If the
            # name-based score is weak, the body-text score can still
            # surface the right policy.

            body_score = _best_policy_body_score(
                normalized_input,
                policy.policy_text
            )

            score = max(
                name_score,
                body_score
            )

            print(
                f"Matching "
                f"{normalized_input}"
                f" <-> "
                f"{stored_procedure}"
                f" = {score}"
                f" (name: {name_score}, body: {body_score})"
            )

            if score > best_score:

                best_score = score
                best_policy = policy

        # =====================================
        # MATCH THRESHOLD
        # =====================================

        if best_score < 0.55:

            print(
                "No policy matched"
            )

            return {
                "procedure": "unknown"
            }

        # =====================================
        # SUCCESS
        # =====================================

        print(
            "Matched Policy:",
            best_policy.procedure_name
        )

        print(
            "Confidence:",
            best_score
        )

        # =====================================
        # SCOPE POLICY TEXT TO RELEVANT SECTION
        # =====================================
        # For comprehensive multi-section policies, scope the
        # policy_text to the section relevant to the requested
        # procedure. This prevents irrelevant sections (e.g.
        # Orthopaedic Section 3.3) from polluting RAG retrieval
        # and from producing incorrect required_documents /
        # required_conditions via keyword scanning.

        full_policy_text = best_policy.policy_text

        relevant_section = _find_relevant_section(
            full_policy_text,
            procedure_name
        )

        policy_text = full_policy_text

        if relevant_section:
            scoped = _extract_section_text(
                full_policy_text,
                relevant_section
            )
            if scoped and len(scoped) > 100:
                policy_text = scoped
                print(
                    f"Scoped policy to Section "
                    f"{relevant_section} "
                    f"({len(policy_text)} chars)"
                )
            else:
                print(
                    f"Section {relevant_section} "
                    f"too short, using full text"
                )
        else:
            print(
                "No procedure-specific section found, "
                "using full policy text"
            )

        # =====================================
        # RE-EXTRACT RULES FROM SCOPED TEXT
        # =====================================
        # When the policy was uploaded, extract_policy_rules
        # scanned the ENTIRE multi-section document, producing
        # a flat union of all sections' requirements. Re-extract
        # from the scoped section to get procedure-specific
        # documents and conditions.

        from app.services.policy_extraction_service import (
            extract_policy_rules
        )

        scoped_rules = extract_policy_rules(
            policy_text
        )

        required_documents = (
            scoped_rules.get(
                "required_documents", []
            )
        )

        required_conditions = (
            scoped_rules.get(
                "required_conditions", []
            )
        )

        # Use scoped values when available; fall back to the
        # global DB values only when scoped extraction returned
        # nothing AND the section was not found (meaning we're
        # using the full policy text, not a scoped section).

        if not required_documents and not relevant_section:
            required_documents = json.loads(
                best_policy.required_documents
            )

        if not required_conditions and not relevant_section:
            required_conditions = json.loads(
                best_policy.required_conditions
            )

        print(
            f"Scoped required documents: "
            f"{required_documents}"
        )
        print(
            f"Scoped required conditions: "
            f"{required_conditions}"
        )

        # =====================================
        # POLICY CHUNKING
        # =====================================

        policy_chunks = create_chunks(
            text=policy_text,
            document_type="insurance_policy"
        )

        # =====================================
        # ADD METADATA
        # =====================================

        # Deterministic chunk IDs: re-matching the same policy
        # produces identical IDs so the vector-store upsert is
        # idempotent instead of growing on every request.
        apply_deterministic_chunk_ids(
            policy_chunks,
            str(best_policy.id),
            policy_text
        )

        # =====================================
        # GENERATE EMBEDDINGS
        # =====================================

        embedded_chunks = (
            generate_embeddings(
                policy_chunks,
                model_type="policy"
            )
        )

        # =====================================
        # STORE IN CHROMADB
        # =====================================

        store_policy_embeddings(
            embedded_chunks
        )

        required_evidence = (
            scoped_rules.get(
                "required_evidence", []
            )
        )

        print(
            f"Scoped required evidence: "
            f"{[e['label'] for e in required_evidence]}"
        )

        return {

            "policy_id":
                str(
                    best_policy.id
                ),

            "procedure":
                best_policy.procedure_name,

            "policy_text":
                policy_text,

            "required_documents":
                required_documents,

            "required_conditions":
                required_conditions,

            "required_evidence":
                required_evidence,

            "match_score":
                round(
                    best_score,
                    2
                ),

            "total_chunks":
                len(
                    policy_chunks
                )
        }

    except Exception as error:

        print(
            "Policy Loader Error:",
            str(error)
        )

        return {
            "procedure": "unknown"
        }

    finally:

        db.close()