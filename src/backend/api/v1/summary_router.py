"""FastAPI router for Daily Summary endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from src.backend.api.v1.schemas import DailySummaryResponse
from src.backend.services.meal_service import meal_service

router = APIRouter(prefix="/api/v1/summary", tags=["Daily Summary"])


@router.get("/daily")
def get_daily_summary(
    user_id: Annotated[UUID, Query()],
    date: Annotated[str, Query()],
) -> DailySummaryResponse:
    """Fetch daily total calories and macros logged by user."""
    return meal_service.get_daily_summary(user_id, date)
