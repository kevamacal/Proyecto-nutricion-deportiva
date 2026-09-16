"""Integration test suite for Food Catalog and Pantry Inventory CRUD REST endpoints."""

from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.backend.api.v1.food_router import router as food_router
from src.backend.api.v1.inventory_router import router as inventory_router

app = FastAPI()
app.include_router(food_router)
app.include_router(inventory_router)

client = TestClient(app)


def test_get_food_items_catalog():
    response = client.get("/api/v1/food_items")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 6
    names = [item["name"] for item in data]
    assert "Pechuga de pollo" in names
    assert "Pan de molde para sándwich" in names


def test_get_food_items_search_filter():
    response = client.get("/api/v1/food_items?q=pollo")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Pechuga de pollo"


def test_create_custom_food_item():
    user_id = str(uuid4())
    payload = {
        "name": "Manzana Fuji",
        "category": "Fruits",
        "default_unit": "g",
        "serving_size": 100.0,
        "serving_unit": "g",
        "calories_kcal": 52.0,
        "protein_g": 0.3,
        "carbohydrates_g": 13.8,
        "fat_g": 0.2,
        "user_id": user_id,
    }
    response = client.post("/api/v1/food_items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Manzana Fuji"
    assert data["is_custom"] is True
    assert data["created_by_user_id"] == user_id


def test_inventory_crud_lifecycle():
    user_id = str(uuid4())
    food_id = client.get("/api/v1/food_items?q=pollo").json()[0]["id"]

    # 1. Add item to pantry inventory
    add_payload = {
        "user_id": user_id,
        "food_item_id": food_id,
        "quantity": 400.0,
        "unit": "g",
        "expiration_date": "2026-10-15",
    }
    add_resp = client.post("/api/v1/inventory_items", json=add_payload)
    assert add_resp.status_code == 201
    inv_data = add_resp.json()
    item_id = inv_data["id"]
    assert inv_data["quantity"] == 400.0
    assert inv_data["status"] == "AVAILABLE"

    # 2. Get inventory items by user
    get_resp = client.get(f"/api/v1/inventory_items?user_id={user_id}")
    assert get_resp.status_code == 200
    items = get_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == item_id

    # 3. Update quantity and status (PATCH)
    patch_resp = client.patch(
        f"/api/v1/inventory_items/{item_id}",
        json={"quantity": 200.0, "status": "LOW_STOCK"},
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["quantity"] == 200.0
    assert updated["status"] == "LOW_STOCK"

    # 4. Delete item from inventory (DELETE)
    del_resp = client.delete(f"/api/v1/inventory_items/{item_id}")
    assert del_resp.status_code == 204

    # 5. Verify deletion
    verify_resp = client.get(f"/api/v1/inventory_items?user_id={user_id}")
    assert verify_resp.status_code == 200
    assert len(verify_resp.json()) == 0
