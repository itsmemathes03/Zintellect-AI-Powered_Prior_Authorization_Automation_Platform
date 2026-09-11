from fastapi import APIRouter, Depends, HTTPException, Path, status
from typing import List, Optional, Dict, Any
from ..services.policy_versioning.service import PolicyVersioningService, create_policy_versioning_service
from ..services.policy_versioning.schemas import (
    PolicyVersionCreateRequest,
    PolicyVersionResponse,
    PolicyComparisonRequest,
    PolicyComparisonResponse,
    PolicyVersionsResponse
)

# Placeholder for authentication and RBAC dependencies
# In a real implementation, these would be imported from the auth module
async def get_current_user():
    # Placeholder: in reality, this would validate the token and return user info
    return {"user_id": "placeholder", "roles": ["provider", "admin"]}

async def check_policy_access(policy_id: str, current_user: dict = Depends(get_current_user)):
    # Placeholder: in reality, this would check if the user has access to the policy
    # For now, we'll allow access
    pass

router = APIRouter(
    prefix="/api/policies",
    tags=["policy-versioning"],
    dependencies=[Depends(get_current_user)]  # All routes require authentication
)


@router.post("/{policy_id}/versions", response_model=PolicyVersionResponse)
async def create_policy_version(
    policy_id: str = Path(..., description="The ID of the policy"),
    version_data: PolicyVersionCreateRequest = None,
    service: PolicyVersioningService = Depends(create_policy_versioning_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Create a new version of a policy.
    """
    # Ensure the policy_id in the path matches the one in the request data (if provided)
    if version_data and version_data.policy_id != policy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy ID in path must match policy ID in request body"
        )

    # Set the policy_id from the path
    version_data.policy_id = policy_id

    result = await service.create_policy_version(policy_id, version_data)
    return result


@router.get("/{policy_id}/versions", response_model=PolicyVersionsResponse)
async def get_policy_versions(
    policy_id: str = Path(..., description="The ID of the policy"),
    service: PolicyVersioningService = Depends(create_policy_versioning_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Get all versions of a policy.
    """
    versions = await service.get_policy_versions(policy_id)
    return PolicyVersionsResponse(
        policy_id=policy_id,
        versions=versions
    )


@router.post("/{policy_id}/compare", response_model=PolicyComparisonResponse)
async def compare_policy_versions(
    policy_id: str = Path(..., description="The ID of the policy"),
    comparison_request: PolicyComparisonRequest = None,
    service: PolicyVersioningService = Depends(create_policy_versioning_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Compare two versions of a policy.
    """
    # Ensure the policy_id in the path matches the one in the request data (if provided)
    if comparison_request and comparison_request.policy_id != policy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy ID in path must match policy ID in request body"
        )

    # Set the policy_id from the path
    if comparison_request is None:
        comparison_request = PolicyComparisonRequest(policy_id=policy_id)
    else:
        comparison_request.policy_id = policy_id

    result = await service.compare_policy_versions(
        policy_id=comparison_request.policy_id,
        base_version=comparison_request.base_version,
        compared_version=comparison_request.compared_version
    )

    # Convert to response format
    return PolicyComparisonResponse(
        policy_id=result.policy_id,
        payer=result.payer,
        procedure=result.procedure,
        base_version=result.base_version,
        compared_version=result.compared_version,
        base_effective_date=result.base_effective_date.isoformat(),
        compared_effective_date=result.compared_effective_date.isoformat(),
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
    service: PolicyVersioningService = Depends(create_policy_versioning_service),
    _: dict = Depends(get_current_user)  # Ensures authentication
):
    """
    Get changes for a specific policy version compared to its previous version.
    """
    changes = await service.get_policy_version_changes(policy_id, version)
    return changes