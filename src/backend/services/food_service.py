"""Service layer managing food catalog domain operations."""

from uuid import UUID

from src.backend.api.v1.schemas import (
    CreateCustomFoodRequest,
    FoodItemResponse,
    NutritionInfoSchema,
)
from src.backend.db.repository import food_catalog_repository


class FoodService:
    """Service handling food catalog operations."""

    def get_catalog(self) -> list[FoodItemResponse]:
        """Fetch all food items in catalog with nutritional info."""
        items = food_catalog_repository.list_food_catalog()
        result: list[FoodItemResponse] = []

        for item in items:
            nutr = item.get("nutritional_information")
            if isinstance(nutr, list):
                nutr = nutr[0] if len(nutr) > 0 else None

            nutrition_obj = None
            if nutr:
                nutrition_obj = NutritionInfoSchema(
                    serving_size=float(nutr.get("serving_size", 100.0)),
                    calories_kcal=float(nutr.get("calories_kcal", 0.0)),
                    protein_g=float(nutr.get("protein_g", 0.0)),
                    carbohydrates_g=float(nutr.get("carbohydrates_g", 0.0)),
                    fat_g=float(nutr.get("fat_g", 0.0)),
                )

            result.append(
                FoodItemResponse(
                    id=UUID(item["id"]) if item.get("id") else None,
                    food_item_id=UUID(item["id"]),
                    name=item["name"],
                    category=item.get("category", "General"),
                    default_unit=item.get("default_unit", "g"),
                    is_custom=bool(item.get("is_custom", False)),
                    nutrition=nutrition_obj,
                )
            )

        return result

    def create_custom_food(self, payload: CreateCustomFoodRequest) -> FoodItemResponse:
        """Create a new custom food item."""
        food_payload = {
            "name": payload.name,
            "category": payload.category,
            "default_unit": payload.default_unit,
            "is_custom": True,
            "created_by_user_id": str(payload.user_id) if payload.user_id else None,
        }
        nutrition_payload = {
            "serving_size": payload.serving_size,
            "serving_unit": payload.default_unit,
            "calories_kcal": payload.calories_kcal,
            "protein_g": payload.protein_g,
            "carbohydrates_g": payload.carbohydrates_g,
            "fat_g": payload.fat_g,
        }

        created = food_catalog_repository.create_custom_food(
            food_payload, nutrition_payload
        )
        food_item = created["food_item"]
        nutr_item = created["nutritional_information"]

        return FoodItemResponse(
            id=UUID(food_item["id"]),
            food_item_id=UUID(food_item["id"]),
            name=food_item["name"],
            category=food_item["category"],
            default_unit=food_item.get("default_unit", "g"),
            is_custom=True,
            nutrition=NutritionInfoSchema(
                serving_size=float(nutr_item.get("serving_size", payload.serving_size)),
                calories_kcal=float(
                    nutr_item.get("calories_kcal", payload.calories_kcal)
                ),
                protein_g=float(nutr_item.get("protein_g", payload.protein_g)),
                carbohydrates_g=float(
                    nutr_item.get("carbohydrates_g", payload.carbohydrates_g)
                ),
                fat_g=float(nutr_item.get("fat_g", payload.fat_g)),
            ),
        )


food_service = FoodService()
