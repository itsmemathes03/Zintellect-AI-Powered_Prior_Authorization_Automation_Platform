import logging
import threading

from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# Lazy-loaded SentenceTransformer model.
# Loaded on first use instead of at import time so that
# ``uvicorn --reload`` starts without heavy model initialization.
_model = None
_model_lock = threading.Lock()


def _get_model():
    """Return the shared SentenceTransformer, initializing on first call."""
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model (first semantic_match call)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded")
        return _model


# Backward-compatible module-level name so that any code doing
# ``from app.services.semantic_matcher import model`` still works.
class _LazyModel:
    """Proxy that defers model access until first attribute use."""

    def __getattr__(self, name):
        return getattr(_get_model(), name)


model = _LazyModel()


def semantic_match(text1, text2):

    if not text1 or not text2:
        return 0

    m = _get_model()
    emb1 = m.encode([text1])
    emb2 = m.encode([text2])

    similarity = cosine_similarity(
        emb1,
        emb2
    )[0][0]

    return float(similarity)