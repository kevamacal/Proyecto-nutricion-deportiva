"""FastAPI router for Pantry Inventory endpoints."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter

from src.backend.api.v1.schemas import (
    AddPantryBatchRequest,
    AddPantryItemRequest,
    PantryItemResponse,
)
from src.backend.services.pantry_service import pantry_service

router = APIRouter(prefix="/api/v1/pantry", tags=["Pantry Inventory"])


@router.get("/{user_id}")
def get_pantry(user_id: UUID) -> list[PantryItemResponse]:
    """Fetch active pantry stock for user."""
    return pantry_service.get_inventory(user_id)


@router.post("/item")
def add_pantry_item(payload: AddPantryItemRequest) -> dict[str, Any]:
    """Add item to pantry inventory."""
    return pantry_service.add_pantry_item(payload)


@router.post("/batch")
def add_pantry_batch(payload: AddPantryBatchRequest) -> list[dict[str, Any]]:
    """Batch add items to pantry inventory."""
    return pantry_service.add_pantry_batch(payload)


@router.delete("/{item_id}")
def delete_pantry_item(item_id: UUID) -> dict[str, str]:
    """Delete item from pantry inventory."""
    pantry_service.delete_pantry_item(item_id)
    return {"status": "success", "message": "Pantry item deleted"}
