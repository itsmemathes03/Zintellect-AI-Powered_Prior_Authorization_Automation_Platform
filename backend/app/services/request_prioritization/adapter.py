"""
Adapter for the Request Prioritization service.
This adapter interfaces with existing services to get patient history, provider history, insurance details, and resource availability.
"""
import logging
from typing import Dict, Any, Optional
from .models import PrioritizationInput

logger = logging.getLogger(__name__)


class RequestPrioritizationAdapter:
    """
    Adapter to get additional context for prioritizing a PA request.
    In a real implementation, this would connect to the patient records, provider performance, insurance, and resource management services.
    """

    def __init__(self):
        """
        Initialize the adapter.
        We'll use a simple in-memory store for demonstration.
        """
        # In a real system, these would be connections to actual services.
        self._patient_store: Dict[str, Dict[str, Any]] = {}
        self._provider_store: Dict[str, Dict[str, Any]] = {}
        self._insurance_store: Dict[str, Dict[str, Any]] = {}
        self._resource_store: Dict[str, Dict[str, Any]] = {}
        self._initialized = False

    async def _ensure_initialized(self):
        if self._initialized:
            return
        logger.info("Initializing request prioritization adapter (mock)")
        # For demonstration, we'll add some mock data if the stores are empty.
        if not self._patient_store:
            self._patient_store["patient123"] = {
                "history": "Patient has a history of hypertension and diabetes. Previous procedures: knee surgery in 2020.",
                "chronic_conditions": ["hypertension", "diabetes"]
            }
        if not self._provider_store:
            self._provider_store["provider456"] = {
                "history": "Provider has a high approval rate for orthopedic procedures. Average processing time: 2 days.",
                "approval_rate": 0.9,
                "avg_processing_time_days": 2
            }
        if not self._insurance_store:
            self._insurance_store["ins789"] = {
                "plan_type": "PPO",
                "requires_prior_auth": True,
                "typical_processing_time_days": 3
            }
        if not self._resource_store:
            self._resource_store["procedure_ABC123"] = {
                "availability": "high",
                "facilities_available": 5,
                "next_available_slot": "2026-09-20"
            }
        self._initialized = True

    async def get_patient_history(self, patient_id: str) -> Optional[str]:
        """
        Retrieve a summary of the patient's history.

        Args:
            patient_id: The ID of the patient.

        Returns:
            A string summarizing the patient's history, or None if not found.
        """
        await self._ensure_initialized()
        logger.info(f"Fetching patient history for patient_id: {patient_id}")
        patient = self._patient_store.get(patient_id)
        if patient and "history" in patient:
            logger.info(f"Found patient history for {patient_id}")
            return patient["history"]
        logger.warning(f"No patient history found for patient_id: {patient_id}")
        return None

    async def get_provider_history(self, provider_id: str) -> Optional[str]:
        """
        Retrieve a summary of the provider's history.

        Args:
            provider_id: The ID of the provider.

        Returns:
            A string summarizing the provider's history, or None if not found.
        """
        await self._ensure_initialized()
        logger.info(f"Fetching provider history for provider_id: {provider_id}")
        provider = self._provider_store.get(provider_id)
        if provider and "history" in provider:
            logger.info(f"Found provider history for {provider_id}")
            return provider["history"]
        logger.warning(f"No provider history found for provider_id: {provider_id}")
        return None

    async def get_insurance_details(self, insurance_info: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Retrieve or enrich insurance details.

        Args:
            insurance_info: The insurance information from the request (if any).

        Returns:
            An enriched insurance information dictionary, or None if not found.
        """
        await self._ensure_initialized()
        # If we don't have insurance_info, we can't look it up. In a real system, we might have an insurance ID.
        # For now, we'll just return the input or a mock.
        logger.info("Fetching insurance details")
        # In a real system, we would use an insurance ID from the request to look up in a database.
        # We'll just return the input for now, but we could enrich it with data from self._insurance_store.
        # For demonstration, we'll return the input if it exists, otherwise a mock.
        if insurance_info is None:
            logger.warning("No insurance info in request, returning mock")
            return {
                "plan_type": "Unknown",
                "requires_prior_auth": True,
                "typical_processing_time_days": 3
            }
        # We'll just return the input as is, but we could add more details here.
        logger.info("Returning insurance info as is (or enriched in a real system)")
        return insurance_info

    async def get_resource_availability(self, procedure_code: str, location: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieve resource availability for a procedure.

        Args:
            procedure_code: The procedure code (e.g., CPT code).
            location: Optional location (e.g., city, region) to check availability.

        Returns:
            A dictionary with resource availability information, or None if not found.
        """
        await self._ensure_initialized()
        logger.info(f"Fetching resource availability for procedure_code: {procedure_code}, location: {location}")
        # In a real system, we would look up the procedure code in a resource management system.
        # We'll return mock data based on the procedure_code.
        resource = self._resource_store.get(procedure_code)
        if resource:
            logger.info(f"Found resource availability for {procedure_code}")
            return resource
        logger.warning(f"No resource availability found for procedure_code: {procedure_code}")
        return None


# Factory function
def create_request_prioritization_adapter() -> RequestPrioritizationAdapter:
    return RequestPrioritizationAdapter()