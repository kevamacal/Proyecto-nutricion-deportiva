"""FastAPI router for User Profile management."""

from uuid import UUID

from fastapi import APIRouter, HTTPException

from src.backend.api.v1.schemas import (
    EnsureProfileRequest,
    UpdateProfileRequest,
    UserProfileResponse,
)
from src.backend.services.profile_service import profile_service

router = APIRouter(prefix="/api/v1/profile", tags=["User Profile"])


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_profile(user_id: UUID) -> UserProfileResponse:
    """Fetch user profile by ID."""
    profile = profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{user_id}", response_model=UserProfileResponse)
def update_profile(user_id: UUID, payload: UpdateProfileRequest) -> UserProfileResponse:
    """Update user profile details."""
    return profile_service.update_profile(user_id, payload)


@router.post("/ensure", response_model=UserProfileResponse)
def ensure_profile(payload: EnsureProfileRequest) -> UserProfileResponse:
    """Ensure user profile row exists."""
    return profile_service.ensure_profile_exists(payload)
