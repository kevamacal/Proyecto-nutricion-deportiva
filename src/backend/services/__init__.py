"""Domain Services package exporting business logic service layer."""

from src.backend.services.activity_service import ActivityService, activity_service
from src.backend.services.food_service import FoodCatalogService, food_service
from src.backend.services.inventory_service import (
    InventoryService,
    inventory_service,
)
from src.backend.services.meal_service import MealService, meal_service
from src.backend.services.nutrition_service import (
    NutritionService,
    nutrition_service,
)
from src.backend.services.orchestrator_service import OrchestratorService
from src.backend.services.recipe_service import RecipeService, recipe_service
from src.backend.services.recommendation_service import (
    RecommendationService,
    recommendation_service,
)

orchestrator_service = OrchestratorService()

__all__ = [
    "ActivityService",
    "FoodCatalogService",
    "InventoryService",
    "MealService",
    "NutritionService",
    "OrchestratorService",
    "RecipeService",
    "RecommendationService",
    "activity_service",
    "food_service",
    "inventory_service",
    "meal_service",
    "nutrition_service",
    "orchestrator_service",
    "recipe_service",
    "recommendation_service",
]
