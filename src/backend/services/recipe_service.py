"""Service layer managing Recipe Node execution."""

from src.backend.core.recipe.node import execute_recipe_node
from src.backend.core.recipe.schemas import RecipeNodeInput, RecipeNodeOutput


class RecipeService:
    """Service encapsulating recipe generation node execution."""

    def generate_recipe(self, payload: RecipeNodeInput) -> RecipeNodeOutput:
        """Execute recipe node transforming structured inputs into a culinary proposal."""
        return execute_recipe_node(payload)


# Global service instance
recipe_service = RecipeService()
