"""FastAPI router for Pantry Inventory CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from src.backend.api.v1.schemas import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)
from src.backend.core.inventory.models import InventoryStatus
from src.backend.db.repository import inventory_repository

router = APIRouter(prefix="/rest/v1/inventory_items", tags=["Inventory"])


@router.get("", response_model=list[InventoryItemResponse])
def get_inventory_items(
    user_id: UUID = Query(..., description="User ID owner of pantry inventory"),
    status_filter: InventoryStatus | None = Query(
        default=None, alias="status", description="Filter stock by availability status"
    ),
) -> list[InventoryItemResponse]:
    """List pantry inventory stock items for a user."""
    return inventory_repository.list_by_user(user_id, status=status_filter)


@router.post(
    "",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_inventory_item(
    payload: InventoryItemCreate,
) -> InventoryItemResponse:
    """Add a new food item portion to pantry inventory stock."""
    return inventory_repository.add_item(payload)


@router.patch("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: UUID, payload: InventoryItemUpdate
) -> InventoryItemResponse:
    """Update stock quantity, expiration date or status of a pantry item."""
    updated = inventory_repository.update_item(item_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item {item_id} not found",
        )
    return updated


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: UUID) -> None:
    """Remove an item from pantry inventory stock."""
    deleted = inventory_repository.delete_item(item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item {item_id} not found",
        )
