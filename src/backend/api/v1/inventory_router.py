"""FastAPI router for Pantry Inventory CRUD endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from src.backend.api.v1.schemas import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)
from src.backend.core.inventory.models import InventoryStatus
from src.backend.services.inventory_service import inventory_service

router = APIRouter(prefix="/api/v1/inventory_items", tags=["Inventory"])


@router.get("")
def get_inventory_items(
    user_id: Annotated[UUID, Query(description="User ID owner of pantry inventory")],
    status_filter: Annotated[
        InventoryStatus | None,
        Query(alias="status", description="Filter stock by availability status"),
    ] = None,
) -> list[InventoryItemResponse]:
    """List pantry inventory stock items for a user."""
    return inventory_service.list_inventory_items(
        user_id=user_id, status_filter=status_filter
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def add_inventory_item(
    payload: InventoryItemCreate,
) -> InventoryItemResponse:
    """Add a new food item portion to pantry inventory stock."""
    return inventory_service.add_inventory_item(payload)


@router.patch("/{item_id}")
def update_inventory_item(
    item_id: UUID, payload: InventoryItemUpdate
) -> InventoryItemResponse:
    """Update stock quantity, expiration date or status of a pantry item."""
    updated = inventory_service.update_inventory_item(item_id=item_id, payload=payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item {item_id} not found",
        )
    return updated


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: UUID) -> None:
    """Remove an item from pantry inventory stock."""
    deleted = inventory_service.delete_inventory_item(item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item {item_id} not found",
        )
