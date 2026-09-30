"""FastAPI router for Hydration intake logging endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import HydrationLogEntryResponse, LogWaterIntakeRequest
from src.backend.services.hydration_service import hydration_service

router = APIRouter(prefix="/api/v1/hydration", tags=["Hydration Intake"])


@router.get("")
def get_daily_hydration(
    user_id: Annotated[UUID, Query()],
    date: Annotated[str, Query()],
) -> list[HydrationLogEntryResponse]:
    """Fetch daily hydration logs for user and date."""
    return hydration_service.get_daily_hydration(user_id, date)


@router.post("", status_code=status.HTTP_201_CREATED)
def log_water_intake(payload: LogWaterIntakeRequest) -> HydrationLogEntryResponse:
    """Log a new water intake entry."""
    return hydration_service.log_water_intake(payload)


@router.delete("/{log_id}")
def delete_hydration_log(log_id: UUID) -> dict[str, str]:
    """Delete hydration log entry."""
    hydration_service.delete_hydration_log(log_id)
    return {"status": "success", "message": "Hydration log deleted"}
