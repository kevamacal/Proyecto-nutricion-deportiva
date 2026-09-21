"""Unit and static boundary audit tests for Deterministic Non-LLM Recommendation Engine."""

import ast
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.api.v1.schemas import (
    PantryItemInput,
    PantryItemNutritionInput,
    RecommendationRequest,
)
from src.backend.core.recommendation.engine import (
    calculate_remaining_demands,
    generate_deterministic_recommendation,
    identify_dominant_deficit,
)
from src.backend.main import app

client = TestClient(app)


def test_calculate_remaining_demands() -> None:
    """Test calculation of remaining caloric and macronutrient demands with activity expenditure."""
    req = RecommendationRequest(
        user_id=uuid4(),
        target_calories_kcal=2000.0,
        target_protein_g=150.0,
        target_carbohydrates_g=250.0,
        target_fat_g=60.0,
        consumed_calories_kcal=1200.0,
        consumed_protein_g=80.0,
        consumed_carbohydrates_g=120.0,
        consumed_fat_g=40.0,
        activity_expenditure_kcal=400.0,
        activity_carb_demand_g=50.0,
        activity_protein_demand_g=20.0,
    )
    demands = calculate_remaining_demands(req)

    # Calories: (2000 + 400) - 1200 = 1200
    assert demands["remaining_calories_kcal"] == 1200.0
    # Protein: (150 + 20) - 80 = 90
    assert demands["remaining_protein_g"] == 90.0
    # Carbs: (250 + 50) - 120 = 180
    assert demands["remaining_carbohydrates_g"] == 180.0
    # Fat: 60 - 40 = 20
    assert demands["remaining_fat_g"] == 20.0


def test_identify_dominant_deficit() -> None:
    """Test identification of dominant deficit category."""
    assert (
        identify_dominant_deficit(remaining_protein_g=60.0, remaining_carbs_g=20.0)
        == "PROTEIN"
    )
    assert (
        identify_dominant_deficit(remaining_protein_g=10.0, remaining_carbs_g=100.0)
        == "CARBOHYDRATES"
    )
    assert (
        identify_dominant_deficit(remaining_protein_g=15.0, remaining_carbs_g=20.0)
        == "BALANCED"
    )


def test_recommendation_engine_with_pantry_items() -> None:
    """Test recommendation engine matching available pantry ingredients sent in payload."""
    user_id = uuid4()

    chicken = PantryItemInput(
        food_item_id=uuid4(),
        name="Pechuga de pollo",
        category="Meat",
        available_quantity=500.0,
        unit="g",
        nutrition=PantryItemNutritionInput(
            serving_size=100.0,
            calories_kcal=165.0,
            protein_g=31.0,
            carbohydrates_g=0.0,
            fat_g=3.6,
        ),
    )

    req = RecommendationRequest(
        user_id=user_id,
        target_calories_kcal=2000.0,
        target_protein_g=160.0,
        target_carbohydrates_g=200.0,
        target_fat_g=60.0,
        consumed_calories_kcal=1000.0,
        consumed_protein_g=60.0,  # Deficit 100g protein
        consumed_carbohydrates_g=150.0,
        consumed_fat_g=40.0,
        pantry_items=[chicken],
    )

    resp = generate_deterministic_recommendation(req)
    assert resp.user_id == user_id
    assert resp.dominant_deficit_macronutrient == "PROTEIN"
    assert len(resp.recommended_ingredients) > 0
    assert resp.recommended_ingredients[0].food_name == "Pechuga de pollo"
    assert resp.recommended_ingredients[0].protein_contribution_g > 0.0


def test_recommendation_endpoint() -> None:
    """Test POST /api/v1/nutrition/recommendations API endpoint."""
    user_id = str(uuid4())
    food_id = str(uuid4())
    payload = {
        "user_id": user_id,
        "target_calories_kcal": 2200.0,
        "target_protein_g": 150.0,
        "target_carbohydrates_g": 250.0,
        "target_fat_g": 70.0,
        "consumed_calories_kcal": 1500.0,
        "consumed_protein_g": 100.0,
        "consumed_carbohydrates_g": 180.0,
        "consumed_fat_g": 50.0,
        "pantry_items": [
            {
                "food_item_id": food_id,
                "name": "Pechuga de pollo",
                "category": "Carnes",
                "available_quantity": 400.0,
                "unit": "g",
                "nutrition": {
                    "serving_size": 100.0,
                    "calories_kcal": 165.0,
                    "protein_g": 31.0,
                    "carbohydrates_g": 0.0,
                    "fat_g": 3.6,
                },
            }
        ],
    }
    response = client.post("/api/v1/nutrition/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert "remaining_calories_kcal" in data
    assert "dominant_deficit_macronutrient" in data
    assert len(data["recommended_ingredients"]) == 1


def test_recommendation_engine_ast_zero_llm_boundary() -> None:
    """AST static audit verifying zero LLM SDK imports or invocations in recommendation engine."""
    engine_file = Path("src/backend/core/recommendation/engine.py")
    tree = ast.parse(engine_file.read_text(encoding="utf-8"))

    llm_sdks = {"openai", "anthropic", "google.generativeai", "langchain", "ollama"}

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                assert alias.name.split(".")[0] not in llm_sdks, (
                    f"Forbidden LLM SDK import '{alias.name}' detected in {engine_file}"
                )
        elif isinstance(node, ast.ImportFrom) and node.module:
            assert node.module.split(".")[0] not in llm_sdks, (
                f"Forbidden LLM SDK import from '{node.module}' detected in {engine_file}"
            )
