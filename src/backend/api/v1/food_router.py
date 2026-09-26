"""FastAPI router for Food Catalog endpoints."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import CreateCustomFoodRequest, FoodItemResponse
from src.backend.services.food_service import food_service

router = APIRouter(prefix="/api/v1/foods", tags=["Food Catalog"])


@router.get("")
def get_food_catalog() -> list[FoodItemResponse]:
    """Fetch global food catalog with nutritional details."""
    return food_service.get_catalog()


@router.post("/custom")
def create_custom_food(payload: CreateCustomFoodRequest) -> FoodItemResponse:
    """Create a new custom food item."""
    return food_service.create_custom_food(payload)
