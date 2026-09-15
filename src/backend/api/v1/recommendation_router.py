"""FastAPI router handling deterministic recommendation endpoints."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from src.backend.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/v1/nutrition", tags=["Recommendations"])


@router.post("/recommendations")
def get_recommendation(payload: RecommendationRequest) -> RecommendationResponse:
    """Generate deterministic meal and ingredient recommendations from available pantry stock."""
    return recommendation_service.generate_recommendation(payload)
