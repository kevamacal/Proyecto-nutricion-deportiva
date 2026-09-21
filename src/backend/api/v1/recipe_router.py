"""FastAPI router handling recipe_node execution endpoints."""

from fastapi import APIRouter

from src.backend.core.recipe.node import execute_recipe_node
from src.backend.core.recipe.schemas import RecipeNodeInput, RecipeNodeOutput

router = APIRouter(prefix="/api/v1/agent", tags=["Recipe Node"])


@router.post("/recipe-node")
def execute_recipe(payload: RecipeNodeInput) -> RecipeNodeOutput:
    """Execute LangGraph recipe_node taking structured needs and inventory to generate a culinary proposal."""
    return execute_recipe_node(payload)
