"""FastAPI router handling daily intake summary calculations."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from src.backend.api.v1.schemas import DailySummaryResponse
from src.backend.services.meal_service import meal_service

router = APIRouter(prefix="/api/v1/nutrition", tags=["Daily Summary"])


@router.get("/daily-summary")
def get_daily_summary(
    user_id: Annotated[UUID, Query(description="User ID for daily summary")],
    target_date: Annotated[
        date, Query(alias="date", description="Summary target date (YYYY-MM-DD)")
    ],
) -> DailySummaryResponse:
    """Retrieve daily intake summary aggregating logged meals for a given date."""
    return meal_service.get_daily_summary(user_id=user_id, target_date=target_date)
