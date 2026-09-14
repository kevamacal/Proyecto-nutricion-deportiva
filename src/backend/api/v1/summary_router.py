"""FastAPI router handling daily intake summary calculations."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query

from src.backend.api.v1.schemas import DailySummaryResponse
from src.backend.db.repository import meal_repository

router = APIRouter(prefix="/api/v1/nutrition", tags=["Daily Summary"])


@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    user_id: UUID = Query(..., description="User ID for daily summary"),
    target_date: date = Query(
        ..., alias="date", description="Summary target date (YYYY-MM-DD)"
    ),
) -> DailySummaryResponse:
    """Retrieve daily intake summary aggregating logged meals for a given date."""
    return meal_repository.get_daily_summary(user_id=user_id, target_date=target_date)
