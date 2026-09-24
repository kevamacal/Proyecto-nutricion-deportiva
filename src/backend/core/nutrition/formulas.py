"""Deterministic bioenergetics calculation formulas (BMR, TDEE, macronutrient splits).

Follows physiological formulas specified in docs/architecture/02_formulas.md.
Zero LLM calls or external client invocations.
"""

from src.backend.core.user.models import (
    ActivityLevel,
    BodyCompositionGoal,
    NutritionalGoal,
)

# Activity Level PAL Multipliers
PAL_MULTIPLIERS: dict[ActivityLevel, float] = {
    ActivityLevel.SEDENTARY: 1.20,
    ActivityLevel.MODERATE: 1.55,
    ActivityLevel.ACTIVE: 1.725,
    ActivityLevel.VERY_ACTIVE: 1.90,
}

# Body Composition Caloric Goal Adjustments
GOAL_CALORIC_ADJUSTMENTS: dict[BodyCompositionGoal, float] = {
    BodyCompositionGoal.MAINTAIN: 0.00,
    BodyCompositionGoal.BULK: 0.12,  # +12% surplus
    BodyCompositionGoal.CUT: -0.20,  # -20% deficit
    BodyCompositionGoal.RECOMP: 0.00,
}

# Nutritional Goal Protein Factors (g/kg bodyweight)
PROTEIN_FACTORS: dict[NutritionalGoal, float] = {
    NutritionalGoal.HYPERTROPHY: 2.0,
    NutritionalGoal.PERFORMANCE: 1.8,
    NutritionalGoal.FAT_LOSS_FOCUS: 2.3,
    NutritionalGoal.HEALTH: 1.5,
}

# Nutritional Goal Fat Factors (g/kg bodyweight)
FAT_FACTORS: dict[NutritionalGoal, float] = {
    NutritionalGoal.FAT_LOSS_FOCUS: 0.9,
    NutritionalGoal.HYPERTROPHY: 1.0,
    NutritionalGoal.PERFORMANCE: 1.0,
    NutritionalGoal.HEALTH: 1.0,
}


def calculate_bmr(
    weight_kg: float, height_cm: float, age: int, is_male: bool = True
) -> float:
    """Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation.

    Args:
        weight_kg: Weight in kilograms (> 0).
        height_cm: Height in centimeters (> 0).
        age: Age in years (> 0).
        is_male: True for male equation, False for female.

    Returns:
        BMR value in kcal (rounded to 2 decimal places).
    """
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        raise ValueError("Weight, height, and age must be strictly positive")

    base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age)
    bmr = base + 5.0 if is_male else base - 161.0
    return round(bmr, 2)


def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    """Calculate Total Daily Energy Expenditure (TDEE) incorporating PAL multiplier.

    Args:
        bmr: Basal Metabolic Rate in kcal (> 0).
        activity_level: Activity level enum category.

    Returns:
        TDEE value in kcal (rounded to 2 decimal places).
    """
    if bmr <= 0:
        raise ValueError("BMR must be strictly positive")

    multiplier = PAL_MULTIPLIERS[activity_level]
    return round(bmr * multiplier, 2)


def calculate_daily_calories_target(
    tdee: float, body_composition_goal: BodyCompositionGoal
) -> float:
    """Calculate daily caloric intake target based on body composition goal.

    Args:
        tdee: Total Daily Energy Expenditure in kcal (> 0).
        body_composition_goal: Goal enum (MAINTAIN, BULK, CUT, RECOMP).

    Returns:
        Daily caloric target in kcal (rounded to 2 decimal places).
    """
    if tdee <= 0:
        raise ValueError("TDEE must be strictly positive")

    adjustment = GOAL_CALORIC_ADJUSTMENTS[body_composition_goal]
    target = tdee * (1.0 + adjustment)
    return round(target, 2)


def calculate_macronutrient_targets(
    weight_kg: float,
    daily_calories_target: float,
    nutritional_goal: NutritionalGoal,
) -> dict[str, float]:
    """Calculate daily protein, fat, and carbohydrate targets.

    Order of allocation:
    1. Protein: g/kg bodyweight based on goal.
    2. Fat: g/kg bodyweight (1.0 g/kg base, 0.9 g/kg fat loss), bounded between
       min 20% and max 30% of total daily calories for endocrine health.
    3. Carbs: Remaining calories absorb glycogen replenishment demands.

    Args:
        weight_kg: Weight in kilograms (> 0).
        daily_calories_target: Daily energy target in kcal (> 0).
        nutritional_goal: Nutritional goal enum shaping macronutrient ratios.

    Returns:
        Dict with keys:
            - daily_protein_g_target
            - daily_fat_g_target
            - daily_carbs_g_target
    """
    if weight_kg <= 0 or daily_calories_target <= 0:
        raise ValueError("Weight and calories target must be strictly positive")

    # Step 1: Protein target (g/kg)
    protein_factor = PROTEIN_FACTORS[nutritional_goal]
    protein_g = round(weight_kg * protein_factor, 2)
    protein_kcal = protein_g * 4.0

    # Step 2: Fat target (g/kg, bounded between 20% and 30% of total daily calories)
    fat_factor = FAT_FACTORS.get(nutritional_goal, 1.0)
    raw_fat_g = weight_kg * fat_factor
    min_fat_g = (daily_calories_target * 0.20) / 9.0
    max_fat_g = (daily_calories_target * 0.30) / 9.0

    clamped_fat_g = max(min_fat_g, min(raw_fat_g, max_fat_g))
    fat_g = round(clamped_fat_g, 2)
    fat_kcal = fat_g * 9.0

    # Step 3: Carbohydrate target (remaining calories)
    remaining_kcal = max(0.0, daily_calories_target - (protein_kcal + fat_kcal))
    carbs_g = round(remaining_kcal / 4.0, 2)

    return {
        "daily_protein_g_target": protein_g,
        "daily_fat_g_target": fat_g,
        "daily_carbs_g_target": carbs_g,
    }


def calculate_baseline_hydration(weight_kg: float) -> float:
    """Calculate baseline daily fluid requirement (35 ml per kg bodyweight).

    Args:
        weight_kg: Weight in kilograms (> 0).

    Returns:
        Baseline daily hydration target in ml (rounded to 2 decimal places).
    """
    if weight_kg <= 0:
        raise ValueError("Weight must be strictly positive")
    return round(weight_kg * 35.0, 2)


def calculate_full_nutritional_profile(
    weight_kg: float,
    height_cm: float,
    age: int,
    activity_level: ActivityLevel,
    body_composition_goal: BodyCompositionGoal,
    nutritional_goal: NutritionalGoal,
    is_male: bool = True,
) -> dict[str, float]:
    """Execute complete deterministic pipeline for user nutritional targets.

    Returns:
        Dict containing bmr, tdee, daily_calories_target, daily_protein_g_target,
        daily_carbs_g_target, daily_fat_g_target, and daily_hydration_ml_target.
    """
    bmr = calculate_bmr(weight_kg, height_cm, age, is_male=is_male)
    tdee = calculate_tdee(bmr, activity_level)
    calories_target = calculate_daily_calories_target(tdee, body_composition_goal)
    macros = calculate_macronutrient_targets(
        weight_kg, calories_target, nutritional_goal
    )
    hydration_base = calculate_baseline_hydration(weight_kg)

    return {
        "bmr": bmr,
        "tdee": tdee,
        "daily_calories_target": calories_target,
        "daily_hydration_ml_target": hydration_base,
        **macros,
    }

