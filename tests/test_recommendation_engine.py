"""Unit and static boundary audit tests for Deterministic Non-LLM Recommendation Engine."""

import ast
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.api.v1.schemas import InventoryItemCreate, RecommendationRequest
from src.backend.core.recommendation.engine import (
    calculate_remaining_demands,
    identify_dominant_deficit,
)
from src.backend.db.repository import food_repository
from src.backend.main import app
from src.backend.services.inventory_service import inventory_service
from src.backend.services.recommendation_service import recommendation_service

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


def test_recommendation_service_with_pantry_items() -> None:
    """Test recommendation service matching available pantry ingredients."""
    user_id = uuid4()

    # Get seeded food item (Pechuga de pollo)
    foods = food_repository.list_items(query="Pechuga")
    assert len(foods) > 0
    chicken = foods[0]

    # Add 500g Pechuga de pollo to user pantry
    inventory_service.add_inventory_item(
        InventoryItemCreate(
            user_id=user_id,
            food_item_id=chicken.id,
            quantity=500.0,
            unit="g",
        )
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
    )

    resp = recommendation_service.generate_recommendation(req)
    assert resp.user_id == user_id
    assert resp.dominant_deficit_macronutrient == "PROTEIN"
    assert len(resp.recommended_ingredients) > 0
    assert resp.recommended_ingredients[0].food_name == "Pechuga de pollo"
    assert resp.recommended_ingredients[0].protein_contribution_g > 0.0


def test_recommendation_endpoint() -> None:
    """Test POST /api/v1/nutrition/recommendations API endpoint."""
    user_id = str(uuid4())
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
    }
    response = client.post("/api/v1/nutrition/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert "remaining_calories_kcal" in data
    assert "dominant_deficit_macronutrient" in data


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
