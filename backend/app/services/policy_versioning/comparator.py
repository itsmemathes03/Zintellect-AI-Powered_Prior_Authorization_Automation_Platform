"""
Policy Version Comparator

This module implements the core logic for comparing policy versions and detecting changes.
It is designed to be independent of web framework dependencies.
"""

import hashlib
import logging
from typing import List, Dict, Any, Tuple, Optional
from .models import PolicyVersionInfo, PolicyComparisonResult, RequirementChange, ChangeType
from datetime import datetime

logger = logging.getLogger(__name__)


class PolicyVersionComparator:
    """
    Main class for comparing policy versions and detecting changes.
    """

    def __init__(self):
        # In a real implementation, we might have configurable similarity thresholds
        self.similarity_threshold = 0.8  # For detecting modified requirements

    def _generate_requirement_id(self, requirement_text: str, index: int) -> str:
        """
        Generate a stable ID for a requirement based on its text and position.
        This helps track requirements across versions even if they move slightly.

        Args:
            requirement_text: The text of the requirement
            index: Position index in the requirements list

        Returns:
            A hash-based ID for the requirement
        """
        # Create a hash based on the requirement text and index
        # Using index helps distinguish similar requirements at different positions
        text_for_hash = f"{requirement_text}:{index}"
        return hashlib.md5(text_for_hash.encode()).hexdigest()[:12]

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for comparison by removing extra whitespace and converting to lowercase.

        Args:
            text: The text to normalize

        Returns:
            Normalized text string
        """
        return ' '.join(text.lower().split())

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings.
        Simple implementation using normalized text comparison.
        In a real implementation, we might use more sophisticated algorithms.

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score between 0.0 and 1.0
        """
        norm1 = self._normalize_text(text1)
        norm2 = self._normalize_text(text2)

        if norm1 == norm2:
            return 1.0
        if not norm1 or not norm2:
            return 0.0

        # Simple similarity based on common words
        words1 = set(norm1.split())
        words2 = set(norm2.split())

        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    def _find_matching_requirement(
        self,
        req_text: str,
        req_index: int,
        existing_requirements: List[str],
        existing_ids: List[str],
        used_indices: set
    ) -> Tuple[Optional[str], Optional[int], float]:
        """
        Find the best matching requirement in the existing list for a given requirement.

        Args:
            req_text: The requirement text to match
            req_index: Index of the requirement in the new list
            existing_requirements: List of existing requirement texts
            existing_ids: List of existing requirement IDs
            used_indices: Set of indices already matched

        Returns:
            Tuple of (matched_requirement_id, matched_index, similarity_score)
        """
        best_match_id = None
        best_match_index = None
        best_similarity = 0.0

        for i, existing_text in enumerate(existing_requirements):
            if i in used_indices:
                continue

            similarity = self._calculate_similarity(req_text, existing_text)

            # Prefer exact matches, then high similarity matches
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_index = i
                best_match_id = existing_ids[i]

        # Only return a match if similarity is above threshold
        if best_similarity >= self.similarity_threshold:
            return best_match_id, best_match_index, best_similarity
        else:
            return None, None, 0.0

    def compare_policy_versions(
        self,
        base_version: PolicyVersionInfo,
        compared_version: PolicyVersionInfo
    ) -> PolicyComparisonResult:
        """
        Compare two policy versions and detect changes.

        Args:
            base_version: The original policy version
            compared_version: The new policy version to compare against

        Returns:
            PolicyComparisonResult containing all detected changes
        """
        logger.info(f"Comparing policy {base_version.policy_id} versions {base_version.version} vs {compared_version.version}")

        # Generate IDs for requirements in both versions
        base_req_ids = [
            self._generate_requirement_id(req, i)
            for i, req in enumerate(base_version.requirements)
        ]
        compared_req_ids = [
            self._generate_requirement_id(req, i)
            for i, req in enumerate(compared_version.requirements)
        ]

        # Track which requirements have been matched
        used_base_indices = set()
        used_compared_indices = set()
        changes = []

        # First pass: Find exact matches and high similarity matches (modified requirements)
        for i, (req_text, req_id) in enumerate(zip(compared_version.requirements, compared_req_ids)):
            match_id, match_index, similarity = self._find_matching_requirement(
                req_text, i,
                base_version.requirements, base_req_ids,
                used_base_indices
            )

            if match_id is not None and match_index is not None:
                # Found a match - check if it's modified or unchanged
                used_base_indices.add(match_index)
                used_compared_indices.add(i)

                if similarity < 1.0:
                    # Modified requirement
                    changes.append(RequirementChange(
                        requirement_id=req_id,
                        change_type=ChangeType.MODIFIED,
                        old_text=base_version.requirements[match_index],
                        new_text=req_text,
                        section=None  # In a real implementation, we might extract section info
                    ))
                    logger.debug(f"Modified requirement: {req_id} (similarity: {similarity:.2f})")
                else:
                    # Unchanged requirement
                    changes.append(RequirementChange(
                        requirement_id=req_id,
                        change_type=ChangeType.UNCHANGED,
                        old_text=req_text,
                        new_text=req_text,
                        section=None
                    ))
                    logger.debug(f"Unchanged requirement: {req_id}")

        # Second pass: Find unmatched requirements in compared version (added requirements)
        for i, (req_text, req_id) in enumerate(zip(compared_version.requirements, compared_req_ids)):
            if i not in used_compared_indices:
                # This requirement was not found in base version - it's new
                changes.append(RequirementChange(
                    requirement_id=req_id,
                    change_type=ChangeType.ADDED,
                    old_text=None,
                    new_text=req_text,
                    section=None
                ))
                logger.debug(f"Added requirement: {req_id}")

        # Third pass: Find unmatched requirements in base version (removed requirements)
        for i, (req_text, req_id) in enumerate(zip(base_version.requirements, base_req_ids)):
            if i not in used_base_indices:
                # This requirement was not found in compared version - it was removed
                changes.append(RequirementChange(
                    requirement_id=req_id,
                    change_type=ChangeType.REMOVED,
                    old_text=req_text,
                    new_text=None,
                    section=None
                ))
                logger.debug(f"Removed requirement: {req_id}")

        # Sort changes for consistent output: ADDED, REMOVED, MODIFIED, UNCHANGED
        change_order = {ChangeType.ADDED: 0, ChangeType.REMOVED: 1, ChangeType.MODIFIED: 2, ChangeType.UNCHANGED: 3}
        changes.sort(key=lambda x: change_order[x.change_type])

        # Generate summary statistics
        summary = {
            "total_requirements_base": len(base_version.requirements),
            "total_requirements_compared": len(compared_version.requirements),
            "added_count": len([c for c in changes if c.change_type == ChangeType.ADDED]),
            "removed_count": len([c for c in changes if c.change_type == ChangeType.REMOVED]),
            "modified_count": len([c for c in changes if c.change_type == ChangeType.MODIFIED]),
            "unchanged_count": len([c for c in changes if c.change_type == ChangeType.UNCHANGED])
        }

        # Generate impact assessment
        impact_assessment = self._generate_impact_assessment(summary, base_version, compared_version)

        # Create the result
        result = PolicyComparisonResult(
            policy_id=base_version.policy_id,  # Should be same as compared_version.policy_id
            payer=base_version.payer,  # Should be same as compared_version.payer
            procedure=base_version.procedure,  # Should be same as compared_version.procedure
            base_version=base_version.version,
            compared_version=compared_version.version,
            base_effective_date=base_version.effective_date,
            compared_effective_date=compared_version.effective_date,
            changes=changes,
            summary=summary,
            impact_assessment=impact_assessment
        )

        logger.info(f"Comparison complete: {summary['added_count']} added, {summary['removed_count']} removed, {summary['modified_count']} modified")
        return result

    def _generate_impact_assessment(
        self,
        summary: Dict[str, int],
        base_version: PolicyVersionInfo,
        compared_version: PolicyVersionInfo
    ) -> str:
        """
        Generate a human-readable impact assessment based on the changes.

        Args:
            summary: Dictionary with change counts
            base_version: The original policy version
            compared_version: The new policy version

        Returns:
            Impact assessment string
        """
        added = summary["added_count"]
        removed = summary["removed_count"]
        modified = summary["modified_count"]

        if added == 0 and removed == 0 and modified == 0:
            return "No changes detected between policy versions."

        parts = []
        if added > 0:
            parts.append(f"{added} requirement(s) added")
        if removed > 0:
            parts.append(f"{removed} requirement(s) removed")
        if modified > 0:
            parts.append(f"{modified} requirement(s) modified")

        change_summary = ", ".join(parts)

        # Add effective date information if it changed
        date_change = ""
        if base_version.effective_date != compared_version.effective_date:
            date_change = f" Effective date changed from {base_version.effective_date.strftime('%Y-%m-%d')} to {compared_version.effective_date.strftime('%Y-%m-%d')}."

        # Add overall impact assessment
        if added > 0 or removed > 0:
            impact = f"The policy has undergone significant changes with {change_summary}.{date_change}"
        elif modified > 0:
            impact = f"The policy requirements have been updated with {change_summary}.{date_change}"
        else:
            impact = f"Minor changes detected: {change_summary}.{date_change}"

        return impact


# Factory function for creating comparator instance
def create_policy_version_comparator() -> PolicyVersionComparator:
    """Factory function to create a PolicyVersionComparator instance."""
    return PolicyVersionComparator()