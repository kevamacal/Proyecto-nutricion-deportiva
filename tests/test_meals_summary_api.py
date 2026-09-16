"""Integration tests for Meals Logging and Daily Summary endpoints."""

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.backend.api.v1.food_router import router as food_router
from src.backend.api.v1.meals_router import router as meals_router
from src.backend.api.v1.summary_router import router as summary_router

app = FastAPI()
app.include_router(food_router)
app.include_router(meals_router)
app.include_router(summary_router)

client = TestClient(app)


def test_log_meal_and_query_daily_summary() -> None:
    """Test logging a multi-item meal and retrieving aggregated daily intake summary."""
    user_id = str(uuid4())
    today_str = datetime.now(UTC).date().isoformat()

    # 1. Fetch default food item (Pechuga de pollo)
    cat_resp = client.get("/api/v1/food_items?query=Pechuga")
    assert cat_resp.status_code == 200
    items = cat_resp.json()
    assert len(items) > 0
    chicken_id = items[0]["id"]

    # 2. Log a meal with 200g Pechuga de pollo
    meal_payload = {
        "user_id": user_id,
        "meal_type": "Lunch",
        "items": [
            {
                "food_item_id": chicken_id,
                "quantity": 200.0,
                "unit": "g",
            }
        ],
    }
    log_resp = client.post("/api/v1/meals", json=meal_payload)
    assert log_resp.status_code == 201
    meal_data = log_resp.json()
    assert meal_data["user_id"] == user_id
    assert meal_data["total_calories_kcal"] == 330.0  # 165 * 2
    assert meal_data["total_protein_g"] == 62.0  # 31 * 2

    # 3. Retrieve meals for user
    get_meals_resp = client.get(f"/api/v1/meals?user_id={user_id}")
    assert get_meals_resp.status_code == 200
    user_meals = get_meals_resp.json()
    assert len(user_meals) == 1

    # 4. Retrieve daily summary
    summary_resp = client.get(
        f"/api/v1/nutrition/daily-summary?user_id={user_id}&date={today_str}"
    )
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    assert summary_data["user_id"] == user_id
    assert summary_data["consumed_calories_kcal"] == 330.0
    assert summary_data["consumed_protein_g"] == 62.0
    assert summary_data["meals_logged_count"] == 1
