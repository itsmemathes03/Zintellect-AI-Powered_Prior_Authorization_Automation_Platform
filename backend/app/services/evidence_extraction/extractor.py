"""
Evidence Extractor Core Logic
"""
import re
import logging
from typing import List, Dict, Any, Optional
from .models import ExtractedEvidence, EvidenceType, ExtractionResult
from datetime import datetime

logger = logging.getLogger(__name__)


class EvidenceExtractor:
    """
    Core logic for extracting evidence from documents.
    This is a simplified implementation that uses regex patterns to find common medical codes.
    In a real implementation, this would use NLP models, OCR, and possibly external APIs.
    """

    def __init__(self):
        # Define patterns for common medical codes
        self.patterns = {
            EvidenceType.ICD_CODE: r'\b[A-TV-Z][0-9][0-9AB]\.?[0-9A-Z]{0,4}\b',
            EvidenceType.CPT_CODE: r'\b[0-9]{5}\b',
            EvidenceType.HCPCS_CODE: r'\b[A-Z][0-9]{4}\b',
            # We can add more patterns for medications, lab results, etc.
        }

    def extract_evidence_from_text(self, text: str, document_id: str, document_name: str) -> ExtractionResult:
        """
        Extract evidence from the given text.

        Args:
            text: The text content of the document.
            document_id: The ID of the document.
            document_name: The name of the document.

        Returns:
            An ExtractionResult containing the extracted evidence.
        """
        logger.info(f"Extracting evidence from document {document_id}")

        extracted_evidence: List[ExtractedEvidence] = []

        # For each evidence type, apply the pattern
        for evidence_type, pattern in self.patterns.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Create an evidence object
                evidence = ExtractedEvidence(
                    evidence_id=f"{document_id}_{evidence_type.value}_{len(extracted_evidence)}",
                    evidence_type=evidence_type,
                    value=match.group(),
                    confidence=0.8,  # Placeholder confidence
                    location={"match_start": match.start(), "match_end": match.end()},
                    metadata={}
                )
                extracted_evidence.append(evidence)

        # Calculate overall confidence (average)
        overall_confidence = 0.0
        if extracted_evidence:
            overall_confidence = sum(ev.confidence for ev in extracted_evidence) / len(extracted_evidence)

        # Count evidence by type
        evidence_by_type: Dict[str, int] = {}
        for ev in extracted_evidence:
            evidence_by_type[ev.evidence_type.value] = evidence_by_type.get(ev.evidence_type.value, 0) + 1

        result = ExtractionResult(
            document_id=document_id,
            document_name=document_name,
            extracted_evidence=extracted_evidence,
            extraction_timestamp=datetime.now(),
            overall_confidence=overall_confidence,
            total_evidence_count=len(extracted_evidence),
            evidence_by_type=evidence_by_type
        )

        logger.info(f"Extracted {len(extracted_evidence)} evidence items from document {document_id}")
        return result


# Factory function
def create_evidence_extractor() -> EvidenceExtractor:
    return EvidenceExtractor()