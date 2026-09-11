"""
Policy Versioning Adapter

This adapter interfaces with existing services in the Zintellect system:
- Policy storage/retrieval
- Policy version management

It abstracts these dependencies so the policy versioning service remains independent.

For the purpose of this implementation, we use an in-memory storage to allow
the feature to be tested and run without external dependencies. In a real
implementation, this would be replaced with actual service calls.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .models import PolicyVersionInfo

logger = logging.getLogger(__name__)


class PolicyVersioningAdapter:
    """
    Adapter for interfacing with existing Zintellect policy services.

    This adapter would normally connect to:
    - Policy storage service for retrieving policy versions
    - Policy version management service for creating new versions
    """

    def __init__(self):
        """
        Initialize the adapter with an in-memory storage for policy versions.
        In a real implementation, this would establish connections to actual services.
        """
        # In-memory storage: {policy_id: {version: PolicyVersionInfo}}
        self._storage: Dict[str, Dict[str, PolicyVersionInfo]] = {}
        self._initialized = False

    async def _ensure_initialized(self):
        """
        Ensure services are initialized.
        In a real implementation, this would initialize connections to actual services.
        For our in-memory storage, we just set the flag.
        """
        if self._initialized:
            return

        # Placeholder initialization - in reality, this would connect to actual services
        logger.info("Initializing policy versioning adapter with in-memory storage")
        self._initialized = True

        # Optionally, we could pre-load some data for testing
        # For now, we leave it empty and let tests or usage populate it.

    async def get_policy_version(
        self,
        policy_id: str,
        version: str
    ) -> Optional[PolicyVersionInfo]:
        """
        Retrieve a specific version of a policy.

        Args:
            policy_id: Unique identifier for the policy
            version: Version string to retrieve

        Returns:
            PolicyVersionInfo object or None if not found
        """
        await self._ensure_initialized()

        logger.info(f"Getting policy {policy_id} version {version}")

        # Get the policy from storage
        policy_versions = self._storage.get(policy_id)
        if not policy_versions:
            logger.warning(f"Policy {policy_id} not found in storage")
            return None

        version_info = policy_versions.get(version)
        if not version_info:
            logger.warning(f"Version {version} not found for policy {policy_id}")
            return None

        logger.info(f"Retrieved policy {policy_id} version {version}")
        return version_info

    async def get_policy_versions(
        self,
        policy_id: str
    ) -> List[PolicyVersionInfo]:
        """
        Get all versions of a policy.

        Args:
            policy_id: Unique identifier for the policy

        Returns:
            List of PolicyVersionInfo objects
        """
        await self._ensure_initialized()

        logger.info(f"Getting all versions for policy {policy_id}")

        policy_versions = self._storage.get(policy_id, {})
        versions = list(policy_versions.values())
        # Sort by effective date for consistency
        versions.sort(key=lambda x: x.effective_date)
        logger.info(f"Retrieved {len(versions)} versions for policy {policy_id}")
        return versions

    async def create_policy_version(
        self,
        policy_id: str,
        version_data: Dict[str, Any]
    ) -> PolicyVersionInfo:
        """
        Create a new policy version.

        Args:
            policy_id: Unique identifier for the policy
            version_data: Dictionary containing version information

        Returns:
            PolicyVersionInfo object representing the created version
        """
        await self._ensure_initialized()

        logger.info(f"Creating policy version for policy {policy_id}")

        # Ensure the policy exists in storage
        if policy_id not in self._storage:
            self._storage[policy_id] = {}

        # Create the PolicyVersionInfo from the input data
        # We expect version_data to have: version, effective_date, payer, procedure, requirements
        # We'll make a copy to avoid mutating the input
        version_info = PolicyVersionInfo(
            version=version_data.get('version', '1.0'),
            effective_date=version_data.get('effective_date', datetime.now()),
            payer=version_data.get('payer', 'Unknown'),
            procedure=version_data.get('procedure', 'Unknown'),
            requirements=version_data.get('requirements', []),
            requirement_map={}  # In a real implementation, this might be populated by the service
        )

        # Store it
        self._storage[policy_id][version_info.version] = version_info
        logger.info(f"Created policy version {version_info.version} for policy {policy_id}")

        return version_info


# Factory function for creating adapter instance
def create_policy_versioning_adapter() -> PolicyVersioningAdapter:
    """Factory function to create a PolicyVersioningAdapter instance."""
    return PolicyVersioningAdapter()