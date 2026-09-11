"""
Service for the Request Prioritization feature.
"""
import logging
from typing import Optional
from .prioritizer import RequestPrioritizer, create_request_prioritizer
from .adapter import RequestPrioritizationAdapter
from .models import PrioritizationResult
from .schemas import PrioritizationRequest, PrioritizationResponse

logger = logging.getLogger(__name__)


class RequestPrioritizationService:
    """
    Service for prioritizing PA requests.
    """

    def __init__(self, prioritizer: Optional[RequestPrioritizer] = None,
                 adapter: Optional[RequestPrioritizationAdapter] = None):
        self.prioritizer = prioritizer or create_request_prioritizer()
        self.adapter = adapter or RequestPrioritizationAdapter()

    async def prioritize_request(
        self,
        request: PrioritizationRequest
    ) -> PrioritizationResponse:
        """
        Prioritize a PA request.

        Args:
            request: The prioritization request.

        Returns:
            PrioritizationResponse with the prioritization result.
        """
        logger.info(f"Prioritizing request {request.request_id}")

        # We might need to enrich the request with data from the adapter (e.g., patient history, provider history)
        # For now, we'll use the request as is, but in a real system we might fetch additional data.

        # Convert the request to the input format for the prioritizer
        from .models import PrioritizationInput
        input_data = PrioritizationInput(
            request_id=request.request_id,
            patient_id=request.patient_id,
            provider_id=request.provider_id,
            procedure_code=request.procedure_code,
            procedure_name=request.procedure_name,
            urgency_indication=request.urgency_indication,
            clinical_information=request.clinical_information,
            requested_service_date=request.requested_service_date,
            insurance_info=request.insurance_info
        )

        # Perform the prioritization
        result = self.prioritizer.prioritize_request(input_data)

        # Convert to response format
        response = PrioritizationResponse(
            request_id=result.request_id,
            priority_level=result.priority_level.value,  # Convert enum to string for API
            priority_score=result.priority_score,
            risk_assessments=[{
                "risk_factor": ra.risk_factor.value,
                "score": ra.score,
                "description": ra.description,
                "contributing_factors": ra.contributing_factors
            } for ra in result.risk_assessments],
            recommended_action=result.recommended_action,
            estimated_processing_time=result.estimated_processing_time,
            sla_deadline=result.sla_deadline,
            assessment_timestamp=result.assessment_timestamp
        )

        logger.info(f"Completed prioritization for request {request.request_id}")
        return response


# Factory function
def create_request_prioritization_service() -> RequestPrioritizationService:
    return RequestPrioritizationService()