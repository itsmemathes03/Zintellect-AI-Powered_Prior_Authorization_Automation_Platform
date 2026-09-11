"""
Matching engine for the Evidence-to-Policy Traceability module.
Contains the core logic for comparing policy requirements with clinical evidence.
"""

import re
from typing import List, Tuple, Dict, Any
from .schemas import EvidenceItem, PolicyRequirement, MatchStatus, EvidenceMatch, RequirementResult, SummaryStatistics, EvidenceToPolicyOutput
from .models import PolicyRequirements, ClinicalEvidence


class EvidenceToPolicyEngine:
    """Engine for matching policy requirements with clinical evidence."""

    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize the matching engine.

        Args:
            similarity_threshold: Minimum similarity score to consider a match (0-1)
        """
        self.similarity_threshold = similarity_threshold

    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings using simple word overlap.
        This is a lightweight approach suitable for the standalone module.

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score between 0 and 1
        """
        # Convert to lowercase and split into words
        words1 = set(re.findall(r'\b\w+\b', text1.lower()))
        words2 = set(re.findall(r'\b\w+\b', text2.lower()))

        # Handle empty sets
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0

        # Calculate Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    def _extract_key_phrases(self, text: str) -> List[str]:
        """
        Extract key phrases from text for better matching.
        Simple implementation that looks for medical-relevant patterns.

        Args:
            text: Input text

        Returns:
            List of key phrases
        """
        # Convert to lowercase
        text_lower = text.lower()

        # Look for common medical patterns
        patterns = [
            r'\b\d+\.?\d*\s*(?:mg|ml|g|mcg|iu|units?)\b',  # Measurements
            r'\b(?:patient|pt)\s+(?:has|reports?|exhibits?|shows?)\s+[^.]*\.?',  # Patient statements
            r'\b(?:diagnosed?with|suffering?from|history?of)\s+[^.]*\.?',  # Diagnosis patterns
            r'\b(?:treatment|therapy|medication)\s+[^.]*\.?',  # Treatment patterns
        ]

        phrases = []
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            phrases.extend(matches)

        # Also extract significant noun phrases (simplified)
        words = re.findall(r'\b[a-z]+\b', text_lower)
        # Filter out common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
        significant_words = [w for w in words if w not in stop_words and len(w) > 2]

        # Add individual significant words as phrases
        phrases.extend(significant_words[:10])  # Limit to top 10

        return list(set(phrases))  # Remove duplicates

    def _match_requirement_to_evidence(self, requirement: PolicyRequirement, evidence_items: List[EvidenceItem]) -> Tuple[List[EvidenceMatch], MatchStatus, float, str]:
        """
        Match a single policy requirement against clinical evidence.

        Args:
            requirement: The policy requirement to match
            evidence_items: List of clinical evidence items

        Returns:
            Tuple of (matching_evidence, status, confidence_score, explanation)
        """
        if not evidence_items:
            return [], MatchStatus.MISSING, 0.1, "No clinical evidence provided for evaluation."

        requirement_text = requirement.description.lower()
        matches = []
        max_similarity = 0.0
        contradiction_found = False

        # Extract key phrases from requirement for better matching
        req_phrases = self._extract_key_phrases(requirement_text)

        for evidence in evidence_items:
            evidence_text = evidence.text.lower()

            # Calculate similarity using multiple approaches
            # 1. Direct text similarity
            direct_sim = self._calculate_text_similarity(requirement_text, evidence_text)

            # 2. Phrase-based similarity
            evidence_phrases = self._extract_key_phrases(evidence_text)
            phrase_matches = sum(1 for phrase in req_phrases if any(phrase in ev_phrase or ev_phrase in phrase for ev_phrase in evidence_phrases))
            phrase_sim = phrase_matches / max(len(req_phrases), 1) if req_phrases else 0.0

            # 3. Entity-based matching (if entity information is available)
            entity_sim = 0.0
            if requirement.type and evidence.entity_type:
                if requirement.type.lower() == evidence.entity_type.lower():
                    entity_sim = 0.3  # Bonus for matching entity types
                elif evidence.entity_value and evidence.entity_value.lower() in requirement_text:
                    entity_sim = 0.4  # Bonus for matching entity values

            # Combined similarity score
            similarity = max(direct_sim, phrase_sim) + entity_sim
            similarity = min(similarity, 1.0)  # Cap at 1.0

            # Update max similarity and collect matches above threshold
            if similarity > max_similarity:
                max_similarity = similarity

            if similarity >= self.similarity_threshold:
                evidence_match = EvidenceMatch(
                    evidence_id=evidence.evidence_id,
                    text=evidence.text,
                    document_id=evidence.document_id,
                    document_name=evidence.document_name,
                    page=evidence.page,
                    section=evidence.section,
                    confidence=evidence.confidence
                )
                matches.append(evidence_match)

            # Simple contradiction detection (word-boundary matching)
            # Uses regex to avoid false positives from substring matches
            # (e.g. 'no' inside 'lab_results' or 'clinical').
            contradiction_indicators = [r'\bno\b', r'\bnot\b', r'\bnegative\b', r'\babsent\b', r'\bdenies\b', r'\brule out\b', r'\bwithout\b']
            req_has_negation = any(re.search(indicator, requirement_text) for indicator in contradiction_indicators)
            evidence_has_negation = any(re.search(indicator, evidence_text) for indicator in contradiction_indicators)

            # If requirement is positive but evidence is negative (or vice versa), flag as potential contradiction
            if req_has_negation != evidence_has_negation and similarity > 0.3:  # Only if there's some similarity
                contradiction_found = True

        # Determine match status and confidence
        if not matches:
            # No matches found above threshold
            if contradiction_found and max_similarity > 0.5:
                status = MatchStatus.CONTRADICTED
                confidence = max(0.6, min(0.9, max_similarity))
                explanation = f"Contradictory evidence found regarding requirement: '{requirement.description}'. No clear supporting evidence identified."
            else:
                status = MatchStatus.MISSING
                confidence = max(0.1, 1.0 - max_similarity)  # Higher confidence in missing if similarity is low
                explanation = f"No supporting clinical evidence found for requirement: '{requirement.description}'"
        else:
            # Matches found
            if contradiction_found:
                status = MatchStatus.CONTRADICTED
                confidence = max(0.6, min(0.9, (max_similarity + 0.5) / 2))  # Reduce confidence due to contradiction
                explanation = f"Found {len(matches)} supporting evidence item(s) for requirement: '{requirement.description}', but contradictory evidence was also detected."
            else:
                status = MatchStatus.MATCHED
                # Confidence based on average evidence confidence and similarity
                avg_evidence_confidence = sum(e.confidence for e in matches) / len(matches) if matches else 0.5
                confidence = min(0.95, max(0.7, (max_similarity + avg_evidence_confidence) / 2))
                explanation = f"Found {len(matches)} supporting evidence item(s) for requirement: '{requirement.description}'"

        return matches, status, confidence, explanation

    def process_evidence_to_policy(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing function for evidence-to-policy traceability.

        Args:
            input_data: Input data matching the EvidenceToPolicyInput schema

        Returns:
            Output data matching the EvidenceToPolicyOutput schema
        """
        # Extract input data
        request_id = input_data.get("request_id", "")
        procedure = input_data.get("procedure")
        policy_data = input_data.get("policy", {})
        clinical_evidence_data = input_data.get("clinical_evidence", [])

        # Parse policy requirements
        requirements_data = policy_data.get("requirements", [])
        requirements = [
            PolicyRequirement(
                requirement_id=req.get("requirement_id", f"REQ-{i}"),
                description=req.get("description", ""),
                type=req.get("type"),
                weight=req.get("weight", 1.0)
            )
            for i, req in enumerate(requirements_data)
        ]

        # Parse clinical evidence
        evidence_items = [
            EvidenceItem(
                evidence_id=ev.get("evidence_id", f"E-{i}"),
                text=ev.get("text", ""),
                document_id=ev.get("document_id", f"DOC-{i}"),
                document_name=ev.get("document_name", "unknown"),
                page=ev.get("page"),
                section=ev.get("section"),
                entity_type=ev.get("entity_type"),
                entity_value=ev.get("entity_value"),
                confidence=ev.get("confidence", 0.8)
            )
            for i, ev in enumerate(clinical_evidence_data)
        ]

        # Process each requirement
        results = []
        summary_counts = {
            "total_requirements": len(requirements),
            "matched": 0,
            "missing": 0,
            "uncertain": 0,
            "contradicted": 0
        }

        for requirement in requirements:
            matches, status, confidence, explanation = self._match_requirement_to_evidence(requirement, evidence_items)

            # Count by status
            if status == MatchStatus.MATCHED:
                summary_counts["matched"] += 1
            elif status == MatchStatus.MISSING:
                summary_counts["missing"] += 1
            elif status == MatchStatus.UNCERTAIN:
                summary_counts["uncertain"] += 1
            elif status == MatchStatus.CONTRADICTED:
                summary_counts["contradicted"] += 1

            requirement_result = RequirementResult(
                requirement_id=requirement.requirement_id,
                requirement=requirement.description,
                status=status,
                confidence=confidence,
                evidence=matches,
                explanation=explanation
            )

            results.append(requirement_result)

        # Create summary statistics
        summary = SummaryStatistics(
            total_requirements=summary_counts["total_requirements"],
            matched=summary_counts["matched"],
            missing=summary_counts["missing"],
            uncertain=summary_counts["uncertain"],
            contradicted=summary_counts["contradicted"]
        )

        # Create final output
        output = EvidenceToPolicyOutput(
            request_id=request_id,
            feature="evidence_to_policy_trace",
            results=results,
            summary=summary
        )

        return output.model_dump()
