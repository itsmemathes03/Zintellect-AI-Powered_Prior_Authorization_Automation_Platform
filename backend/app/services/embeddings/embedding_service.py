from sentence_transformers import (
    SentenceTransformer
)

# ==========================================
# LOAD EMBEDDING MODELS
# ==========================================

MEDICAL_MODEL = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

POLICY_MODEL = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ==========================================
# GENERATE SINGLE EMBEDDING
# ==========================================

def generate_text_embedding(
        text,
        model_type="medical"
):

    if not text:
        return []

    model = MEDICAL_MODEL

    if model_type == "policy":
        model = POLICY_MODEL

    embedding = model.encode(
        text,
        convert_to_numpy=True
    )

    return embedding.tolist()


# ==========================================
# GENERATE EMBEDDINGS FOR CHUNKS
# ==========================================

def generate_embeddings(
        chunks,
        model_type="medical"
):

    embedded_chunks = []

    if not chunks:
        return embedded_chunks

    model = MEDICAL_MODEL

    if model_type == "policy":
        model = POLICY_MODEL

    for chunk in chunks:

        text = chunk.get(
            "chunk_text",
            ""
        )

        if not text:
            continue

        embedding = model.encode(
            text,
            convert_to_numpy=True
        )

        chunk["embedding"] = (
            embedding.tolist()
        )

        embedded_chunks.append(
            chunk
        )

    return embedded_chunks


# ==========================================
# QUERY EMBEDDING
# ==========================================

def generate_query_embedding(
        query
):

    if not query:
        return []

    embedding = MEDICAL_MODEL.encode(
        query,
        convert_to_numpy=True
    )

    return embedding.tolist()


# ==========================================
# POLICY QUERY EMBEDDING
# ==========================================

def generate_policy_embedding(
        query
):

    if not query:
        return []

    embedding = POLICY_MODEL.encode(
        query,
        convert_to_numpy=True
    )

    return embedding.tolist()