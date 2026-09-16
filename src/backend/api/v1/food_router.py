"""FastAPI router for Food Catalog endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from src.backend.api.v1.schemas import FoodItemCreate, FoodItemResponse
from src.backend.services.food_service import food_service

router = APIRouter(prefix="/api/v1/food_items", tags=["Food Catalog"])


@router.get("")
def get_food_items(
    q: Annotated[
        str | None,
        Query(description="Search query string for item name or category"),
    ] = None,
    user_id: Annotated[
        UUID | None,
        Query(description="Filter custom items by owner user ID"),
    ] = None,
) -> list[FoodItemResponse]:
    """Retrieve catalog food items matching search query or user ID."""
    return food_service.list_food_items(query=q, user_id=user_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_custom_food_item(payload: FoodItemCreate) -> FoodItemResponse:
    """Create a new custom food item with nutritional values."""
    return food_service.create_custom_item(payload)
