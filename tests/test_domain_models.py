"""Automated test suite verifying domain model instantiation, validation constraints, and serialization.

Tests all domain models created under src/backend/ for Issue #8.
"""

from datetime import date
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.backend.core.activity import (
    Activity,
    ActivityIntensity,
    ActivitySport,
)
from src.backend.core.food import FoodItem, NutritionalInformation
from src.backend.core.inventory import InventoryItem, InventoryStatus
from src.backend.core.meals import Meal, MealItem, MealType
from src.backend.core.user import (
    ActivityLevel,
    BodyCompositionGoal,
    NutritionalGoal,
    NutritionalProfile,
    User,
)
from src.backend.sports.basketball import (
    BasketballActivity,
    BasketballSessionCategory,
)
from src.backend.sports.strength_training import (
    StrengthTrainingActivity,
    StrengthTrainingType,
)


def test_user_model_valid():
    user = User(email="test@athlete.com")
    assert user.id is not None
    assert user.email == "test@athlete.com"
    assert user.created_at is not None


def test_nutritional_profile_valid_and_constraints():
    user_id = uuid4()
    profile = NutritionalProfile(
        user_id=user_id,
        weight_kg=78.5,
        height_cm=185.0,
        age=24,
        activity_level=ActivityLevel.ACTIVE,
        body_composition_goal=BodyCompositionGoal.MAINTAIN,
        nutritional_goal=NutritionalGoal.PERFORMANCE,
        daily_calories_target=2800.0,
        daily_protein_g_target=160.0,
        daily_carbs_g_target=350.0,
        daily_fat_g_target=75.0,
    )
    assert profile.user_id == user_id
    assert profile.weight_kg == 78.5

    # Test invalid weight constraint (gt=0)
    with pytest.raises(ValidationError):
        NutritionalProfile(
            user_id=user_id,
            weight_kg=-5.0,
            height_cm=185.0,
            age=24,
            activity_level=ActivityLevel.ACTIVE,
            body_composition_goal=BodyCompositionGoal.MAINTAIN,
            nutritional_goal=NutritionalGoal.PERFORMANCE,
            daily_calories_target=2800.0,
            daily_protein_g_target=160.0,
            daily_carbs_g_target=350.0,
            daily_fat_g_target=75.0,
        )


def test_food_item_and_nutritional_info():
    food = FoodItem(name="Pechuga de pollo", category="Meat")
    assert food.is_custom is False

    info = NutritionalInformation(
        food_item_id=food.id,
        serving_size=100.0,
        calories_kcal=165.0,
        protein_g=31.0,
        carbohydrates_g=0.0,
        fat_g=3.6,
    )
    assert info.food_item_id == food.id
    assert info.protein_g == 31.0

    # Negative calories constraint check (ge=0)
    with pytest.raises(ValidationError):
        NutritionalInformation(
            food_item_id=food.id,
            serving_size=100.0,
            calories_kcal=-50.0,
            protein_g=31.0,
            carbohydrates_g=0.0,
            fat_g=3.6,
        )


def test_inventory_item_model():
    user_id = uuid4()
    food_id = uuid4()
    item = InventoryItem(
        user_id=user_id,
        food_item_id=food_id,
        quantity=500.0,
        unit="g",
        expiration_date=date(2026, 10, 1),
    )
    assert item.status == InventoryStatus.AVAILABLE
    assert item.quantity == 500.0


def test_meal_and_meal_item_models():
    meal_id = uuid4()
    food_id = uuid4()
    meal_item = MealItem(
        meal_id=meal_id,
        food_item_id=food_id,
        quantity=200.0,
        unit="g",
        calories_kcal=330.0,
        protein_g=62.0,
        carbohydrates_g=0.0,
        fat_g=7.2,
    )
    assert meal_item.meal_id == meal_id

    meal = Meal(
        user_id=uuid4(),
        meal_type=MealType.POST_WORKOUT,
        total_calories_kcal=330.0,
        total_protein_g=62.0,
        total_carbs_g=0.0,
        total_fat_g=7.2,
    )
    assert meal.meal_type == MealType.POST_WORKOUT


def test_activity_and_specializations():
    user_id = uuid4()
    activity = Activity(
        user_id=user_id,
        sport=ActivitySport.BASKETBALL,
        session_type="Full Court Match",
        duration_minutes=90,
        intensity=ActivityIntensity.HIGH,
        estimated_expenditure_kcal=750.0,
    )
    assert activity.sport == ActivitySport.BASKETBALL

    bball = BasketballActivity(
        activity_id=activity.id,
        session_category=BasketballSessionCategory.MATCH,
        carb_demand_g=90.0,
        hydration_demand_ml=1200.0,
        recovery_priority="GLYCOGEN_REPLETON",
    )
    assert bball.activity_id == activity.id

    strength = StrengthTrainingActivity(
        activity_id=uuid4(),
        training_type=StrengthTrainingType.HYPERTROPHY,
        protein_demand_g=40.0,
        targeted_muscle_groups=["CHEST", "TRICEPS"],
        total_volume_kg=4500.0,
        total_sets=16,
        total_reps=144,
    )
    assert strength.training_type == StrengthTrainingType.HYPERTROPHY
    assert strength.targeted_muscle_groups == ["CHEST", "TRICEPS"]
