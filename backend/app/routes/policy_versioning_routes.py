from fastapi import APIRouter, Depends, HTTPException, Path, status
from app.services.n8n_event_emitter import emit_event, Events
from typing import List, Optional, Dict, Any
from ..services.policy_versioning.service import PolicyVersioningService, create_policy_versioning_service
from ..services.policy_versioning.schemas import (
    PolicyVersionCreateRequest,
    PolicyVersionResponse,
    PolicyComparisonRequest,
    PolicyComparisonResponse,
    PolicyVersionsResponse
)
from ..services.auth_middleware import verify_jwt_token

# Module-level singleton — adapter data persists across requests
_policy_versioning_service: Optional[PolicyVersioningService] = None


def _get_singleton_service() -> PolicyVersioningService:
    global _policy_versioning_service
    if _policy_versioning_service is None:
        _policy_versioning_service = create_policy_versioning_service()
    return _policy_versioning_service


router = APIRouter(
    prefix="/api/policies",
    tags=["policy-versioning"],
)


@router.post("/{policy_id}/versions", response_model=PolicyVersionResponse)
async def create_policy_version(
    policy_id: str = Path(..., description="The ID of the policy"),
    version_data: PolicyVersionCreateRequest = ...,
    payload: dict = Depends(verify_jwt_token),
):
    """
    Create a new version of a policy.
    """
    if version_data.policy_id != policy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy ID in path must match policy ID in request body"
        )

    service = _get_singleton_service()
    result = await service.create_policy_version(policy_id, version_data)

    # Emit policy version created event
    emit_event(
        event=Events.POLICY_VERSION_CREATED,
        entity_type="policy",
        entity_id=policy_id,
        status="created",
        actor_role="provider",
        extra={
            "policy_id": policy_id,
            "policy_version": result.version if hasattr(result, 'version') else version_data.get('version', ''),
        },
    )

    return result


@router.get("/{policy_id}/versions", response_model=PolicyVersionsResponse)
async def get_policy_versions(
    policy_id: str = Path(..., description="The ID of the policy"),
    payload: dict = Depends(verify_jwt_token),
):
    """
    Get all versions of a policy.
    """
    service = _get_singleton_service()
    versions = await service.get_policy_versions(policy_id)
    return PolicyVersionsResponse(
        policy_id=policy_id,
        versions=versions
    )


@router.post("/{policy_id}/compare", response_model=PolicyComparisonResponse)
async def compare_policy_versions(
    policy_id: str = Path(..., description="The ID of the policy"),
    comparison_request: PolicyComparisonRequest = ...,
    payload: dict = Depends(verify_jwt_token),
):
    """
    Compare two versions of a policy.
    """
    if comparison_request.policy_id != policy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy ID in path must match policy ID in request body"
        )

    service = _get_singleton_service()
    result = await service.compare_policy_versions(
        policy_id=policy_id,
        base_version=comparison_request.base_version,
        compared_version=comparison_request.compared_version
    )

    # --- n8n: policy_change_detected (only when changes exist) ---
    changes = result.changes if hasattr(result, 'changes') else []
    if changes and len(changes) > 0:
        emit_event(
            event=Events.POLICY_CHANGE_DETECTED,
            entity_type="policy",
            entity_id=policy_id,
            status="changes_detected",
            actor_role="provider",
            extra={
                "policy_id": policy_id,
            },
        )

    return PolicyComparisonResponse(
        policy_id=result.policy_id,
        payer=result.payer,
        procedure=result.procedure,
        base_version=result.base_version,
        compared_version=result.compared_version,
        base_effective_date=result.base_effective_date.isoformat() if hasattr(result.base_effective_date, 'isoformat') else str(result.base_effective_date),
        compared_effective_date=result.compared_effective_date.isoformat() if hasattr(result.compared_effective_date, 'isoformat') else str(result.compared_effective_date),
        changes=[{
            'requirement_id': change.requirement_id,
            'change_type': change.change_type.value,
            'old_text': change.old_text,
            'new_text': change.new_text,
            'section': change.section
        } for change in result.changes],
        summary=result.summary,
        impact_assessment=result.impact_assessment
    )


@router.get("/{policy_id}/versions/{version}/changes", response_model=List[Dict[str, Any]])
async def get_policy_version_changes(
    policy_id: str = Path(..., description="The ID of the policy"),
    version: str = Path(..., description="The version to get changes for"),
    payload: dict = Depends(verify_jwt_token),
):
    """
    Get changes for a specific policy version compared to its previous version.
    """
    service = _get_singleton_service()
    changes = await service.get_policy_version_changes(policy_id, version)
    return changes