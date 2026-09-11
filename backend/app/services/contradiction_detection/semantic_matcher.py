"""
Semantic matching layer for the contradiction detection pipeline.

ADAPTER: Reuses Zintellect's existing SentenceTransformer model
loaded in app.services.semantic_matcher to avoid duplicate model loading.

If the existing semantic matcher is unavailable, this layer degrades
gracefully and the pipeline continues without semantic matching.

Adapted from the standalone contradiction_detection module.
"""

from typing import List, Tuple, Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded reference to Zintellect's existing semantic matcher
_zintellect_semantic_match = None
_model_available = None


def _get_zintellect_matcher():
    """
    Lazily import and return Zintellect's existing semantic_match function.
    Returns None if unavailable.
    """
    global _zintellect_semantic_match, _model_available

    if _model_available is False:
        return None

    if _zintellect_semantic_match is not None:
        return _zintellect_semantic_match

    try:
        from app.services.semantic_matcher import semantic_match
        _zintellect_semantic_match = semantic_match
        _model_available = True
        logger.info("Reusing Zintellect's existing semantic_match service")
        return _zintellect_semantic_match
    except Exception as e:
        logger.warning(f"Zintellect semantic_matcher not available: {e}")
        _model_available = False
        return None


class SemanticMatcher:
    """
    Computes semantic similarity between text passages using Zintellect's
    existing SentenceTransformer model.

    Designed to work fully offline with local models.
    Falls back to zero scores if the model is unavailable.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the semantic matcher.

        Args:
            model_name: Name of the model (informational — actual model is
                       loaded by Zintellect's semantic_matcher service)
        """
        self.model_name = model_name
        self._matcher = _get_zintellect_matcher()

    def is_available(self) -> bool:
        """Check if the semantic matcher is available."""
        return self._matcher is not None

    def compute_similarity(self, text1: str, text2: str) -> float:
        """
        Compute semantic similarity between two text passages.

        Uses Zintellect's existing semantic_match function, which
        loads the all-MiniLM-L6-v2 model once and reuses it.

        Returns:
            Similarity score between 0.0 and 1.0
        """
        if not self.is_available():
            return 0.0

        if not text1.strip() or not text2.strip():
            return 0.0

        try:
            similarity = self._matcher(text1, text2)
            return max(0.0, min(1.0, float(similarity)))
        except Exception as e:
            logger.warning(f"Semantic similarity computation failed: {e}")
            return 0.0

    def compute_batch_similarities(
        self,
        texts1: List[str],
        texts2: List[str]
    ) -> List[float]:
        """
        Compute similarities for batches of text pairs.
        """
        if not self.is_available() or len(texts1) != len(texts2):
            return [0.0] * len(texts1)

        if not texts1:
            return []

        return [self.compute_similarity(t1, t2) for t1, t2 in zip(texts1, texts2)]


# Convenience functions (standalone usage, creates new matcher instances)

def is_semantically_equivalent(
    text1: str,
    text2: str,
    threshold: float = 0.75,
    model_name: str = "all-MiniLM-L6-v2"
) -> Tuple[bool, float]:
    """Determine if two texts are semantically equivalent."""
    matcher = SemanticMatcher(model_name)
    similarity = matcher.compute_similarity(text1, text2)
    return similarity >= threshold, similarity


def is_semantically_opposed(
    text1: str,
    text2: str,
    threshold: float = 0.25,
    model_name: str = "all-MiniLM-L6-v2"
) -> Tuple[bool, float]:
    """Determine if two texts are semantically opposed."""
    matcher = SemanticMatcher(model_name)
    similarity = matcher.compute_similarity(text1, text2)
    return similarity <= threshold, similarity


def compute_semantic_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity using default model."""
    matcher = SemanticMatcher()
    return matcher.compute_similarity(text1, text2)


def are_texts_semantically_similar(
    text1: str,
    text2: str,
    threshold: float = 0.75
) -> bool:
    """Check if two texts are semantically similar above a threshold."""
    matcher = SemanticMatcher()
    return matcher.compute_similarity(text1, text2) >= threshold
