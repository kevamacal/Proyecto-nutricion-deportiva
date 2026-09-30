"""Domain Services package coordinating domain operations and calculations."""

from src.backend.services.activity_service import ActivityService, activity_service
from src.backend.services.auth_service import AuthService, auth_service
from src.backend.services.food_service import FoodService, food_service
from src.backend.services.hydration_service import HydrationService, hydration_service
from src.backend.services.meal_service import MealService, meal_service
from src.backend.services.nutrition_service import NutritionService, nutrition_service
from src.backend.services.orchestrator_service import OrchestratorService
from src.backend.services.pantry_service import PantryService, pantry_service
from src.backend.services.profile_service import ProfileService, profile_service

orchestrator_service = OrchestratorService()

__all__ = [
    "ActivityService",
    "AuthService",
    "FoodService",
    "HydrationService",
    "MealService",
    "NutritionService",
    "OrchestratorService",
    "PantryService",
    "ProfileService",
    "activity_service",
    "auth_service",
    "food_service",
    "hydration_service",
    "meal_service",
    "nutrition_service",
    "orchestrator_service",
    "pantry_service",
    "profile_service",
]
