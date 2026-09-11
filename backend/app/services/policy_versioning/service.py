"""
Policy Versioning Service

This service orchestrates the policy version comparison process.
It uses the comparator and adapter to perform version analysis on policies.
"""

import logging
from typing import Optional, Dict, Any, List
from .comparator import PolicyVersionComparator, create_policy_version_comparator
from .adapter import PolicyVersioningAdapter
from .models import PolicyVersionInfo, PolicyComparisonResult
from .schemas import PolicyVersionCreateRequest, PolicyVersionResponse

logger = logging.getLogger(__name__)


class PolicyVersioningService:
    """
    Main service for policy versioning and comparison.
    Coordinates between comparator, adapter, and any external services.
    """

    def __init__(self, comparator: Optional[PolicyVersionComparator] = None,
                 adapter: Optional[PolicyVersioningAdapter] = None):
        """
        Initialize the service with comparator and adapter instances.

        Args:
            comparator: PolicyVersionComparator instance (creates default if None)
            adapter: PolicyVersioningAdapter instance (creates default if None)
        """
        self.comparator = comparator or create_policy_version_comparator()
        self.adapter = adapter or PolicyVersioningAdapter()

    async def create_policy_version(
        self,
        policy_id: str,
        version_data: PolicyVersionCreateRequest
    ) -> PolicyVersionResponse:
        """
        Create a new policy version.

        Args:
            policy_id: Unique identifier for the policy
            version_data: Data for the new policy version

        Returns:
            PolicyVersionResponse containing the created version
        """
        logger.info(f"Creating policy version for policy_id: {policy_id}, version: {version_data.version}")

        try:
            # In a real implementation, this would save the version to a database
            # For now, we'll just return the data as if it was saved

            # Convert effective_date string to datetime for internal processing if needed
            # For the response, we'll keep it as string

            response = PolicyVersionResponse(
                policy_id=policy_id,
                version=version_data.version,
                effective_date=version_data.effective_date,
                payer=version_data.payer,
                procedure=version_data.procedure,
                requirements=version_data.requirements
            )

            logger.info(f"Successfully created policy version {version_data.version} for policy {policy_id}")
            return response

        except Exception as e:
            logger.error(f"Error creating policy version for policy_id: {policy_id}: {str(e)}")
            raise

    async def get_policy_versions(
        self,
        policy_id: str
    ) -> List[PolicyVersionResponse]:
        """
        Get all versions of a policy.

        Args:
            policy_id: Unique identifier for the policy

        Returns:
            List of PolicyVersionResponse objects
        """
        logger.info(f"Getting all versions for policy_id: {policy_id}")

        try:
            # In a real implementation, this would fetch from a database
            # For now, we'll return mock data or empty list

            # Get versions from adapter
            versions_data = await self.adapter.get_policy_versions(policy_id)

            # Convert to response objects
            versions = []
            for version_data in versions_data:
                response = PolicyVersionResponse(
                    policy_id=version_data.policy_id,
                    version=version_data.version,
                    effective_date=version_data.effective_date.isoformat() if hasattr(version_data.effective_date, 'isoformat') else str(version_data.effective_date),
                    payer=version_data.payer,
                    procedure=version_data.procedure,
                    requirements=version_data.requirements
                )
                versions.append(response)

            logger.info(f"Retrieved {len(versions)} versions for policy {policy_id}")
            return versions

        except Exception as e:
            logger.error(f"Error getting policy versions for policy_id: {policy_id}: {str(e)}")
            # Return empty list on error to avoid breaking the flow
            return []

    async def compare_policy_versions(
        self,
        policy_id: str,
        base_version: str,
        compared_version: str
    ) -> PolicyComparisonResult:
        """
        Compare two versions of a policy.

        Args:
            policy_id: Unique identifier for the policy
            base_version: The version to compare from (older)
            compared_version: The version to compare against (newer)

        Returns:
            PolicyComparisonResult containing the comparison results
        """
        logger.info(f"Comparing policy {policy_id} versions {base_version} vs {compared_version}")

        try:
            # Get the policy versions from adapter
            base_version_data = await self.adapter.get_policy_version(policy_id, base_version)
            compared_version_data = await self.adapter.get_policy_version(policy_id, compared_version)

            if not base_version_data:
                raise ValueError(f"Base version {base_version} not found for policy {policy_id}")

            if not compared_version_data:
                raise ValueError(f"Compared version {compared_version} not found for policy {policy_id}")

            # Perform the comparison using the comparator
            result = self.comparator.compare_policy_versions(base_version_data, compared_version_data)

            logger.info(f"Successfully compared policy versions for policy {policy_id}")
            return result

        except Exception as e:
            logger.error(f"Error comparing policy versions for policy_id: {policy_id}: {str(e)}")
            raise

    async def get_policy_version_changes(
        self,
        policy_id: str,
        version: str
    ) -> List[Dict[str, Any]]:
        """
        Get changes for a specific policy version compared to its previous version.

        Args:
            policy_id: Unique identifier for the policy
            version: The version to get changes for

        Returns:
            List of changes compared to the previous version
        """
        logger.info(f"Getting changes for policy {policy_id} version {version}")

        try:
            # Get all versions for the policy
            versions = await self.get_policy_versions(policy_id)

            # Find the specified version and its previous version
            version_objects = []
            for v in versions:
                version_objects.append({
                    'version': v.version,
                    'effective_date': v.effective_date,
                    'payer': v.payer,
                    'procedure': v.procedure,
                    'requirements': v.requirements
                })

            # Sort by effective date
            version_objects.sort(key=lambda x: x['effective_date'])

            # Find the index of the specified version
            target_index = None
            for i, v in enumerate(version_objects):
                if v['version'] == version:
                    target_index = i
                    break

            if target_index is None:
                raise ValueError(f"Version {version} not found for policy {policy_id}")

            if target_index == 0:
                # No previous version to compare against
                return []

            # Get previous version
            prev_version = version_objects[target_index - 1]

            # Create PolicyVersionInfo objects for comparison
            from .models import PolicyVersionInfo
            from datetime import datetime

            base_info = PolicyVersionInfo(
                version=prev_version['version'],
                effective_date=prev_version['effective_date'] if isinstance(prev_version['effective_date'], datetime)
                            else datetime.fromisoformat(prev_version['effective_date'].replace('Z', '+00:00')),
                payer=prev_version['payer'],
                procedure=prev_version['procedure'],
                requirements=prev_version['requirements'],
                requirement_map={}  # Will be populated by the comparator if needed
            )

            compared_info = PolicyVersionInfo(
                version=version_objects[target_index]['version'],
                effective_date=version_objects[target_index]['effective_date'] if isinstance(version_objects[target_index]['effective_date'], datetime)
                            else datetime.fromisoformat(version_objects[target_index]['effective_date'].replace('Z', '+00:00')),
                payer=version_objects[target_index]['payer'],
                procedure=version_objects[target_index]['procedure'],
                requirements=version_objects[target_index]['requirements'],
                requirement_map={}
            )

            # Perform comparison
            result = self.comparator.compare_policy_versions(base_info, compared_info)

            # Convert to list of dicts for easier consumption
            changes = []
            for change in result.changes:
                changes.append({
                    'requirement_id': change.requirement_id,
                    'change_type': change.change_type.value,
                    'old_text': change.old_text,
                    'new_text': change.new_text,
                    'section': change.section
                })

            logger.info(f"Retrieved {len(changes)} changes for policy {policy_id} version {version}")
            return changes

        except Exception as e:
            logger.error(f"Error getting policy version changes for policy_id: {policy_id}, version: {version}: {str(e)}")
            raise


# Factory function for creating service instance
def create_policy_versioning_service() -> PolicyVersioningService:
    """Factory function to create a PolicyVersioningService instance."""
    return PolicyVersioningService()