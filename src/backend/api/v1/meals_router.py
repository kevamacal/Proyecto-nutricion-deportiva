"""FastAPI router handling meal logging and query endpoints."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import MealCreate, MealResponse
from src.backend.db.repository import meal_repository

router = APIRouter(prefix="/rest/v1/meals", tags=["Meals"])


@router.post("", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
def log_meal(payload: MealCreate) -> MealResponse:
    """Log a meal event and return calculated nutrition totals."""
    return meal_repository.log_meal(payload)


@router.get("", response_model=list[MealResponse])
def get_meals(
    user_id: UUID = Query(..., description="User ID owner of logged meals"),
    target_date: date | None = Query(
        default=None, alias="date", description="Filter meals by date (YYYY-MM-DD)"
    ),
) -> list[MealResponse]:
    """Retrieve logged meals for a user on a given date."""
    return meal_repository.list_meals(user_id=user_id, target_date=target_date)
