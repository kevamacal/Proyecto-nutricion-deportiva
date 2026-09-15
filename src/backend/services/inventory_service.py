"""Service layer managing Pantry Inventory domain operations."""

from uuid import UUID

from src.backend.api.v1.schemas import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
)
from src.backend.core.inventory.models import InventoryStatus
from src.backend.db.repository import InventoryRepository, inventory_repository


class InventoryService:
    """Service handling pantry inventory stock business logic."""

    def __init__(self, repository: InventoryRepository | None = None) -> None:
        self._repo = repository or inventory_repository

    def list_inventory_items(
        self, user_id: UUID, status_filter: InventoryStatus | None = None
    ) -> list[InventoryItemResponse]:
        """List pantry inventory stock items for a user."""
        return self._repo.list_by_user(user_id=user_id, status=status_filter)

    def add_inventory_item(self, payload: InventoryItemCreate) -> InventoryItemResponse:
        """Add a new food item portion to pantry inventory stock."""
        return self._repo.add_item(payload)

    def update_inventory_item(
        self, item_id: UUID, payload: InventoryItemUpdate
    ) -> InventoryItemResponse | None:
        """Update stock quantity, expiration date or status of a pantry item."""
        return self._repo.update_item(item_id=item_id, payload=payload)

    def delete_inventory_item(self, item_id: UUID) -> bool:
        """Remove an item from pantry inventory stock."""
        return self._repo.delete_item(item_id)


# Global service instance
inventory_service = InventoryService()
