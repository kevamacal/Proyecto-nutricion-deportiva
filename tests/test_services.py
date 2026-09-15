"""Unit tests for the Service Layer (Food, Inventory, Meal, Nutrition, Activity services)."""

from datetime import UTC, datetime
from uuid import uuid4

from src.backend.api.v1.schemas import (
    ActivityLogRequest,
    FoodItemCreate,
    InventoryItemCreate,
    MealCreate,
    MealItemCreate,
    TargetCalculationRequest,
)
from src.backend.services.activity_service import activity_service
from src.backend.services.food_service import food_service
from src.backend.services.inventory_service import inventory_service
from src.backend.services.meal_service import meal_service
from src.backend.services.nutrition_service import nutrition_service


def test_food_service_custom_item() -> None:
    """Test creating custom food item via FoodCatalogService."""
    user_id = uuid4()
    payload = FoodItemCreate(
        name="Batido de Proteína Whey",
        category="Supplements",
        default_unit="g",
        serving_size=30.0,
        serving_unit="g",
        calories_kcal=120.0,
        protein_g=24.0,
        carbohydrates_g=2.0,
        fat_g=1.5,
        user_id=user_id,
    )
    created = food_service.create_custom_item(payload)
    assert created.name == "Batido de Proteína Whey"
    assert created.nutrition is not None
    assert created.nutrition.protein_g == 24.0

    items = food_service.list_food_items(query="Batido", user_id=user_id)
    assert len(items) == 1
    assert items[0].id == created.id


def test_inventory_service_flow() -> None:
    """Test adding and deleting inventory item via InventoryService."""
    user_id = uuid4()
    food_id = uuid4()
    create_payload = InventoryItemCreate(
        user_id=user_id,
        food_item_id=food_id,
        quantity=500.0,
        unit="g",
    )
    added = inventory_service.add_inventory_item(create_payload)
    assert added.user_id == user_id
    assert added.quantity == 500.0

    stock = inventory_service.list_inventory_items(user_id=user_id)
    assert len(stock) == 1

    deleted = inventory_service.delete_inventory_item(added.id)
    assert deleted is True


def test_nutrition_service_targets() -> None:
    """Test deterministic target calculation via NutritionService."""
    user_id = uuid4()
    req = TargetCalculationRequest(
        user_id=user_id,
        weight_kg=70.0,
        height_cm=175.0,
        age=24,
        sex="male",
        activity_level="moderate",
        goal="cut",
    )
    targets = nutrition_service.calculate_targets(req)
    assert targets.user_id == user_id
    assert targets.bmr_kcal > 1500.0
    assert targets.protein_target_g > 140.0


def test_activity_service_logging() -> None:
    """Test logging activity via ActivityService."""
    user_id = uuid4()
    req = ActivityLogRequest(
        user_id=user_id,
        sport_type="Basketball",
        duration_minutes=90.0,
        weight_kg=70.0,
        intensity="high",
    )
    res = activity_service.log_activity(req)
    assert res.user_id == user_id
    assert res.energy_expended_kcal > 500.0
    assert res.hydration_recommendation_ml > 1000.0


def test_meal_service_logging_and_summary() -> None:
    """Test logging meal and computing summary via MealService."""
    user_id = uuid4()
    today_date = datetime.now(UTC).date()

    # Create catalog item
    item = food_service.create_custom_item(
        FoodItemCreate(
            name="Avena Test",
            category="Grains",
            default_unit="g",
            serving_size=100.0,
            serving_unit="g",
            calories_kcal=380.0,
            protein_g=13.0,
            carbohydrates_g=67.0,
            fat_g=7.0,
            user_id=user_id,
        )
    )

    meal_payload = MealCreate(
        user_id=user_id,
        meal_type="Breakfast",
        items=[MealItemCreate(food_item_id=item.id, quantity=100.0, unit="g")],
    )
    logged_meal = meal_service.log_meal(meal_payload)
    assert logged_meal.total_calories_kcal == 380.0

    summary = meal_service.get_daily_summary(user_id=user_id, target_date=today_date)
    assert summary.consumed_calories_kcal == 380.0
    assert summary.meals_logged_count == 1
