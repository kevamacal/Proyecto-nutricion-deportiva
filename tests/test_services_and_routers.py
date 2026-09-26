"""Unit and Integration tests for backend Services, DB Repositories, and REST API Routers."""

from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify API health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@patch("src.backend.db.repository.auth_repository.sign_in")
@patch("src.backend.db.repository.user_profile_repository.get_by_user_id")
def test_auth_login_endpoint(mock_get_profile, mock_sign_in):
    """Test auth login endpoint."""
    fake_id = str(uuid4())
    mock_sign_in.return_value = {
        "user": {
            "id": fake_id,
            "email": "athlete@test.com",
            "user_metadata": {"name": "Athlete"},
        },
        "session": {"access_token": "fake-jwt-token"},
    }
    mock_get_profile.return_value = {
        "id": str(uuid4()),
        "user_id": fake_id,
        "weight_kg": 75,
        "height_cm": 180,
    }

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "athlete@test.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "athlete@test.com"
    assert data["access_token"] == "fake-jwt-token"


@patch("src.backend.db.repository.user_profile_repository.get_by_user_id")
def test_get_profile_endpoint(mock_get_profile):
    """Test get user profile endpoint."""
    fake_id = str(uuid4())
    mock_get_profile.return_value = {
        "id": str(uuid4()),
        "user_id": fake_id,
        "weight_kg": 75.0,
        "height_cm": 180.0,
        "age": 25,
        "gender": "male",
        "activity_level": "ACTIVE",
        "body_composition_goal": "BULK",
        "daily_calories_target": 2800.0,
        "daily_protein_g_target": 170.0,
        "daily_carbs_g_target": 300.0,
        "daily_fat_g_target": 75.0,
    }

    response = client.get(f"/api/v1/profile/{fake_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == fake_id
    assert data["daily_calories_target"] == 2800.0


@patch("src.backend.db.repository.food_catalog_repository.list_food_catalog")
def test_get_food_catalog_endpoint(mock_list):
    """Test food catalog endpoint."""
    fake_id = str(uuid4())
    mock_list.return_value = [
        {
            "id": fake_id,
            "name": "Arroz Integral",
            "category": "Carbohidratos",
            "default_unit": "g",
            "is_custom": False,
            "nutritional_information": [
                {
                    "serving_size": 100,
                    "calories_kcal": 130,
                    "protein_g": 2.7,
                    "carbohydrates_g": 28.0,
                    "fat_g": 1.0,
                }
            ],
        }
    ]

    response = client.get("/api/v1/foods")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Arroz Integral"


@patch("src.backend.db.repository.pantry_repository.list_inventory")
def test_get_pantry_endpoint(mock_pantry):
    """Test get pantry endpoint."""
    user_id = str(uuid4())
    inv_id = str(uuid4())
    food_id = str(uuid4())
    mock_pantry.return_value = [
        {
            "id": inv_id,
            "user_id": user_id,
            "food_item_id": food_id,
            "quantity": 500,
            "unit": "g",
            "status": "AVAILABLE",
            "food_items": {
                "name": "Pechuga de Pollo",
                "category": "Proteína",
                "nutritional_information": [{"protein_g": 23.0, "calories_kcal": 165}],
            },
        }
    ]

    response = client.get(f"/api/v1/pantry/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Pechuga de Pollo"
    assert data[0]["density_class"] == "PROTEIN_DENSE"


@patch("src.backend.db.repository.hydration_repository.create_hydration_log")
def test_log_hydration_endpoint(mock_create):
    """Test hydration logging endpoint."""
    user_id = str(uuid4())
    log_id = str(uuid4())
    mock_create.return_value = {
        "id": log_id,
        "user_id": user_id,
        "amount_ml": 500,
        "logged_at": "2026-09-24T10:00:00.000Z",
    }

    response = client.post(
        "/api/v1/hydration", json={"user_id": user_id, "amount_ml": 500}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount_ml"] == 500
