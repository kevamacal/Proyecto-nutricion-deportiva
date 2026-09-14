"""Unit test suite for BMR, TDEE, and macronutrient target calculation formulas."""

import pytest

from src.backend.core.nutrition.formulas import (
    calculate_bmr,
    calculate_daily_calories_target,
    calculate_full_nutritional_profile,
    calculate_macronutrient_targets,
    calculate_tdee,
)
from src.backend.core.user.models import (
    ActivityLevel,
    BodyCompositionGoal,
    NutritionalGoal,
)


def test_calculate_bmr_male_and_female():
    # Male: (10 * 80) + (6.25 * 180) - (5 * 25) + 5 = 800 + 1125 - 125 + 5 = 1805
    bmr_male = calculate_bmr(weight_kg=80.0, height_cm=180.0, age=25, is_male=True)
    assert bmr_male == 1805.0

    # Female: (10 * 60) + (6.25 * 165) - (5 * 30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    bmr_female = calculate_bmr(weight_kg=60.0, height_cm=165.0, age=30, is_male=False)
    assert bmr_female == 1320.25


def test_calculate_bmr_invalid_inputs():
    with pytest.raises(ValueError):
        calculate_bmr(weight_kg=0.0, height_cm=180.0, age=25)
    with pytest.raises(ValueError):
        calculate_bmr(weight_kg=80.0, height_cm=-10.0, age=25)
    with pytest.raises(ValueError):
        calculate_bmr(weight_kg=80.0, height_cm=180.0, age=0)


def test_calculate_tdee_multipliers():
    bmr = 2000.0
    assert calculate_tdee(bmr, ActivityLevel.SEDENTARY) == 2400.0
    assert calculate_tdee(bmr, ActivityLevel.MODERATE) == 3100.0
    assert calculate_tdee(bmr, ActivityLevel.ACTIVE) == 3450.0
    assert calculate_tdee(bmr, ActivityLevel.VERY_ACTIVE) == 3800.0


def test_calculate_caloric_target_goals():
    tdee = 2500.0
    assert calculate_daily_calories_target(tdee, BodyCompositionGoal.MAINTAIN) == 2500.0
    assert (
        calculate_daily_calories_target(tdee, BodyCompositionGoal.BULK) == 2800.0
    )  # +12%
    assert (
        calculate_daily_calories_target(tdee, BodyCompositionGoal.CUT) == 2000.0
    )  # -20%
    assert calculate_daily_calories_target(tdee, BodyCompositionGoal.RECOMP) == 2500.0


def test_calculate_macronutrient_targets():
    weight_kg = 80.0
    calories_target = 2800.0

    # Hypertrophy goal: protein factor = 2.1 => 168.0g protein (672 kcal)
    # Fat = 25% of 2800 = 700 kcal / 9 => 77.78g fat
    # Carbs = (2800 - 672 - 700) = 1428 kcal / 4 => 357.0g carbs
    macros = calculate_macronutrient_targets(
        weight_kg=weight_kg,
        daily_calories_target=calories_target,
        nutritional_goal=NutritionalGoal.HYPERTROPHY,
    )
    assert macros["daily_protein_g_target"] == 168.0
    assert macros["daily_fat_g_target"] == 77.78
    assert macros["daily_carbs_g_target"] == 357.0


def test_full_nutritional_profile_pipeline():
    result = calculate_full_nutritional_profile(
        weight_kg=80.0,
        height_cm=180.0,
        age=25,
        activity_level=ActivityLevel.ACTIVE,
        body_composition_goal=BodyCompositionGoal.MAINTAIN,
        nutritional_goal=NutritionalGoal.PERFORMANCE,
        is_male=True,
    )
    assert "bmr" in result
    assert "tdee" in result
    assert "daily_calories_target" in result
    assert "daily_protein_g_target" in result
    assert "daily_fat_g_target" in result
    assert "daily_carbs_g_target" in result
