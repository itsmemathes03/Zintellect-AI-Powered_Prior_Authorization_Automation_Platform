"""
Service for the Evidence Extraction feature.
"""
import logging
from typing import Optional
from .extractor import EvidenceExtractor, create_evidence_extractor
from .adapter import EvidenceExtractionAdapter
from .models import ExtractionResult
from .schemas import EvidenceExtractionRequest, EvidenceExtractionResponse

logger = logging.getLogger(__name__)


class EvidenceExtractionService:
    """
    Service for extracting evidence from documents.
    """

    def __init__(self, extractor: Optional[EvidenceExtractor] = None,
                 adapter: Optional[EvidenceExtractionAdapter] = None):
        self.extractor = extractor or create_evidence_extractor()
        self.adapter = adapter or EvidenceExtractionAdapter()

    async def extract_evidence(
        self,
        request: EvidenceExtractionRequest
    ) -> EvidenceExtractionResponse:
        """
        Extract evidence from a document.

        Args:
            request: The extraction request containing document_id and options.

        Returns:
            EvidenceExtractionResponse with the extracted evidence.
        """
        logger.info(f"Extracting evidence for document {request.document_id}")

        # Get the document content from the adapter
        document_data = await self.adapter.get_document_content(
            document_id=request.document_id
        )

        if not document_data:
            raise ValueError(f"Document {request.document_id} not found")

        # Extract evidence from the text
        extraction_result = self.extractor.extract_evidence_from_text(
            text=document_data.get('content', ''),
            document_id=request.document_id,
            document_name=document_data.get('name', 'Unknown')
        )

        # Convert to response format
        response = EvidenceExtractionResponse(
            document_id=extraction_result.document_id,
            document_name=extraction_result.document_name,
            extracted_evidence=[ev.dict() for ev in extraction_result.extracted_evidence],
            extraction_timestamp=extraction_result.extraction_timestamp,
            overall_confidence=extraction_result.overall_confidence,
            total_evidence_count=extraction_result.total_evidence_count,
            evidence_by_type=extraction_result.evidence_by_type
        )

        logger.info(f"Completed evidence extraction for document {request.document_id}")
        return response


# Factory function
def create_evidence_extraction_service() -> EvidenceExtractionService:
    return EvidenceExtractionService()