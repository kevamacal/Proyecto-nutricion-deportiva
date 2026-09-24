"""Service layer managing pantry inventory domain operations."""

from typing import Any
from uuid import UUID

from src.backend.api.v1.schemas import (
    AddPantryBatchRequest,
    AddPantryItemRequest,
    NutritionInfoSchema,
    PantryItemResponse,
)
from src.backend.db.repository import pantry_repository


class PantryService:
    """Service handling pantry stock and inventory management."""

    def get_inventory(self, user_id: UUID) -> list[PantryItemResponse]:
        """Fetch active pantry stock for user."""
        rows = pantry_repository.list_inventory(str(user_id))
        result: list[PantryItemResponse] = []

        for row in rows:
            food = row.get("food_items") or {}
            nutr = food.get("nutritional_information")
            if isinstance(nutr, list):
                nutr = nutr[0] if len(nutr) > 0 else None

            protein = float(nutr.get("protein_g", 0)) if nutr else 0.0
            carbs = float(nutr.get("carbohydrates_g", 0)) if nutr else 0.0
            fat = float(nutr.get("fat_g", 0)) if nutr else 0.0

            density_class = "BALANCED"
            if protein > 15:
                density_class = "PROTEIN_DENSE"
            elif carbs > 20:
                density_class = "CARB_DENSE"
            elif fat > 12:
                density_class = "FAT_DENSE"

            nutrition_obj = None
            if nutr:
                nutrition_obj = NutritionInfoSchema(
                    serving_size=float(nutr.get("serving_size", 100.0)),
                    calories_kcal=float(nutr.get("calories_kcal", 0.0)),
                    protein_g=protein,
                    carbohydrates_g=carbs,
                    fat_g=fat,
                )

            result.append(
                PantryItemResponse(
                    inventory_item_id=UUID(row["id"]),
                    food_item_id=UUID(row["food_item_id"]),
                    name=str(food.get("name", "Alimento")),
                    category=str(food.get("category", "General")),
                    available_quantity=float(row.get("quantity", 0.0)),
                    unit=str(row.get("unit", "g")),
                    expiration_date=str(row.get("expiration_date"))
                    if row.get("expiration_date")
                    else None,
                    days_until_expiration=None,
                    status=str(row.get("status", "AVAILABLE")),
                    density_class=density_class,
                    nutrition=nutrition_obj,
                )
            )

        return result

    def add_pantry_item(self, payload: AddPantryItemRequest) -> dict[str, Any]:
        """Add item to pantry or sum quantity if item with unit already exists."""
        existing = pantry_repository.find_available_item(
            user_id=str(payload.user_id),
            food_item_id=str(payload.food_item_id),
            unit=payload.unit,
        )

        if existing:
            new_qty = float(existing["quantity"]) + float(payload.quantity)
            res = pantry_repository.update_quantity(
                existing["id"], new_qty, "AVAILABLE"
            )
            return res or existing

        item_data = {
            "user_id": str(payload.user_id),
            "food_item_id": str(payload.food_item_id),
            "quantity": payload.quantity,
            "unit": payload.unit,
            "expiration_date": payload.expiration_date,
            "status": "AVAILABLE",
        }
        return pantry_repository.insert_item(item_data)

    def add_pantry_batch(self, payload: AddPantryBatchRequest) -> list[dict[str, Any]]:
        """Batch add items to pantry."""
        results: list[dict[str, Any]] = []
        for item in payload.items:
            res = self.add_pantry_item(item)
            results.append(res)
        return results

    def delete_pantry_item(self, item_id: UUID) -> None:
        """Remove item from pantry."""
        pantry_repository.delete_item(str(item_id))


pantry_service = PantryService()
