"""FastAPI router handling deterministic target calculation endpoints."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import (
    TargetCalculationRequest,
    TargetCalculationResponse,
)
from src.backend.services.nutrition_service import nutrition_service

router = APIRouter(prefix="/api/v1/nutrition", tags=["Target Calculation"])


@router.post("/calculate_targets")
def calculate_targets(payload: TargetCalculationRequest) -> TargetCalculationResponse:
    """Calculate BMR, TDEE, and macronutrient target distribution deterministically."""
    return nutrition_service.calculate_targets(payload)
