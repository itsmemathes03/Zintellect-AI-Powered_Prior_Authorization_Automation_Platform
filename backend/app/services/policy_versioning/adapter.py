"""
Policy Versioning Adapter

This adapter interfaces with existing services in the Zintellect system:
- Policy storage/retrieval via the InsurancePolicy database table
- Policy version management with an in-memory overlay

It abstracts these dependencies so the policy versioning service remains independent.
The InsurancePolicy table provides the canonical policy data; versioned snapshots
are stored in-memory and persisted to a JSON file for cross-reload durability.
"""

import json
import logging
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from .models import PolicyVersionInfo

logger = logging.getLogger(__name__)


# Persistent storage file — survives module reloads and server restarts
_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "__pycache__")
_STORAGE_FILE = os.path.join(_STORAGE_DIR, "policy_versions.json")


def _load_storage() -> Dict[str, Dict[str, Any]]:
    """Load persisted storage from disk."""
    if os.path.exists(_STORAGE_FILE):
        try:
            with open(_STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_storage(storage: Dict[str, Dict[str, Any]]) -> None:
    """Persist storage to disk."""
    try:
        os.makedirs(_STORAGE_DIR, exist_ok=True)
        with open(_STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(storage, f, default=str)
    except Exception as exc:
        logger.error(f"Failed to persist policy versions: {exc}")


def _load_db_policies() -> Dict[str, Dict[str, Any]]:
    """Load existing policies from the database as baseline versions."""
    baseline: Dict[str, Dict[str, Any]] = {}
    try:
        from app.database.db import SessionLocal
        from app.models.policy_model import InsurancePolicy
        import json as _json

        db = SessionLocal()
        try:
            for p in db.query(InsurancePolicy).all():
                pid = str(p.id)
                reqs = []
                try:
                    reqs = _json.loads(p.required_conditions) if p.required_conditions else []
                except Exception:
                    pass
                baseline[pid] = {
                    p.version or "1.0": {
                        "policy_id": pid,
                        "version": p.version or "1.0",
                        "effective_date": p.created_at.isoformat() if p.created_at else datetime.now().isoformat(),
                        "payer": p.insurance_provider or "",
                        "procedure": p.procedure_name or "",
                        "requirements": reqs,
                    }
                }
        finally:
            db.close()
    except Exception as exc:
        logger.warning(f"Could not load DB policies: {exc}")
    return baseline


class PolicyVersioningAdapter:
    """
    Adapter for interfacing with existing Zintellect policy services.

    This adapter would normally connect to:
    - Policy storage service for retrieving policy versions
    - Policy version management service for creating new versions
    """

    def __init__(self):
        """
        Initialize the adapter.  Loads baseline versions from the database
        and merges any previously-created versioned snapshots from disk.
        """
        self._storage: Dict[str, Dict[str, Any]] = _load_db_policies()
        # Merge any on-disk versioned snapshots
        disk = _load_storage()
        for pid, versions in disk.items():
            if pid not in self._storage:
                self._storage[pid] = {}
            self._storage[pid].update(versions)
        self._initialized = True

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

        version_data = policy_versions.get(version)
        if not version_data:
            logger.warning(f"Version {version} not found for policy {policy_id}")
            return None

        # Convert dict to PolicyVersionInfo if needed
        version_info = self._to_version_info(policy_id, version_data)
        logger.info(f"Retrieved policy {policy_id} version {version}")
        return version_info

    @staticmethod
    def _to_version_info(policy_id: str, data: Any) -> PolicyVersionInfo:
        """Convert a dict or PolicyVersionInfo to a PolicyVersionInfo."""
        if isinstance(data, PolicyVersionInfo):
            return data
        if isinstance(data, dict):
            ed = data.get('effective_date', datetime.now())
            if isinstance(ed, str):
                try:
                    ed = datetime.fromisoformat(ed)
                except (ValueError, TypeError):
                    ed = datetime.now()
            return PolicyVersionInfo(
                policy_id=data.get('policy_id', policy_id),
                version=data.get('version', '1.0'),
                effective_date=ed,
                payer=data.get('payer', 'Unknown'),
                procedure=data.get('procedure', 'Unknown'),
                requirements=data.get('requirements', []),
                requirement_map=data.get('requirement_map', {}),
            )
        return PolicyVersionInfo(
            policy_id=policy_id,
            version=str(data),
            effective_date=datetime.now(),
            payer='Unknown',
            procedure='Unknown',
            requirements=[],
            requirement_map={},
        )

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
        versions = [
            self._to_version_info(policy_id, v)
            for v in policy_versions.values()
        ]
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
        effective_date_raw = version_data.get('effective_date', datetime.now())
        if isinstance(effective_date_raw, str):
            try:
                from datetime import date
                effective_date_raw = datetime.fromisoformat(effective_date_raw)
            except (ValueError, TypeError):
                effective_date_raw = datetime.now()

        version_info = PolicyVersionInfo(
            policy_id=policy_id,
            version=version_data.get('version', '1.0'),
            effective_date=effective_date_raw,
            payer=version_data.get('payer', 'Unknown'),
            procedure=version_data.get('procedure', 'Unknown'),
            requirements=version_data.get('requirements', []),
            requirement_map={}  # In a real implementation, this might be populated by the service
        )

        # Store it
        self._storage[policy_id][version_info.version] = version_info
        _save_storage(self._storage)
        logger.info(f"Created policy version {version_info.version} for policy {policy_id}")

        return version_info


# Factory function for creating adapter instance
def create_policy_versioning_adapter() -> PolicyVersioningAdapter:
    """Factory function to create a PolicyVersioningAdapter instance."""
    return PolicyVersioningAdapter()