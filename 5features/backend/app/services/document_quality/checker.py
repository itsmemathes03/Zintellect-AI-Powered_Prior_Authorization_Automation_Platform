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
from typing import List, Tuple, Optional, Dict, Any
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

    def check_blank_pages(self, page_images: List[Any]) -> List[int]:
        """
        Check for blank pages in a document.

        Args:
            page_images: List of page images (would be processed by OCR engine in reality)

        Returns:
            List of page numbers (1-indexed) that are blank
        """
        blank_pages = []
        # Placeholder implementation - in reality this would analyze image content
        # For now, we'll return an empty list
        return blank_pages

    def check_ocr_quality(self, page_results: List[Dict[str, Any]]) -> Tuple[Optional[float], List[PageCheckResult]]:
        """
        Check OCR quality across all pages.

        Args:
            page_results: List of OCR results per page

        Returns:
            Tuple of (average_ocr_confidence, detailed_page_results)
        """
        if not page_results:
            return None, []

        confidences = []
        page_checks = []

        for i, result in enumerate(page_results):
            confidence = result.get('confidence', 0.0)
            confidences.append(confidence)

            is_readable = confidence >= self.ocr_confidence_threshold
            page_checks.append(PageCheckResult(
                page_number=i+1,
                is_blank=result.get('is_blank', False),
                ocr_confidence=confidence,
                is_readable=is_readable
            ))

        avg_confidence = sum(confidences) / len(confidences) if confidences else None
        return avg_confidence, page_checks

    def detect_duplicate_document(self, file_hash: str, existing_hashes: set) -> str:
        """
        Detect if document is a duplicate based on file hash.

        Args:
            file_hash: SHA-256 hash of current document
            existing_hashes: Set of hashes from existing documents

        Returns:
            Duplicate status: "UNIQUE", "DUPLICATE", or "NEAR_DUPLICATE"
        """
        if file_hash in existing_hashes:
            return "DUPLICATE"
        # In a real implementation, we might also check for near-duplicates using text hash
        return "UNIQUE"

    def validate_document_type(self, detected_type: str, expected_types: List[str]) -> Tuple[bool, str]:
        """
        Validate that detected document type matches expected types.

        Args:
            detected_type: Document type detected by classifier
            expected_types: List of acceptable document types for this context

        Returns:
            Tuple of (is_valid, detected_type)
        """
        is_valid = detected_type in expected_types if expected_types else True
        return is_valid, detected_type

    def check_metadata_completeness(self, metadata: Dict[str, Any]) -> List[str]:
        """
        Check for missing required metadata fields.

        Args:
            metadata: Dictionary of metadata fields

        Returns:
            List of missing field names
        """
        required_fields = ['patient_id', 'provider_id', 'service_date']  # Example fields
        missing = [field for field in required_fields if not metadata.get(field)]
        return missing

    def extract_document_date(self, metadata: Dict[str, Any]) -> Optional[str]:
        """
        Extract document date from metadata.

        Args:
            metadata: Dictionary of metadata fields

        Returns:
            Document date string or None if not found
        """
        # Try common date fields
        date_fields = ['document_date', 'service_date', 'date_created', 'date']
        for field in date_fields:
            if metadata.get(field):
                return str(metadata[field])
        return None

    def check_recency_requirement(self, document_date: str, max_days_old: int) -> Tuple[bool, Optional[str]]:
        """
        Check if document is suspiciously outdated based on policy recency requirement.

        Args:
            document_date: Date string of document
            max_days_old: Maximum allowed age in days from policy

        Returns:
            Tuple of (is_recent_enough, warning_message)
        """
        # Placeholder implementation - in reality this would parse the date and compare
        # For now, we'll assume it's recent enough
        return True, None

    def perform_quality_check(
        self,
        file_content: bytes,
        document_id: str,
        document_name: str,
        existing_hashes: Optional[set] = None,
        expected_document_types: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        policy_recency_days: Optional[int] = None
    ) -> DocumentQualityResult:
        """
        Perform comprehensive document quality check.

        Args:
            file_content: Raw bytes of the document
            document_id: Unique identifier for the document
            document_name: Name/filename of the document
            existing_hashes: Set of hashes from existing documents for duplicate detection
            expected_document_types: List of acceptable document types
            metadata: Dictionary of metadata fields
            policy_recency_days: Maximum allowed age in days from policy (if recency check needed)

        Returns:
            DocumentQualityResult containing all check results
        """
        if existing_hashes is None:
            existing_hashes = set()
        if metadata is None:
            metadata = {}

        # Initialize results
        warnings = []
        blank_pages = []
        possible_missing_pages = []

        # 1. File hash for duplicate detection
        file_hash = self.calculate_file_hash(file_content)
        duplicate_status = self.detect_duplicate_document(file_hash, existing_hashes)

        if duplicate_status == "DUPLICATE":
            warnings.append("Document appears to be a duplicate of an existing document")

        # 2. OCR quality check (placeholder - would use actual OCR results)
        # In reality, we would call OCR engine here and get page-by-page results
        ocr_confidence, page_results = self.check_ocr_quality([])  # Empty for placeholder

        # Extract blank pages from OCR results
        blank_pages = [result.page_number for result in page_results if result.is_blank]

        # 3. Document type validation (placeholder)
        detected_document_type = "unknown"  # Would come from document classifier
        is_type_valid, validated_type = self.validate_document_type(
            detected_document_type,
            expected_document_types or []
        )

        if not is_type_valid and expected_document_types:
            warnings.append(f"Document type '{detected_document_type}' does not match expected types: {expected_document_types}")
            detected_document_type = validated_type  # Use the validated version

        # 4. Metadata completeness check
        missing_metadata = self.check_metadata_completeness(metadata)
        if missing_metadata:
            warnings.append(f"Missing metadata fields: {', '.join(missing_metadata)}")

        # 5. Document date extraction and recency check
        document_date = self.extract_document_date(metadata)
        recency_warning = None
        if document_date and policy_recency_days is not None:
            is_recent, warning = self.check_recency_requirement(document_date, policy_recency_days)
            if not is_recent and warning:
                warnings.append(warning)
                recency_warning = warning

        # 6. Calculate overall quality score (simplified)
        quality_score = 100.0  # Start perfect

        # Deduct for issues
        if blank_pages:
            quality_score -= len(blank_pages) * 10  # 10 points per blank page
        if missing_metadata:
            quality_score -= len(missing_metadata) * 5  # 5 points per missing field
        if not is_type_valid and expected_document_types:
            quality_score -= 20  # 20 points for wrong document type
        if duplicate_status == "DUPLICATE":
            quality_score -= 30  # 30 points for duplicate
        if ocr_confidence is not None and ocr_confidence < self.ocr_confidence_threshold:
            quality_score -= (self.ocr_confidence_threshold - ocr_confidence) * 100  # Scale OCR issues

        # Ensure score is within bounds
        quality_score = max(0.0, min(100.0, quality_score))

        # Determine quality status
        if quality_score >= 90:
            quality_status = DocumentQualityStatus.GOOD
            recommended_action = "Document quality is acceptable for processing."
        elif quality_score >= 70:
            quality_status = DocumentQualityStatus.WARNING
            recommended_action = "Document has some quality issues but may be usable. Review recommended."
        else:
            quality_status = DocumentQualityStatus.FAIL
            recommended_action = "Document quality is poor. Consider obtaining a better copy before continuing."

        # Add specific warnings to recommended action if needed
        if blank_pages:
            recommended_action += f" Found {len(blank_pages)} blank page(s)."
        if missing_metadata:
            recommended_action += f" Missing metadata: {', '.join(missing_metadata)}."
        if not is_type_valid and expected_document_types:
            recommended_action += f" Document type mismatch detected."

        return DocumentQualityResult(
            document_id=document_id,
            document_name=document_name,
            quality_status=quality_status,
            overall_quality=quality_score,
            ocr_quality=ocr_confidence,
            page_count=len(page_results) if page_results else 0,  # Placeholder
            blank_pages=blank_pages,
            possible_missing_pages=possible_missing_pages,
            duplicate_status=duplicate_status,
            detected_document_type=detected_document_type,
            warnings=warnings,
            recommended_action=recommended_action
        )


# Factory function for creating checker instance
def create_document_quality_checker() -> DocumentQualityChecker:
    """Factory function to create a DocumentQualityChecker instance."""
    return DocumentQualityChecker()