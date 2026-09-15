"""In-memory database repository layer for Food Catalog and Inventory Management."""

from uuid import UUID, uuid4

from src.backend.api.v1.schemas import (
    FoodItemCreate,
    FoodItemResponse,
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    NutritionalInfoSchema,
)
from src.backend.core.inventory.models import InventoryStatus


class FoodCatalogRepository:
    """Repository handling Food Catalog storage and queries."""

    def __init__(self) -> None:
        self._items: dict[UUID, FoodItemResponse] = {}

    def seed_test_item(self, item: FoodItemResponse) -> None:
        """Add a catalog item for testing purposes."""
        self._items[item.id] = item

    def list_items(
        self, query: str | None = None, user_id: UUID | None = None
    ) -> list[FoodItemResponse]:
        """List food items matching query or user filter."""
        results: list[FoodItemResponse] = []
        for item in self._items.values():
            if (not item.is_custom or item.created_by_user_id == user_id) and (
                query is None
                or query.lower() in item.name.lower()
                or query.lower() in item.category.lower()
            ):
                results.append(item)
        return results

    def get_by_id(self, item_id: UUID) -> FoodItemResponse | None:
        """Get food item by ID."""
        return self._items.get(item_id)

    def create_custom_item(self, payload: FoodItemCreate) -> FoodItemResponse:
        """Create custom food item."""
        item_id = uuid4()
        response = FoodItemResponse(
            id=item_id,
            name=payload.name,
            category=payload.category,
            default_unit=payload.default_unit,
            is_custom=True,
            created_by_user_id=payload.user_id,
            nutrition=NutritionalInfoSchema(
                serving_size=payload.serving_size,
                serving_unit=payload.serving_unit,
                calories_kcal=payload.calories_kcal,
                protein_g=payload.protein_g,
                carbohydrates_g=payload.carbohydrates_g,
                fat_g=payload.fat_g,
                fiber_g=payload.fiber_g,
                sugars_g=payload.sugars_g,
                sodium_mg=payload.sodium_mg,
            ),
        )
        self._items[item_id] = response
        return response


class InventoryRepository:
    """Repository handling Pantry Inventory items."""

    def __init__(self, food_repo: FoodCatalogRepository) -> None:
        self._items: dict[UUID, InventoryItemResponse] = {}
        self._food_repo = food_repo

    def list_by_user(
        self, user_id: UUID, status: InventoryStatus | None = None
    ) -> list[InventoryItemResponse]:
        """List inventory items owned by user."""
        results: list[InventoryItemResponse] = []
        for item in self._items.values():
            if item.user_id == user_id and (status is None or item.status == status):
                results.append(item)
        return results

    def get_by_id(self, item_id: UUID) -> InventoryItemResponse | None:
        """Get inventory item by ID."""
        return self._items.get(item_id)

    def add_item(self, payload: InventoryItemCreate) -> InventoryItemResponse:
        """Add item to inventory."""
        item_id = uuid4()
        food_item = self._food_repo.get_by_id(payload.food_item_id)
        response = InventoryItemResponse(
            id=item_id,
            user_id=payload.user_id,
            food_item_id=payload.food_item_id,
            quantity=payload.quantity,
            unit=payload.unit,
            expiration_date=payload.expiration_date,
            status=InventoryStatus.AVAILABLE,
            food_item=food_item,
        )
        self._items[item_id] = response
        return response

    def update_item(
        self, item_id: UUID, payload: InventoryItemUpdate
    ) -> InventoryItemResponse | None:
        """Update existing inventory item quantity or status."""
        item = self._items.get(item_id)
        if not item:
            return None

        new_quantity = (
            payload.quantity if payload.quantity is not None else item.quantity
        )
        new_status = payload.status if payload.status is not None else item.status
        new_exp = (
            payload.expiration_date
            if payload.expiration_date is not None
            else item.expiration_date
        )

        updated = InventoryItemResponse(
            id=item.id,
            user_id=item.user_id,
            food_item_id=item.food_item_id,
            quantity=new_quantity,
            unit=item.unit,
            date_added=item.date_added,
            expiration_date=new_exp,
            status=new_status,
            food_item=item.food_item,
        )
        self._items[item_id] = updated
        return updated

    def delete_item(self, item_id: UUID) -> bool:
        """Delete item from inventory."""
        if item_id in self._items:
            del self._items[item_id]
            return True
        return False


# Global singletons
food_repository = FoodCatalogRepository()
inventory_repository = InventoryRepository(food_repository)
