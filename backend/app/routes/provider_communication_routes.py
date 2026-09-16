from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import Dict, Any
from ..services.provider_communication.service import ProviderCommunicationService, create_provider_communication_service
from ..services.provider_communication.schemas import CommunicationRequestSchema, CommunicationResponseSchema
from ..services.provider_communication.models import CommunicationTemplate
from ..services.auth_middleware import verify_jwt_token
from app.services.n8n_event_emitter import emit_event, Events

router = APIRouter(
    prefix="/api/provider-communication",
    tags=["provider-communication"],
)

@router.post("/send", response_model=CommunicationResponseSchema)
async def send_communication(
    request: CommunicationRequestSchema,
    service: ProviderCommunicationService = Depends(create_provider_communication_service),
    payload: dict = Depends(verify_jwt_token),
):
    """
    Send a communication to a provider.
    """
    result = await service.send_communication(request)

    # --- n8n: provider_communication_sent ---
    emit_event(
        event=Events.PROVIDER_COMMUNICATION_SENT,
        entity_type="prior_authorization",
        entity_id=request.request_id,
        status="sent",
        actor_role="provider",
        extra={
            "provider_id": request.provider_id,
        },
    )

    return result