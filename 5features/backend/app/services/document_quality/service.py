"""
Document Quality Service

This service orchestrates the document quality checking process.
It uses the checker and adapter to perform quality analysis on documents.
"""

import logging
from typing import Optional, Dict, Any, List
from .checker import DocumentQualityChecker, create_document_quality_checker
from .adapter import DocumentQualityAdapter
from .models import DocumentQualityResult

logger = logging.getLogger(__name__)


class DocumentQualityService:
    """
    Main service for document quality checking.
    Coordinates between checker, adapter, and any external services.
    """

    def __init__(self, checker: Optional[DocumentQualityChecker] = None,
                 adapter: Optional[DocumentQualityAdapter] = None):
        """
        Initialize the service with checker and adapter instances.

        Args:
            checker: DocumentQualityChecker instance (creates default if None)
            adapter: DocumentQualityAdapter instance (creates default if None)
        """
        self.checker = checker or create_document_quality_checker()
        self.adapter = adapter or DocumentQualityAdapter()

    async def check_document_quality(
        self,
        document_id: str,
        request_id: Optional[str] = None,
        check_recency: bool = False
    ) -> DocumentQualityResult:
        """
        Perform document quality check for a given document.

        Args:
            document_id: Unique identifier for the document
            request_id: Optional ID of the prior authorization request
            check_recency: Whether to check recency against policy requirements

        Returns:
            DocumentQualityResult containing the quality check results
        """
        logger.info(f"Starting document quality check for document_id: {document_id}")

        try:
            # Step 1: Retrieve document and metadata using adapter
            document_data = await self.adapter.get_document_data(document_id, request_id)

            if not document_data:
                logger.warning(f"No document data found for document_id: {document_id}")
                # Return a result indicating the document could not be processed
                return DocumentQualityResult(
                    document_id=document_id,
                    document_name="UNKNOWN",
                    quality_status="FAIL",
                    overall_quality=0.0,
                    ocr_quality=None,
                    page_count=0,
                    blank_pages=[],
                    possible_missing_pages=[],
                    duplicate_status="ERROR",
                    detected_document_type="UNKNOWN",
                    warnings=["Document not found or inaccessible"],
                    recommended_action="Please verify the document was uploaded correctly and try again."
                )

            # Extract data from adapter response
            file_content = document_data.get('file_content', b'')
            document_name = document_data.get('document_name', 'UNKNOWN')
            metadata = document_data.get('metadata', {})
            existing_hashes = document_data.get('existing_hashes', set())
            expected_document_types = document_data.get('expected_document_types', [])

            # Get policy recency requirement if needed
            policy_recency_days = None
            if check_recency and request_id:
                policy_recency_days = await self.adapter.get_policy_recency_requirement(request_id)

            # Step 2: Perform quality checks using checker
            result = self.checker.perform_quality_check(
                file_content=file_content,
                document_id=document_id,
                document_name=document_name,
                existing_hashes=existing_hashes,
                expected_document_types=expected_document_types,
                metadata=metadata,
                policy_recency_days=policy_recency_days
            )

            logger.info(f"Completed document quality check for document_id: {document_id} with status: {result.quality_status}")
            return result

        except Exception as e:
            logger.error(f"Error during document quality check for document_id: {document_id}: {str(e)}")
            # Return error result
            return DocumentQualityResult(
                document_id=document_id,
                document_name="ERROR",
                quality_status="FAIL",
                overall_quality=0.0,
                ocr_quality=None,
                page_count=0,
                blank_pages=[],
                possible_missing_pages=[],
                duplicate_status="ERROR",
                detected_document_type="ERROR",
                warnings=[f"Internal error during quality check: {str(e)}"],
                recommended_action="Please try again later or contact support if the problem persists."
            )

    async def batch_check_documents(
        self,
        document_ids: List[str],
        request_id: Optional[str] = None
    ) -> List[DocumentQualityResult]:
        """
        Perform quality checks on multiple documents.

        Args:
            document_ids: List of document IDs to check
            request_id: Optional ID of the prior authorization request

        Returns:
            List of DocumentQualityResult objects
        """
        logger.info(f"Starting batch document quality check for {len(document_ids)} documents")

        results = []
        for doc_id in document_ids:
            result = await self.check_document_quality(doc_id, request_id)
            results.append(result)

        logger.info(f"Completed batch document quality check for {len(document_ids)} documents")
        return results


# Factory function for creating service instance
def create_document_quality_service() -> DocumentQualityService:
    """Factory function to create a DocumentQualityService instance."""
    return DocumentQualityService()