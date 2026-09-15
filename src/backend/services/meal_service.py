"""Service layer managing Meal Logging and Daily Intake Summaries."""

from datetime import date
from uuid import UUID

from src.backend.api.v1.schemas import (
    DailySummaryResponse,
    MealCreate,
    MealResponse,
)
from src.backend.db.repository import MealRepository, meal_repository


class MealService:
    """Service handling meal logging and daily intake aggregation business logic."""

    def __init__(self, repository: MealRepository | None = None) -> None:
        self._repo = repository or meal_repository

    def log_meal(self, payload: MealCreate) -> MealResponse:
        """Log a meal event and return calculated nutrition totals."""
        return self._repo.log_meal(payload)

    def get_meals(
        self, user_id: UUID, target_date: date | None = None
    ) -> list[MealResponse]:
        """Retrieve logged meals for a user on a given date."""
        return self._repo.list_meals(user_id=user_id, target_date=target_date)

    def get_daily_summary(
        self, user_id: UUID, target_date: date
    ) -> DailySummaryResponse:
        """Retrieve daily intake summary aggregating logged meals for a given date."""
        return self._repo.get_daily_summary(user_id=user_id, target_date=target_date)


# Global service instance
meal_service = MealService()
