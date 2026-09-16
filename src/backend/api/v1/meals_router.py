"""FastAPI router handling meal logging and query endpoints."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import MealCreate, MealResponse
from src.backend.services.meal_service import meal_service

router = APIRouter(prefix="/api/v1/meals", tags=["Meals"])


@router.post("", status_code=status.HTTP_201_CREATED)
def log_meal(payload: MealCreate) -> MealResponse:
    """Log a meal event and return calculated nutrition totals."""
    return meal_service.log_meal(payload)


@router.get("")
def get_meals(
    user_id: Annotated[UUID, Query(description="User ID owner of logged meals")],
    target_date: Annotated[
        date | None,
        Query(alias="date", description="Filter meals by date (YYYY-MM-DD)"),
    ] = None,
) -> list[MealResponse]:
    """Retrieve logged meals for a user on a given date."""
    return meal_service.get_meals(user_id=user_id, target_date=target_date)
