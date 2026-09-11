import uuid
import tiktoken

# Custom simple splitter


def simple_split_text(text, chunk_size=1000, chunk_overlap=200):
    """Split text into chunks of approx chunk_size characters with overlap."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - chunk_overlap  # overlap
    return chunks


# ==========================================
# TOKEN COUNTER
# ==========================================

encoding = tiktoken.get_encoding("cl100k_base")


def count_tokens(text):

    return len(encoding.encode(text))


# ==========================================
# RECURSIVE CHUNKER
# ==========================================

# Using custom simple splitter defined above


# ==========================================
# CREATE CHUNKS
# ==========================================


def create_chunks(text, request_id=None, document_type="medical_document"):

    chunks = simple_split_text(text)

    results = []

    for index, chunk in enumerate(chunks):
        chunk_metadata = {
            "chunk_id": str(uuid.uuid4()),
            "request_id": request_id,
            "chunk_index": index,
            "document_type": document_type,
            "token_count": count_tokens(chunk),
            "chunk_text": chunk,
        }

        results.append(chunk_metadata)

    return results


# ==========================================
# POLICY CHUNKING
# ==========================================


def create_policy_chunks(policy_text, policy_id):

    chunks = simple_split_text(policy_text)

    results = []

    for index, chunk in enumerate(chunks):
        metadata = {
            "chunk_id": f"{policy_id}_{index}",
            "policy_id": policy_id,
            "chunk_index": index,
            "document_type": "insurance_policy",
            "token_count": count_tokens(chunk),
            "chunk_text": chunk,
        }

        results.append(metadata)

    return results


# ==========================================
# HIERARCHICAL POLICY CHUNKER
# ==========================================


def create_hierarchical_policy_chunks(policy_text, policy_id):

    sections = policy_text.split("\n\n")

    results = []

    section_number = 1

    for section in sections:
        if not section.strip():
            continue

        chunks = simple_split_text(section)

        for chunk_number, chunk in enumerate(chunks):
            metadata = {
                "chunk_id": f"{policy_id}_S{section_number}_C{chunk_number}",
                "policy_id": policy_id,
                "section_number": section_number,
                "chunk_number": chunk_number,
                "document_type": "insurance_policy",
                "token_count": count_tokens(chunk),
                "chunk_text": chunk,
            }

            results.append(metadata)

        section_number += 1

    return results
