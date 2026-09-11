import numpy as np

from sentence_transformers import (
    SentenceTransformer
)

# ==========================================
# LOAD EMBEDDING MODELS
# ==========================================

medical_model = SentenceTransformer(
    "pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb"
)

policy_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ==========================================
# SINGLE CHUNK EMBEDDING
# ==========================================

def generate_embedding(
        text,
        model_type="medical"
):

    if model_type == "policy":

        model = policy_model

    else:

        model = medical_model

    embedding = model.encode(
        text,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    return embedding.tolist()


# ==========================================
# BATCH EMBEDDINGS
# ==========================================

def generate_embeddings(
        chunks,
        model_type="medical"
):

    if model_type == "policy":

        model = policy_model

    else:

        model = medical_model

    texts = [

        chunk["chunk_text"]

        for chunk in chunks
    ]

    embeddings = model.encode(

        texts,

        convert_to_numpy=True,

        normalize_embeddings=True,

        show_progress_bar=False
    )

    results = []

    for chunk, vector in zip(
            chunks,
            embeddings
    ):

        item = chunk.copy()

        item["embedding"] = (
            vector.tolist()
        )

        item["embedding_dimension"] = (
            len(vector)
        )

        results.append(
            item
        )

    return results


# ==========================================
# COSINE SIMILARITY
# ==========================================

def cosine_similarity(
        vector1,
        vector2
):

    v1 = np.array(vector1)
    v2 = np.array(vector2)

    similarity = np.dot(
        v1,
        v2
    ) / (

        np.linalg.norm(v1)
        *

        np.linalg.norm(v2)
    )

    return float(
        similarity
    )


# ==========================================
# QUERY EMBEDDING
# ==========================================

def create_query_embedding(
        query,
        model_type="medical"
):

    return generate_embedding(
        query,
        model_type
    )