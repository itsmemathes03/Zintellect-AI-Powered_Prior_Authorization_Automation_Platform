"""
Adapter for the Evidence Extraction service.
This adapter interfaces with existing services to get document content.
"""
import logging
from typing import Dict, Any, Optional
from .models import ExtractionResult

logger = logging.getLogger(__name__)


class EvidenceExtractionAdapter:
    """
    Adapter to get document content from existing services.
    In a real implementation, this would connect to the document storage or OCR service.
    """

    def __init__(self):
        """
        Initialize the adapter.
        We'll use a simple in-memory store for demonstration.
        """
        # In a real system, this would be a connection to a document service.
        self._document_store: Dict[str, Dict[str, Any]] = {}
        self._initialized = False

    async def _ensure_initialized(self):
        if self._initialized:
            return
        logger.info("Initializing evidence extraction adapter (mock)")
        # For demonstration, we'll add a sample document if the store is empty.
        if not self._document_store:
            self._document_store["doc123"] = {
                "content": "Patient diagnosed with ICD-10 code E11.9 (Type 2 diabetes mellitus). "
                           "Prescribed medication: Metformin 500mg twice daily. "
                           "CPT code 99213 for office visit. "
                           "Lab result: HbA1c 7.5%.",
                "name": "patient_summary.pdf"
            }
        self._initialized = True

    async def get_document_content(self, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve the content of a document by its ID.

        Args:
            document_id: The ID of the document.

        Returns:
            A dictionary containing at least 'content' (the text) and 'name' (the document name),
            or None if not found.
        """
        await self._ensure_initialized()
        logger.info(f"Fetching document content for document_id: {document_id}")
        document = self._document_store.get(document_id)
        if document:
            logger.info(f"Found document {document_id}")
            return document

        # Unknown documents are NOT treated as genuine medical evidence.
        # Return None so the caller can raise a 404 / structured validation error.
        logger.warning(f"Document {document_id} not found in document store")
        return None


# Factory function
def create_evidence_extraction_adapter() -> EvidenceExtractionAdapter:
    return EvidenceExtractionAdapter()