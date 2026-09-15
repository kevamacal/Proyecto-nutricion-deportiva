"""FastAPI router handling athletic activity logging and expenditure calculation."""

from uuid import uuid4

from fastapi import APIRouter, status

from src.backend.api.v1.schemas import ActivityLogRequest, ActivityLogResponse
from src.backend.core.activity.models import ActivityIntensity
from src.backend.sports.activity_calculator import (
    calculate_basketball_expenditure_and_demands,
    calculate_strength_expenditure_and_demands,
)
from src.backend.sports.basketball.models import BasketballSessionCategory
from src.backend.sports.strength_training.models import StrengthTrainingType

router = APIRouter(prefix="/api/v1/activities", tags=["Activities"])


@router.post("/log", status_code=status.HTTP_201_CREATED)
def log_activity(payload: ActivityLogRequest) -> ActivityLogResponse:
    """Log an athletic activity session (Basketball or Strength Training) and return expenditure."""
    # Intensity mapping
    int_str = payload.intensity.lower()
    if "very" in int_str or "high" in int_str:
        intensity = ActivityIntensity.HIGH
    elif "low" in int_str:
        intensity = ActivityIntensity.LOW
    else:
        intensity = ActivityIntensity.MEDIUM

    sport = payload.sport_type.lower()
    if "basket" in sport:
        demands = calculate_basketball_expenditure_and_demands(
            weight_kg=payload.weight_kg,
            duration_minutes=int(payload.duration_minutes),
            intensity=intensity,
            session_category=BasketballSessionCategory.TRAINING,
        )
        expenditure = float(demands["estimated_expenditure_kcal"])
        hydration = float(demands["hydration_demand_ml"])
        notes = f"Basketball session logged. Carb replenishment demand: {demands['carb_demand_g']}g."
    else:
        demands = calculate_strength_expenditure_and_demands(
            weight_kg=payload.weight_kg,
            duration_minutes=int(payload.duration_minutes),
            intensity=intensity,
            training_type=StrengthTrainingType.HYPERTROPHY,
        )
        expenditure = float(demands["estimated_expenditure_kcal"])
        hydration = round(payload.duration_minutes * 10.0, 2)
        notes = (
            f"Strength training logged. MPS Protein demand: {demands['protein_demand_g']}g, "
            f"Carb demand: {demands['carb_demand_g']}g."
        )

    return ActivityLogResponse(
        id=uuid4(),
        user_id=payload.user_id,
        sport_type=payload.sport_type,
        duration_minutes=payload.duration_minutes,
        energy_expended_kcal=expenditure,
        hydration_recommendation_ml=hydration,
        recovery_notes=notes,
    )
