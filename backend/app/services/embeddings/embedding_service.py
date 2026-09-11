import logging
import threading

logger = logging.getLogger(__name__)

# ==========================================
# LAZY EMBEDDING MODELS
# ==========================================
# Loaded on first use instead of at import time so that
# ``uvicorn --reload`` starts without heavy model initialization.

_models = {}
_models_lock = threading.Lock()


def _get_model():
    """Return the shared SentenceTransformer, initializing on first call.

    Both MEDICAL_MODEL and POLICY_MODEL resolve to the same
    ``all-MiniLM-L6-v2`` model, so a single instance is cached.
    """
    key = "all-MiniLM-L6-v2"
    if key in _models:
        return _models[key]
    with _models_lock:
        if key in _models:
            return _models[key]
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model (first embedding call)...")
        instance = SentenceTransformer(key)
        logger.info("Embedding model loaded")
        _models[key] = instance
        return instance


# Backward-compatible module-level names.
class _LazyModel:
    """Proxy that defers model access until first attribute use."""

    def __getattr__(self, name):
        return getattr(_get_model(), name)


MEDICAL_MODEL = _LazyModel()
POLICY_MODEL = _LazyModel()


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