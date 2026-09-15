"""Service layer managing Deterministic Recommendation domain operations."""

from src.backend.api.v1.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from src.backend.core.recommendation.engine import generate_deterministic_recommendation
from src.backend.services.inventory_service import InventoryService, inventory_service


class RecommendationService:
    """Service handling non-LLM deterministic meal recommendations from pantry stock."""

    def __init__(self, inv_service: InventoryService | None = None) -> None:
        self._inventory_service = inv_service or inventory_service

    def generate_recommendation(
        self, payload: RecommendationRequest
    ) -> RecommendationResponse:
        """Fetch user pantry inventory stock and calculate deterministic recommendation."""
        pantry_items = self._inventory_service.list_inventory_items(
            user_id=payload.user_id
        )
        return generate_deterministic_recommendation(
            payload=payload, pantry_items=pantry_items
        )


# Global service instance
recommendation_service = RecommendationService()
