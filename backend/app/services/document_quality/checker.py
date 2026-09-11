"""
Document Quality Checker Module

This module implements various checks for document quality including:
- OCR confidence scoring
- Blank page detection
- Unreadable page detection
- Duplicate detection
- Document type validation
- Metadata completeness
- Date validation and recency checks
"""

import hashlib
import logging
from typing import List, Tuple, Optional, Dict, Any, Set
from .models import DocumentQualityResult, PageCheckResult, DocumentQualityStatus

logger = logging.getLogger(__name__)


class DocumentQualityChecker:
    """
    Main class for performing document quality checks.
    This is designed to be independent of web framework dependencies.
    """

    def __init__(self):
        # In a real implementation, these would be initialized with actual services
        # For now, we'll use placeholder values
        self.ocr_confidence_threshold = 0.6  # Below this is considered poor OCR
        self.blank_page_threshold = 0.95     # Above this percentage of white space is considered blank

    def calculate_file_hash(self, file_content: bytes) -> str:
        """
        Calculate SHA-256 hash of file content for duplicate detection.

        Args:
            file_content: Raw bytes of the file

        Returns:
            SHA-256 hash as hexadecimal string
        """
        return hashlib.sha256(file_content).hexdigest()

    def calculate_text_hash(self, text_content: str) -> str:
        """
        Calculate hash of normalized text content for near-duplicate detection.

        Args:
            text_content: Extracted text from document

        Returns:
            SHA-256 hash of normalized text
        """
        # Normalize text: lowercase, remove extra whitespace
        normalized = ' '.join(text_content.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()

    def is_blank_page(self, text_content: str, confidence: float) -> bool:
        """
        Determine if a page is blank based on text content and OCR confidence.

        Args:
            text_content: Extracted text from the page
            confidence: OCR confidence score for the page

        Returns:
            True if page is considered blank, False otherwise
        """
        # If OCR confidence is very low, we might not trust the text extraction
        if confidence < 0.3:
            return True  # Treat as blank/unreadable

        # Check if text content is minimal (after stripping whitespace)
        stripped = text_content.strip()
        if len(stripped) == 0:
            return True

        # Check percentage of non-whitespace characters
        if len(text_content) > 0:
            non_whitespace = sum(1 for c in text_content if not c.isspace())
            whitespace_ratio = 1.0 - (non_whitespace / len(text_content))
            return whitespace_ratio > self.blank_page_threshold

        return False

    def is_duplicate(self, file_hash: str, existing_hashes: Set[str]) -> bool:
        """
        Check if document is a duplicate based on file hash.

        Args:
            file_hash: SHA-256 hash of the current document
            existing_hashes: Set of hashes from existing documents

        Returns:
            True if duplicate found, False otherwise
        """
        return file_hash in existing_hashes

    def is_near_duplicate(self, text_hash: str, existing_text_hashes: Set[str]) -> bool:
        """
        Check if document is a near-duplicate based on text hash.

        Args:
            text_hash: Hash of normalized text content
            existing_text_hashes: Set of hashes from existing documents

        Returns:
            True if near-duplicate found, False otherwise
        """
        return text_hash in existing_text_hashes

    def validate_document_type(
        self,
        detected_type: str,
        expected_types: List[str]
    ) -> bool:
        """
        Validate that detected document type matches expected types.

        Args:
            detected_type: Document type from classifier
            expected_types: List of acceptable document types

        Returns:
            True if valid, False otherwise
        """
        # If no expected types specified, accept any type
        if not expected_types:
            return True

        # Check if detected type is in expected types
        return detected_type in expected_types

    def validate_metadata_completeness(
        self,
        metadata: Dict[str, Any],
        required_fields: List[str]
    ) -> Tuple[float, List[str]]:
        """
        Validate completeness of metadata fields.

        Args:
            metadata: Dictionary of metadata fields
            required_fields: List of required field names

        Returns:
            Tuple of (completeness_score, missing_fields)
            completeness_score: float between 0 and 1
            missing_fields: list of missing field names
        """
        if not required_fields:
            return 1.0, []

        present_count = 0
        missing_fields = []

        for field in required_fields:
            if field in metadata and metadata[field] is not None and metadata[field] != '':
                present_count += 1
            else:
                missing_fields.append(field)

        completeness_score = present_count / len(required_fields) if required_fields else 1.0
        return completeness_score, missing_fields

    def validate_recency(
        self,
        document_date: Optional[str],
        max_age_days: Optional[int]
    ) -> Tuple[bool, Optional[int]]:
        """
        Validate document recency against policy requirements.

        Args:
            document_date: Date of the document (YYYY-MM-DD format)
            max_age_days: Maximum allowed age in days (None for no limit)

        Returns:
            Tuple of (is_valid, age_in_days)
            is_valid: True if document is recent enough, False otherwise
            age_in_days: Age of document in days, or None if date invalid
        """
        if max_age_days is None:
            return True, None  # No recency requirement

        if not document_date:
            return False, None  # Cannot validate without date

        try:
            from datetime import datetime
            doc_date = datetime.strptime(document_date, '%Y-%m-%d')
            today = datetime.now()
            age_delta = today - doc_date
            age_in_days = age_delta.days

            is_valid = age_in_days <= max_age_days
            return is_valid, age_in_days
        except ValueError:
            # Invalid date format
            return False, None

    async def check_document_quality(
        self,
        document_data: Dict[str, Any],
        adapter: Any,  # DocumentQualityAdapter
        request_id: Optional[str] = None,
        check_recency: bool = False
    ) -> DocumentQualityResult:
        """
        Perform comprehensive document quality check.

        Args:
            document_data: Dictionary containing document info from adapter
            adapter: DocumentQualityAdapter instance for service calls
            request_id: Optional ID of the prior authorization request
            check_recency: Whether to check recency against policy requirements

        Returns:
            DocumentQualityResult containing the quality check results
        """
        logger.info(f"Starting document quality check for document_id: {document_data.get('document_name', 'unknown')}")

        # Initialize result containers
        page_results = []
        all_text = ""
        file_hash = None
        text_hash = None
        ocr_confidences = []
        blank_pages = 0
        total_pages = 0

        try:
            # Extract data from document_data
            file_content = document_data.get('file_content', b'')
            metadata = document_data.get('metadata', {})
            existing_hashes = document_data.get('existing_hashes', set())
            expected_types = document_data.get('expected_document_types', [])

            # Calculate file hash for duplicate detection
            file_hash = self.calculate_file_hash(file_content)
            is_duplicate = self.is_duplicate(file_hash, existing_hashes)

            # Extract OCR data
            ocr_results = await adapter.extract_ocr_data(file_content)
            total_pages = len(ocr_results)

            # Process each page
            for page_idx, ocr_result in enumerate(ocr_results):
                confidence = ocr_result.get('confidence', 0.0)
                text = ocr_result.get('text', '')
                is_blank = self.is_blank_page(text, confidence)

                page_result = PageCheckResult(
                    page_number=page_idx + 1,
                    ocr_confidence=confidence,
                    text_content=text,
                    is_blank=is_blank,
                    is_readable=not is_blank and confidence >= self.ocr_confidence_threshold
                )
                page_results.append(page_result)

                # Accumulate for overall checks
                all_text += text + " "
                ocr_confidences.append(confidence)
                if is_blank:
                    blank_pages += 1

            # Calculate text hash for near-duplicate detection
            if all_text.strip():
                text_hash = self.calculate_text_hash(all_text.strip())
                is_near_duplicate = self.is_near_duplicate(text_hash, set())  # existing_text_hashes would come from adapter
            else:
                text_hash = ""
                is_near_duplicate = False

            # Classify document type
            detected_type = await adapter.classify_document_type(file_content, all_text.strip() if all_text.strip() else None)
            type_valid = self.validate_document_type(detected_type, expected_types)

            # Validate metadata completeness
            # Define required metadata fields (would come from policy/request in real implementation)
            required_metadata_fields = ['patient_id', 'provider_id', 'service_date']
            metadata_completeness, missing_fields = self.validate_metadata_completeness(metadata, required_metadata_fields)

            # Check recency if requested
            recency_valid = True
            age_in_days = None
            if check_recency and request_id:
                max_age_days = await adapter.get_policy_recency_requirement(request_id)
                document_date = metadata.get('document_date') or metadata.get('service_date')
                recency_valid, age_in_days = self.validate_recency(document_date, max_age_days)

            # Calculate overall quality score
            # Weights for different components (can be adjusted)
            weights = {
                'ocr_confidence': 0.3,
                'blank_pages': 0.2,
                'duplicate': 0.2,
                'metadata': 0.2,
                'recency': 0.1
            }

            # OCR confidence score (average)
            avg_ocr_confidence = sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else 0.0
            ocr_score = avg_ocr_confidence  # Already 0-1

            # Blank pages score (inverse ratio)
            blank_score = 1.0 - (blank_pages / total_pages) if total_pages > 0 else 1.0

            # Duplicate score (0 if duplicate, 1 if not)
            duplicate_score = 0.0 if is_duplicate else 1.0

            # Metadata score
            metadata_score = metadata_completeness

            # Recency score (1 if valid or not checked, 0 if invalid)
            recency_score = 1.0 if recency_valid or not check_recency else 0.0

            # Calculate weighted score
            overall_score = (
                weights['ocr_confidence'] * ocr_score +
                weights['blank_pages'] * blank_score +
                weights['duplicate'] * duplicate_score +
                weights['metadata'] * metadata_score +
                weights['recency'] * recency_score
            )

            # Determine status based on score
            if overall_score >= 0.8:
                status = DocumentQualityStatus.EXCELLENT
            elif overall_score >= 0.6:
                status = DocumentQualityStatus.GOOD
            elif overall_score >= 0.4:
                status = DocumentQualityStatus.FAIR
            else:
                status = DocumentQualityStatus.POOR

            # Create and return result
            result = DocumentQualityResult(
                document_id=document_data.get('document_name', 'unknown').split('.')[0],  # Remove extension
                request_id=request_id,
                overall_score=overall_score,
                status=status,
                page_results=page_results,
                ocr_confidence_avg=avg_ocr_confidence,
                blank_page_count=blank_pages,
                total_page_count=total_pages,
                is_duplicate=is_duplicate,
                is_near_duplicate=is_near_duplicate,
                document_type=detected_type,
                document_type_valid=type_valid,
                metadata_completeness=metadata_completeness,
                missing_metadata_fields=missing_fields,
                recency_valid=recency_valid,
                age_in_days=age_in_days,
                file_hash=file_hash,
                text_hash=text_hash
            )

            logger.info(f"Document quality check completed. Score: {overall_score:.2f}, Status: {status.value}")
            return result

        except Exception as e:
            logger.error(f"Error during document quality check: {str(e)}", exc_info=True)
            # Return a failed result
            return DocumentQualityResult(
                document_id=document_data.get('document_name', 'unknown').split('.')[0],
                request_id=request_id,
                overall_score=0.0,
                status=DocumentQualityStatus.FAILED,
                page_results=[],
                ocr_confidence_avg=0.0,
                blank_page_count=0,
                total_page_count=0,
                is_duplicate=False,
                is_near_duplicate=False,
                document_type="unknown",
                document_type_valid=False,
                metadata_completeness=0.0,
                missing_metadata_fields=[],
                recency_valid=False,
                age_in_days=None,
                file_hash=file_hash if 'file_hash' in locals() else "",
                text_hash=text_hash if 'text_hash' in locals() else ""
            )


# Factory function for creating checker instance
def create_document_quality_checker() -> DocumentQualityChecker:
    """Factory function to create a DocumentQualityChecker instance."""
    return DocumentQualityChecker()