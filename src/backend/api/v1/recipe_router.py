"""FastAPI router handling recipe_node execution endpoints."""

from fastapi import APIRouter

from src.backend.core.recipe.schemas import RecipeNodeInput, RecipeNodeOutput
from src.backend.services.recipe_service import recipe_service

router = APIRouter(prefix="/api/v1/agent", tags=["Recipe Node"])


@router.post("/recipe-node")
def execute_recipe(payload: RecipeNodeInput) -> RecipeNodeOutput:
    """Execute LangGraph recipe_node taking structured needs and inventory to generate a culinary proposal."""
    return recipe_service.generate_recipe(payload)
