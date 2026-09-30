"""FastAPI router for Meal Logging endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import LoggedMealEntryResponse, LogMealRequest
from src.backend.services.meal_service import meal_service

router = APIRouter(prefix="/api/v1/meals", tags=["Meal Logging"])


@router.get("")
def get_logged_meals(
    user_id: Annotated[UUID, Query()],
    date: Annotated[str, Query()],
) -> list[LoggedMealEntryResponse]:
    """Fetch logged meals for user and date."""
    return meal_service.get_logged_meals(user_id, date)


@router.get("/recent/{user_id}")
def get_recent_meals(
    user_id: UUID,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> list[LoggedMealEntryResponse]:
    """Fetch recent logged meals for user to support 1-click repetition."""
    return meal_service.get_recent_meals(user_id, limit)


@router.post("", status_code=status.HTTP_201_CREATED)
def log_meal(payload: LogMealRequest) -> LoggedMealEntryResponse:
    """Log a meal entry and deduct consumed quantities from available pantry stock."""
    return meal_service.log_meal(payload)


@router.put("/{meal_id}")
def update_meal(
    meal_id: UUID, payload: LogMealRequest
) -> LoggedMealEntryResponse:
    """Update an existing logged meal entry."""
    return meal_service.update_meal(meal_id, payload)


@router.delete("/{meal_id}")
def delete_meal(meal_id: UUID) -> dict[str, str]:
    """Delete a logged meal entry."""
    meal_service.delete_meal(meal_id)
    return {"status": "success", "message": "Meal entry deleted"}
