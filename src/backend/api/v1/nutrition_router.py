"""FastAPI router handling deterministic target calculation endpoints."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import (
    TargetCalculationRequest,
    TargetCalculationResponse,
)
from src.backend.core.nutrition.formulas import calculate_full_nutritional_profile
from src.backend.core.user.models import (
    ActivityLevel,
    BodyCompositionGoal,
    NutritionalGoal,
)

router = APIRouter(prefix="/api/v1/nutrition", tags=["Target Calculation"])


@router.post("/calculate-targets", response_model=TargetCalculationResponse)
def calculate_targets(payload: TargetCalculationRequest) -> TargetCalculationResponse:
    """Calculate BMR, TDEE, and macronutrient target distribution deterministically."""
    # Map sex string
    s_clean = payload.sex.lower()
    is_male = s_clean in ["male", "hombre", "m"]

    # Map activity level
    act_str = payload.activity_level.lower()
    if "very" in act_str:
        act_enum = ActivityLevel.VERY_ACTIVE
    elif "active" in act_str or "alta" in act_str:
        act_enum = ActivityLevel.ACTIVE
    elif "mod" in act_str or "media" in act_str:
        act_enum = ActivityLevel.MODERATE
    else:
        act_enum = ActivityLevel.SEDENTARY

    # Map goals
    goal_str = payload.goal.lower()
    if "bulk" in goal_str or "gain" in goal_str or "volumen" in goal_str:
        comp_goal = BodyCompositionGoal.BULK
        nutr_goal = NutritionalGoal.HYPERTROPHY
    elif "cut" in goal_str or "loss" in goal_str or "definicion" in goal_str:
        comp_goal = BodyCompositionGoal.CUT
        nutr_goal = NutritionalGoal.FAT_LOSS_FOCUS
    elif "recomp" in goal_str:
        comp_goal = BodyCompositionGoal.RECOMP
        nutr_goal = NutritionalGoal.PERFORMANCE
    else:
        comp_goal = BodyCompositionGoal.MAINTAIN
        nutr_goal = NutritionalGoal.HEALTH

    res = calculate_full_nutritional_profile(
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        activity_level=act_enum,
        body_composition_goal=comp_goal,
        nutritional_goal=nutr_goal,
        is_male=is_male,
    )

    return TargetCalculationResponse(
        user_id=payload.user_id,
        bmr_kcal=res["bmr"],
        base_tdee_kcal=res["tdee"],
        calories_target_kcal=res["daily_calories_target"],
        protein_target_g=res["daily_protein_g_target"],
        fat_target_g=res["daily_fat_g_target"],
        carbs_target_g=res["daily_carbs_g_target"],
    )
