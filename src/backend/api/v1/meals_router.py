"""FastAPI router for Meal Logging endpoints."""

from uuid import UUID

from fastapi import APIRouter, Query

from src.backend.api.v1.schemas import LoggedMealEntryResponse, LogMealRequest
from src.backend.services.meal_service import meal_service

router = APIRouter(prefix="/api/v1/meals", tags=["Meal Logging"])


@router.get("", response_model=list[LoggedMealEntryResponse])
def get_logged_meals(
    user_id: UUID = Query(...),
    date: str = Query(...),
) -> list[LoggedMealEntryResponse]:
    """Fetch logged meals for user and date."""
    return meal_service.get_logged_meals(user_id, date)


@router.get("/recent/{user_id}", response_model=list[LoggedMealEntryResponse])
def get_recent_meals(
    user_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
) -> list[LoggedMealEntryResponse]:
    """Fetch recent logged meals for user to support 1-click repetition."""
    return meal_service.get_recent_meals(user_id, limit)


@router.post("", response_model=LoggedMealEntryResponse)
def log_meal(payload: LogMealRequest) -> LoggedMealEntryResponse:
    """Log a meal entry and deduct consumed quantities from available pantry stock."""
    return meal_service.log_meal(payload)
