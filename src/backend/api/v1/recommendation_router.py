"""FastAPI router handling deterministic recommendation endpoints."""

from fastapi import APIRouter

from src.backend.api.v1.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from src.backend.core.recommendation.engine import generate_deterministic_recommendation

router = APIRouter(prefix="/api/v1/nutrition", tags=["Recommendations"])


@router.post("/recommendations")
def get_recommendation(payload: RecommendationRequest) -> RecommendationResponse:
    """Generate deterministic meal recommendations from pantry items sent by the frontend."""
    return generate_deterministic_recommendation(payload)
