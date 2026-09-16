"""
Service for the Provider Communication feature.
"""
import logging
from typing import Optional
from fastapi import HTTPException
from .communicator import ProviderCommunicator, create_provider_communicator
from .adapter import ProviderCommunicationAdapter
from .models import CommunicationRecord, CommunicationTemplate
from .schemas import CommunicationRequestSchema, CommunicationResponseSchema

logger = logging.getLogger(__name__)


class ProviderCommunicationService:
    """
    Service for generating and sending communications to providers.
    """

    def __init__(self, communicator: Optional[ProviderCommunicator] = None,
                 adapter: Optional[ProviderCommunicationAdapter] = None):
        self.communicator = communicator or create_provider_communicator()
        self.adapter = adapter or ProviderCommunicationAdapter()

    async def send_communication(
        self,
        request: CommunicationRequestSchema
    ) -> CommunicationResponseSchema:
        """
        Generate and send a communication to a provider.

        Args:
            request: The communication request.

        Returns:
            CommunicationResponseSchema with the result of the send operation.
        """
        logger.info(f"Sending communication for request {request.request_id}")

        # Convert the schema request to the internal CommunicationRequest
        from .models import CommunicationRequest, CommunicationChannel, TemplateType
        try:
            channel = CommunicationChannel(request.channel.upper())
            template_type = TemplateType(request.template_type.upper())
        except ValueError as e:
            logger.error(f"Invalid channel or template type: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid channel or template type: {e}")

        internal_request = CommunicationRequest(
            request_id=request.request_id,
            provider_id=request.provider_id,
            template_type=template_type,
            channel=channel,
            context=request.context,
            template_id=request.template_id
        )

        # Generate the communication record
        record = self.communicator.generate_communication(internal_request)

        # Send the communication via the adapter (which might interact with external services)
        # For now, we'll use the communicator's send_communication method which simulates sending.
        # In a real system, the adapter would handle the actual sending.
        sent_record = self.communicator.send_communication(record)

        # Convert the sent record to the response schema
        response = CommunicationResponseSchema(
            communication_id=sent_record.communication_id,
            request_id=sent_record.request_id,
            provider_id=sent_record.provider_id,
            channel=sent_record.channel.value,
            status=sent_record.status.value,
            subject=sent_record.subject,
            body=sent_record.body,
            sent_at=sent_record.sent_at
        )

        logger.info(f"Completed sending communication {sent_record.communication_id} for request {request.request_id}")
        return response


# Factory function
def create_provider_communication_service() -> ProviderCommunicationService:
    return ProviderCommunicationService()