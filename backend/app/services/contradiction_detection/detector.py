"""
Contradiction detection orchestrator.
Implements the layered pipeline that combines normalization, negation detection,
topic matching, semantic matching, and optional LLM reasoning to detect
contradictions between clinical documents.

Adapted from the standalone contradiction_detection module.
"""

from typing import List, Dict, Any, Tuple, Optional
from .models import (
    ClinicalDocument,
    ContradictionDetectionRequest,
    ContradictionDetectionResponse,
    Contradiction,
    StatementRef,
    Summary
)
from . import normalization
from . import negation
from . import topic_matcher
from . import semantic_matcher
from . import llm_reasoner
from . import config
import logging
import re

logger = logging.getLogger(__name__)


class ContradictionDetector:
    """
    Main contradiction detection orchestrator that implements the layered pipeline.
    """

    def __init__(self, config_dict: Optional[Dict[str, Any]] = None):
        self.config = config_dict or config.get_config()

        self.semantic_matcher = semantic_matcher.SemanticMatcher(
            model_name=self.config.get("SEMANTIC_MODEL_NAME", "all-MiniLM-L6-v2")
        )

        self.llm_reasoner = None
        if self.config.get("ENABLE_LLM_REASONING", False):
            self.llm_reasoner = llm_reasoner.create_llm_reasoner_from_config(self.config)
            if self.llm_reasoner is None:
                logger.warning("LLM reasoning enabled but failed to initialize. Disabling LLM layer.")

    def detect_contradictions(self, request: ContradictionDetectionRequest) -> ContradictionDetectionResponse:
        """
        Main entry point for contradiction detection.
        """
        logger.info(f"Starting contradiction detection for request {request.request_id}")
        logger.info(f"Analyzing {len(request.documents)} documents")

        # Step 1: Normalize and split documents into sentences
        normalized_docs = self._normalize_documents(request.documents)

        # Step 2: Extract topics from sentences
        topic_data = self._extract_topics(normalized_docs)

        # Step 3: Find cross-document topic matches
        topic_matches = self._find_topic_matches(topic_data)

        # Step 4: Detect contradictions for each topic match
        contradictions = self._detect_contradictions_for_topics(topic_matches, request.documents)

        # Step 5: Determine overall status
        status = self._determine_overall_status(contradictions)

        # Step 6: Build summary
        summary = Summary(
            documents_analyzed=len(request.documents),
            contradictions_detected=len(contradictions)
        )

        response = ContradictionDetectionResponse(
            request_id=request.request_id,
            status=status,
            contradictions=contradictions,
            summary=summary
        )

        logger.info(f"Contradiction detection completed. Status: {status}, Contradictions found: {len(contradictions)}")
        return response

    def _normalize_documents(self, documents: List[ClinicalDocument]) -> List[Dict[str, Any]]:
        normalized_docs = []
        for doc in documents:
            normalized_sentences = normalization.get_normalized_sentences(doc.text)
            doc_data = {
                "document_id": doc.document_id,
                "document_name": doc.document_name,
                "document_type": doc.document_type,
                "original_text": doc.text,
                "normalized_sentences": normalized_sentences
            }
            normalized_docs.append(doc_data)
        return normalized_docs

    def _extract_topics(self, normalized_docs: List[Dict[str, Any]]) -> List[Tuple[str, List[Dict[str, Any]]]]:
        topic_data = []
        for doc in normalized_docs:
            doc_id = doc["document_id"]
            sentence_topics = topic_matcher.get_sentence_topics(doc["normalized_sentences"])
            topic_data.append((doc_id, sentence_topics))
        return topic_data

    def _find_topic_matches(self, topic_data: List[Tuple[str, List[Dict[str, Any]]]]) -> List[Dict[str, Any]]:
        if not self.config.get("ENABLE_TOPIC_MATCHING", True):
            return []
        return topic_matcher.find_topic_matches_across_documents(topic_data)

    def _detect_contradictions_for_topics(
        self,
        topic_matches: List[Dict[str, Any]],
        original_documents: List[ClinicalDocument]
    ) -> List[Contradiction]:
        contradictions = []
        doc_lookup = {doc.document_id: doc for doc in original_documents}

        for topic_match in topic_matches:
            topic = topic_match["topic"]
            mentions = topic_match["mentions"]

            if len(mentions) < 2:
                continue

            mentions_by_doc = {}
            for mention in mentions:
                doc_id = mention["document_id"]
                if doc_id not in mentions_by_doc:
                    mentions_by_doc[doc_id] = []
                mentions_by_doc[doc_id].append(mention)

            docs_with_topic = list(mentions_by_doc.keys())

            for i in range(len(docs_with_topic)):
                for j in range(i + 1, len(docs_with_topic)):
                    doc_id_a = docs_with_topic[i]
                    doc_id_b = docs_with_topic[j]

                    sentences_a = mentions_by_doc[doc_id_a]
                    sentences_b = mentions_by_doc[doc_id_b]

                    for sent_a in sentences_a:
                        for sent_b in sentences_b:
                            contradiction = self._analyze_sentence_pair_for_contradiction(
                                sent_a, sent_b, topic, doc_lookup
                            )
                            if contradiction:
                                contradictions.append(contradiction)

        return contradictions

    def _analyze_sentence_pair_for_contradiction(
        self,
        sent_a: Dict[str, Any],
        sent_b: Dict[str, Any],
        topic: str,
        doc_lookup: Dict[str, ClinicalDocument]
    ) -> Optional[Contradiction]:
        orig_text_a = sent_a["sentence"]["original_text"]
        orig_text_b = sent_b["sentence"]["original_text"]
        doc_id_a = sent_a["document_id"]
        doc_id_b = sent_b["document_id"]

        doc_a = doc_lookup[doc_id_a]
        doc_b = doc_lookup[doc_id_b]

        # Step 1: Check for negation mismatch (strongest signal)
        negation_result = self._check_negation_mismatch(orig_text_a, orig_text_b)
        if negation_result["is_contradiction"]:
            return self._build_contradiction(
                topic=topic,
                severity=self._get_topic_severity(topic),
                confidence=negation_result["confidence"],
                statement_a=StatementRef(
                    document_id=doc_id_a,
                    document_name=doc_a.document_name,
                    text=orig_text_a
                ),
                statement_b=StatementRef(
                    document_id=doc_id_b,
                    document_name=doc_b.document_name,
                    text=orig_text_b
                ),
                explanation=negation_result["explanation"]
            )

        # Step 2: Check semantic similarity
        if self.config.get("ENABLE_SEMANTIC_MATCHING", True):
            semantic_result = self._check_semantic_contradiction(orig_text_a, orig_text_b)
            if semantic_result["is_contradiction"]:
                return self._build_contradiction(
                    topic=topic,
                    severity=self._get_topic_severity(topic),
                    confidence=semantic_result["confidence"],
                    statement_a=StatementRef(
                        document_id=doc_id_a,
                        document_name=doc_a.document_name,
                        text=orig_text_a
                    ),
                    statement_b=StatementRef(
                        document_id=doc_id_b,
                        document_name=doc_b.document_name,
                        text=orig_text_b
                    ),
                    explanation=semantic_result["explanation"]
                )

        # Step 3: LLM reasoning fallback
        if (self.config.get("ENABLE_LLM_REASONING_FALLBACK", True) and
            self.llm_reasoner and self.llm_reasoner.is_available()):
            llm_result = self._check_llm_contradiction(orig_text_a, orig_text_b, topic)
            if llm_result["is_contradiction"]:
                return self._build_contradiction(
                    topic=topic,
                    severity=self._get_topic_severity(topic),
                    confidence=llm_result["confidence"],
                    statement_a=StatementRef(
                        document_id=doc_id_a,
                        document_name=doc_a.document_name,
                        text=orig_text_a
                    ),
                    statement_b=StatementRef(
                        document_id=doc_id_b,
                        document_name=doc_b.document_name,
                        text=orig_text_b
                    ),
                    explanation=llm_result["explanation"]
                )

        return None

    # Hedging cues that reduce confidence in contradiction detection.
    # A statement with hedging language ("may", "might", "possibly")
    # expresses uncertainty, so contradicting it should not receive
    # the same confidence as contradicting a definitive statement.
    _HEDGING_PATTERNS = [
        r'\bmay\b', r'\bmight\b', r'\bpossibly\b', r'\bprobably\b',
        r'\bperhaps\b', r'\bsuspected\b', r'\bsuspect\b',
        r'\bcould be\b', r'\bcould have\b', r'\bcan\'?t rule out\b',
        r'\bunlikely\b', r'\btentative\b', r'\bprovisional\b',
    ]

    def _contains_hedging(self, text: str) -> bool:
        """Check if text contains hedging/uncertainty language."""
        text_lower = text.lower()
        for pattern in self._HEDGING_PATTERNS:
            if re.search(pattern, text_lower):
                return True
        return False

    def _check_negation_mismatch(self, text_a: str, text_b: str) -> Dict[str, Any]:
        if not self.config.get("ENABLE_NEGATION_DETECTION", True):
            return {"is_contradiction": False, "confidence": 0.0, "explanation": "Negation detection disabled"}

        neg_result_a = negation.detect_negation_in_sentence(text_a)
        neg_result_b = negation.detect_negation_in_sentence(text_b)

        is_negated_a = neg_result_a["is_negated"]
        is_negated_b = neg_result_b["is_negated"]

        if is_negated_a != is_negated_b:
            affirmed_text = text_a if not is_negated_a else text_b
            negated_text = text_b if not is_negated_a else text_a

            confidence_a = neg_result_a.get("confidence", 0.8)
            confidence_b = neg_result_b.get("confidence", 0.8)
            confidence = min(confidence_a, confidence_b)

            if neg_result_a["negation_cues"] or neg_result_b["negation_cues"]:
                confidence = min(0.95, confidence + 0.1)

            # Reduce confidence if either statement uses hedging language.
            # Hedged statements ("may have", "possibly") express uncertainty,
            # so contradicting them is less definitive than contradicting
            # a definitive affirmation or negation.
            hedged_a = self._contains_hedging(text_a)
            hedged_b = self._contains_hedging(text_b)
            if hedged_a or hedged_b:
                hedging_penalty = 0.25 if (hedged_a and hedged_b) else 0.15
                confidence = max(0.3, confidence - hedging_penalty)
                explanation_suffix = " (reduced confidence: hedging language detected)"
            else:
                explanation_suffix = ""

            explanation = (
                f"Negation mismatch: '{affirmed_text}' affirms the concept while "
                f"'{negated_text}' negates it"
                f"{explanation_suffix}"
            )

            return {
                "is_contradiction": True,
                "confidence": confidence,
                "explanation": explanation
            }

        return {"is_contradiction": False, "confidence": 0.0, "explanation": "No negation mismatch detected"}

    def _check_semantic_contradiction(self, text_a: str, text_b: str) -> Dict[str, Any]:
        if not self.semantic_matcher.is_available():
            return {"is_contradiction": False, "confidence": 0.0, "explanation": "Semantic matcher not available"}

        similarity = self.semantic_matcher.compute_similarity(text_a, text_b)

        sim_threshold = self.config.get("SEMANTIC_SIMILARITY_THRESHOLD", 0.75)
        opp_threshold = self.config.get("SEMANTIC_OPPOSITION_THRESHOLD", 0.25)

        if similarity >= sim_threshold:
            return {
                "is_contradiction": False,
                "confidence": 0.0,
                "explanation": f"Statements are semantically similar (similarity: {similarity:.2f})"
            }
        elif similarity <= opp_threshold:
            confidence = 1.0 - (similarity / opp_threshold) if opp_threshold > 0 else 0.0
            confidence = max(0.0, min(1.0, confidence))
            explanation = (
                f"Statements are semantically dissimilar (similarity: {similarity:.2f}), "
                f"suggesting possible contradiction"
            )
            return {
                "is_contradiction": True,
                "confidence": confidence,
                "explanation": explanation
            }
        else:
            return {
                "is_contradiction": False,
                "confidence": 0.0,
                "explanation": f"Statements have moderate semantic similarity (similarity: {similarity:.2f}) - uncertain"
            }

    def _check_llm_contradiction(self, text_a: str, text_b: str, topic: str) -> Dict[str, Any]:
        if not self.llm_reasoner or not self.llm_reasoner.is_available():
            return {"is_contradiction": False, "confidence": 0.0, "explanation": "LLM reasoner not available"}

        is_contradiction, confidence, reasoning = self.llm_reasoner.reason_about_contradiction(
            text_a, text_b, topic
        )

        return {
            "is_contradiction": is_contradiction,
            "confidence": confidence,
            "explanation": f"LLM reasoning: {reasoning}"
        }

    def _build_contradiction(
        self,
        topic: str,
        severity: str,
        confidence: float,
        statement_a: StatementRef,
        statement_b: StatementRef,
        explanation: str
    ) -> Contradiction:
        return Contradiction(
            topic=topic,
            severity=severity,
            confidence=confidence,
            statement_a=statement_a,
            statement_b=statement_b,
            explanation=explanation
        )

    def _get_topic_severity(self, topic: str) -> str:
        return config.get_topic_severity(topic)

    def _determine_overall_status(self, contradictions: List[Contradiction]) -> str:
        if not contradictions:
            return "no_contradiction_detected"

        high_conf_contradictions = [
            c for c in contradictions
            if c.confidence >= config.get_config().get("LOW_CONFIDENCE_THRESHOLD", 0.50)
        ]

        if high_conf_contradictions:
            return "contradiction_detected"
        else:
            return "uncertain"


def detect_contradictions(request: ContradictionDetectionRequest) -> ContradictionDetectionResponse:
    """
    Convenience function for detecting contradictions.

    Args:
        request: ContradictionDetectionRequest to process

    Returns:
        ContradictionDetectionResponse with results
    """
    detector = ContradictionDetector()
    return detector.detect_contradictions(request)
