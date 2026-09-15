"""Contract compatibility and unit tests for recipe_node (PDF Iteration 7 / Issue #32)."""

from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.core.recipe.node import execute_recipe_node
from src.backend.core.recipe.schemas import (
    AvailableIngredientInput,
    RecipeNodeInput,
    RecipeNodeOutput,
    RemainingNeedsInput,
    SportsRecoveryContextInput,
    UserConstraintsInput,
)
from src.backend.main import app

client = TestClient(app)


def test_recipe_node_contract_schema_compatibility() -> None:
    """Validate RecipeNodeInput and RecipeNodeOutput contract schemas against 03_node_contracts.md."""
    input_payload = RecipeNodeInput(
        remaining_needs=RemainingNeedsInput(
            remaining_calories_kcal=500.0,
            remaining_protein_g=45.0,
            remaining_carbs_g=60.0,
            remaining_fat_g=10.0,
        ),
        available_ingredients=[
            AvailableIngredientInput(
                food_item_id=uuid4(),
                name="Chicken breast",
                available_quantity=300.0,
                unit="g",
                density_class="PROTEIN_DENSE",
            ),
            AvailableIngredientInput(
                food_item_id=uuid4(),
                name="White rice",
                available_quantity=500.0,
                unit="g",
                density_class="CARB_DENSE",
            ),
        ],
        user_constraints=UserConstraintsInput(
            max_preparation_time_minutes=25,
            meal_type="POST_WORKOUT",
        ),
        sports_recovery_context=SportsRecoveryContextInput(
            sport="BASKETBALL",
            recovery_priority="GLYCOGEN_REPLETON_AND_HYDRATION",
        ),
    )

    output = execute_recipe_node(input_payload)

    # Validate output schema against Pydantic model requirements
    assert isinstance(output, RecipeNodeOutput)
    assert output.recipe_name != ""
    assert output.total_time_minutes <= 25
    assert len(output.ingredients_used) > 0
    assert output.estimated_nutritional_summary.protein_g > 0.0
    assert output.nutritional_fit_score >= 0.0
    assert output.nutritional_fit_score <= 100.0
    assert "BASKETBALL" in output.explanation


def test_recipe_node_empty_inventory_fallback() -> None:
    """Validate recipe_node graceful fallback behavior when pantry inventory is empty."""
    input_payload = RecipeNodeInput(
        remaining_needs=RemainingNeedsInput(
            remaining_calories_kcal=400.0,
            remaining_protein_g=40.0,
            remaining_carbs_g=50.0,
            remaining_fat_g=5.0,
        ),
        available_ingredients=[],
    )

    output = execute_recipe_node(input_payload)
    assert isinstance(output, RecipeNodeOutput)
    assert any(ing.is_from_inventory is False for ing in output.ingredients_used)
    assert "Warning: Pantry empty" in output.explanation


def test_recipe_node_api_endpoint() -> None:
    """Validate POST /api/v1/agent/recipe-node REST endpoint."""
    food_id = str(uuid4())
    payload = {
        "remaining_needs": {
            "remaining_calories_kcal": 600.0,
            "remaining_protein_g": 50.0,
            "remaining_carbs_g": 70.0,
            "remaining_fat_g": 15.0,
        },
        "available_ingredients": [
            {
                "food_item_id": food_id,
                "name": "Pechuga de Pollo",
                "available_quantity": 250.0,
                "unit": "g",
                "density_class": "PROTEIN_DENSE",
            }
        ],
        "user_constraints": {
            "max_preparation_time_minutes": 20,
            "meal_type": "DINNER",
        },
    }

    response = client.post("/api/v1/agent/recipe-node", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recipe_name" in data
    assert "preparation_steps" in data
    assert "estimated_nutritional_summary" in data
    assert data["estimated_nutritional_summary"]["protein_g"] > 0.0
