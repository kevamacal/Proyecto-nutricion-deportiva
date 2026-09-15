"""Service layer managing Food Catalog domain operations."""

from uuid import UUID

from src.backend.api.v1.schemas import FoodItemCreate, FoodItemResponse
from src.backend.db.repository import FoodCatalogRepository, food_repository


class FoodCatalogService:
    """Service handling food catalog query and creation business logic."""

    def __init__(self, repository: FoodCatalogRepository | None = None) -> None:
        self._repo = repository or food_repository

    def list_food_items(
        self, query: str | None = None, user_id: UUID | None = None
    ) -> list[FoodItemResponse]:
        """Retrieve catalog food items matching search query or user ID filter."""
        return self._repo.list_items(query=query, user_id=user_id)

    def create_custom_item(self, payload: FoodItemCreate) -> FoodItemResponse:
        """Create a new custom food item with nutritional profile."""
        return self._repo.create_custom_item(payload)


# Global service instance
food_service = FoodCatalogService()
