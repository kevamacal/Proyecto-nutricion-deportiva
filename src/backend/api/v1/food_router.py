"""FastAPI router for Food Catalog endpoints."""

from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import FoodItemCreate, FoodItemResponse
from src.backend.db.repository import food_repository

router = APIRouter(prefix="/rest/v1/food_items", tags=["Food Catalog"])


@router.get("", response_model=list[FoodItemResponse])
def get_food_items(
    q: str | None = Query(
        default=None, description="Search query string for item name or category"
    ),
    user_id: UUID | None = Query(
        default=None, description="Filter custom items by owner user ID"
    ),
) -> list[FoodItemResponse]:
    """Retrieve catalog food items matching search query or user ID."""
    return food_repository.list_items(query=q, user_id=user_id)


@router.post("", response_model=FoodItemResponse, status_code=status.HTTP_201_CREATED)
def create_custom_food_item(payload: FoodItemCreate) -> FoodItemResponse:
    """Create a new custom food item with nutritional values."""
    return food_repository.create_custom_item(payload)
