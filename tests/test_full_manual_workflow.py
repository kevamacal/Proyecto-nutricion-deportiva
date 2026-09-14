"""End-to-end workflow integration tests for full API surface."""

from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.main import app

client = TestClient(app)


def test_health_check() -> None:
    """Verify health check endpoint returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "Sports Nutrition API"}


def test_full_athlete_workflow() -> None:
    """Test full athlete workflow: target calculation, inventory add, meal log, activity log, summary."""
    user_id = str(uuid4())
    today_str = datetime.now(UTC).date().isoformat()

    # 1. Target Calculation
    target_payload = {
        "user_id": user_id,
        "weight_kg": 75.0,
        "height_cm": 180.0,
        "age": 25,
        "sex": "male",
        "activity_level": "active",
        "goal": "bulk",
    }
    target_resp = client.post(
        "/api/v1/nutrition/calculate-targets", json=target_payload
    )
    assert target_resp.status_code == 200
    targets = target_resp.json()
    assert targets["user_id"] == user_id
    assert targets["bmr_kcal"] > 1600.0
    assert (
        targets["calories_target_kcal"] > targets["base_tdee_kcal"]
    )  # Surplus for bulk

    # 2. Query catalog and add item to pantry inventory
    cat_resp = client.get("/rest/v1/food_items?query=Arroz")
    assert cat_resp.status_code == 200
    rice_items = [i for i in cat_resp.json() if "Arroz" in i["name"]]
    assert len(rice_items) > 0
    rice_id = rice_items[0]["id"]

    inv_payload = {
        "user_id": user_id,
        "food_item_id": rice_id,
        "quantity": 1000.0,
        "unit": "g",
    }
    inv_resp = client.post("/rest/v1/inventory_items", json=inv_payload)
    assert inv_resp.status_code == 201

    # 3. Log a meal
    meal_payload = {
        "user_id": user_id,
        "meal_type": "Dinner",
        "items": [
            {
                "food_item_id": rice_id,
                "quantity": 200.0,
                "unit": "g",
            }
        ],
    }
    meal_resp = client.post("/rest/v1/meals", json=meal_payload)
    assert meal_resp.status_code == 201
    assert meal_resp.json()["total_calories_kcal"] == 260.0  # 130 * 2

    # 4. Log athletic activity session (Basketball)
    activity_payload = {
        "user_id": user_id,
        "sport_type": "Basketball",
        "duration_minutes": 60.0,
        "weight_kg": 75.0,
        "intensity": "high",
    }
    act_resp = client.post("/api/v1/activities/log", json=activity_payload)
    assert act_resp.status_code == 201
    assert act_resp.json()["energy_expended_kcal"] > 300.0

    # 5. Query Daily Summary
    summary_resp = client.get(
        f"/api/v1/nutrition/daily-summary?user_id={user_id}&date={today_str}"
    )
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["consumed_calories_kcal"] == 260.0
    assert summary["meals_logged_count"] == 1
