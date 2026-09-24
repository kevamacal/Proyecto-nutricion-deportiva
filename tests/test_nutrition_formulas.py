"""Unit test suite for BMR, TDEE, and macronutrient target calculation formulas."""

import pytest

from src.backend.core.nutrition.formulas import (
    calculate_baseline_hydration,
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


def test_calculate_macronutrient_targets_g_per_kg_refactor():
    weight_kg = 80.0
    calories_target = 2800.0

    # Hypertrophy goal: protein factor = 2.0 => 160.0g protein (640 kcal)
    # Fat factor = 1.0 => 80.0g fat (720 kcal). 720 kcal is 25.7% of 2800 (within 20-30% bounds)
    # Carbs = (2800 - 640 - 720) = 1440 kcal / 4 => 360.0g carbs
    macros = calculate_macronutrient_targets(
        weight_kg=weight_kg,
        daily_calories_target=calories_target,
        nutritional_goal=NutritionalGoal.HYPERTROPHY,
    )
    assert macros["daily_protein_g_target"] == 160.0
    assert macros["daily_fat_g_target"] == 80.0
    assert macros["daily_carbs_g_target"] == 360.0


def test_calculate_macronutrient_targets_fat_loss_focus():
    weight_kg = 68.0
    calories_target = 2000.0

    # Fat loss focus: protein factor = 2.3 => 156.4g protein (625.6 kcal)
    # Fat factor = 0.9 => 61.2g fat (550.8 kcal). 550.8 / 2000 = 27.54% (within 20-30% bounds)
    # Carbs = (2000 - 625.6 - 550.8) = 823.6 kcal / 4 => 205.9g carbs
    macros = calculate_macronutrient_targets(
        weight_kg=weight_kg,
        daily_calories_target=calories_target,
        nutritional_goal=NutritionalGoal.FAT_LOSS_FOCUS,
    )
    assert macros["daily_protein_g_target"] == 156.4
    assert macros["daily_fat_g_target"] == 61.2
    assert macros["daily_carbs_g_target"] == 205.9


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
    assert "daily_hydration_ml_target" in result
    assert result["daily_hydration_ml_target"] == 2800.0  # 80kg * 35 ml/kg


def test_calculate_baseline_hydration():
    assert calculate_baseline_hydration(70.0) == 2450.0
    assert calculate_baseline_hydration(80.0) == 2800.0
    with pytest.raises(ValueError):
        calculate_baseline_hydration(0.0)

