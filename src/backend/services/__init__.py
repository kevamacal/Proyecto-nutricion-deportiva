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
from src.backend.services.recommendation_service import (
    RecommendationService,
    recommendation_service,
)

__all__ = [
    "ActivityService",
    "FoodCatalogService",
    "InventoryService",
    "MealService",
    "NutritionService",
    "RecommendationService",
    "activity_service",
    "food_service",
    "inventory_service",
    "meal_service",
    "nutrition_service",
    "recommendation_service",
]
