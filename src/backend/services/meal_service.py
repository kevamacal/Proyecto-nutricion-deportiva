"""Service layer managing meal logging and daily nutritional summary domain operations."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from src.backend.api.v1.schemas import (
    DailySummaryResponse,
    LoggedMealEntryResponse,
    LoggedMealItemResponse,
    LogMealRequest,
)
from src.backend.db.repository import meal_repository, pantry_repository


class MealService:
    """Service handling meal logs, pantry stock deduction, and daily summaries."""

    def get_daily_summary(self, user_id: UUID, date_str: str) -> DailySummaryResponse:
        """Calculate total calories and macros logged for a given day."""
        start_iso = f"{date_str}T00:00:00.000Z"
        end_iso = f"{date_str}T23:59:59.999Z"

        meals = meal_repository.get_meals_by_date_range(
            str(user_id), start_iso, end_iso
        )

        consumed_cal = sum(float(m.get("total_calories_kcal", 0.0)) for m in meals)
        consumed_p = sum(float(m.get("total_protein_g", 0.0)) for m in meals)
        consumed_c = sum(float(m.get("total_carbs_g", 0.0)) for m in meals)
        consumed_f = sum(float(m.get("total_fat_g", 0.0)) for m in meals)

        return DailySummaryResponse(
            consumed_calories_kcal=round(consumed_cal, 1),
            consumed_protein_g=round(consumed_p, 1),
            consumed_carbohydrates_g=round(consumed_c, 1),
            consumed_fat_g=round(consumed_f, 1),
            meals_logged_count=len(meals),
        )

    def get_logged_meals(
        self, user_id: UUID, date_str: str
    ) -> list[LoggedMealEntryResponse]:
        """Fetch logged meals with item details for a specific user and date."""
        start_iso = f"{date_str}T00:00:00.000Z"
        end_iso = f"{date_str}T23:59:59.999Z"

        meals = meal_repository.get_meals_by_date_range(
            str(user_id), start_iso, end_iso
        )
        return self._format_meal_list(meals)

    def get_recent_meals(
        self, user_id: UUID, limit: int = 10
    ) -> list[LoggedMealEntryResponse]:
        """Fetch recent logged meals for user."""
        meals = meal_repository.get_recent_meals(str(user_id), limit)
        return self._format_meal_list(meals)

    def log_meal(self, payload: LogMealRequest) -> LoggedMealEntryResponse:
        """Log meal entry and automatically deduct consumed stock from user's available pantry."""
        meal_data: dict[str, Any] = {
            "user_id": str(payload.user_id),
            "meal_type": payload.meal_type,
            "total_calories_kcal": payload.total_calories_kcal,
            "total_protein_g": payload.total_protein_g,
            "total_carbs_g": payload.total_carbs_g,
            "total_fat_g": payload.total_fat_g,
            "notes": payload.notes,
            "logged_at": datetime.now(UTC).isoformat(),
        }
        if payload.name:
            meal_data["name"] = payload.name

        items_data = [item.model_dump(exclude_none=True) for item in payload.items]
        created_meal = meal_repository.create_meal(meal_data, items_data)

        # Deduct stock from available pantry items
        self._deduct_pantry_inventory(str(payload.user_id), payload.items)

        formatted_items: list[LoggedMealItemResponse] = []
        for raw_item in created_meal.get("meal_items", []):
            food_info = raw_item.get("food_items") or {}
            formatted_items.append(
                LoggedMealItemResponse(
                    id=UUID(raw_item["id"]) if raw_item.get("id") else None,
                    food_item_id=UUID(raw_item["food_item_id"])
                    if raw_item.get("food_item_id")
                    else None,
                    name=raw_item.get("name") or food_info.get("name"),
                    quantity=float(raw_item.get("quantity", 0)),
                    unit=str(raw_item.get("unit", "g")),
                    calories_kcal=float(raw_item.get("calories_kcal", 0)),
                    protein_g=float(raw_item.get("protein_g", 0)),
                    carbohydrates_g=float(raw_item.get("carbohydrates_g", 0)),
                    fat_g=float(raw_item.get("fat_g", 0)),
                )
            )

        return LoggedMealEntryResponse(
            id=UUID(created_meal["id"]),
            user_id=UUID(created_meal["user_id"]),
            meal_type=str(created_meal.get("meal_type", payload.meal_type)),
            name=created_meal.get("name"),
            total_calories_kcal=float(created_meal.get("total_calories_kcal", 0.0)),
            total_protein_g=float(created_meal.get("total_protein_g", 0.0)),
            total_carbs_g=float(created_meal.get("total_carbs_g", 0.0)),
            total_fat_g=float(created_meal.get("total_fat_g", 0.0)),
            notes=created_meal.get("notes"),
            logged_at=str(created_meal.get("logged_at", datetime.now(UTC).isoformat())),
            items=formatted_items,
        )

    def _deduct_pantry_inventory(self, user_id: str, items: list[Any]) -> None:
        """Domain logic to deduct consumed food items from available pantry inventory."""
        if not user_id or not items:
            return

        available_stock = pantry_repository.list_inventory(user_id)
        if not available_stock:
            return

        for item in items:
            self._process_single_item_deduction(item, available_stock)

    def _process_single_item_deduction(
        self, item: Any, available_stock: list[dict[str, Any]]
    ) -> None:
        """Deduct stock for a single consumed item if present in pantry."""
        food_id = (
            str(item.food_item_id) if getattr(item, "food_item_id", None) else None
        )
        qty = float(item.quantity) if getattr(item, "quantity", None) else 0.0
        if not food_id or qty <= 0:
            return

        match_row = next(
            (r for r in available_stock if str(r.get("food_item_id")) == food_id),
            None,
        )
        if match_row:
            curr_qty = float(match_row.get("quantity", 0.0))
            new_qty = max(0.0, curr_qty - qty)
            new_status = "CONSUMED" if new_qty == 0 else "AVAILABLE"
            pantry_repository.update_quantity(match_row["id"], new_qty, new_status)

    def _format_meal_list(
        self, raw_meals: list[dict[str, Any]]
    ) -> list[LoggedMealEntryResponse]:
        """Format raw DB meal rows into Pydantic DTO list."""
        result: list[LoggedMealEntryResponse] = []
        for meal in raw_meals:
            items: list[LoggedMealItemResponse] = []
            for item in meal.get("meal_items", []):
                food_info = item.get("food_items") or {}
                items.append(
                    LoggedMealItemResponse(
                        id=UUID(item["id"]) if item.get("id") else None,
                        food_item_id=UUID(item["food_item_id"])
                        if item.get("food_item_id")
                        else None,
                        name=item.get("name") or food_info.get("name"),
                        quantity=float(item.get("quantity", 0)),
                        unit=str(item.get("unit", "g")),
                        calories_kcal=float(item.get("calories_kcal", 0)),
                        protein_g=float(item.get("protein_g", 0)),
                        carbohydrates_g=float(item.get("carbohydrates_g", 0)),
                        fat_g=float(item.get("fat_g", 0)),
                    )
                )

            result.append(
                LoggedMealEntryResponse(
                    id=UUID(meal["id"]),
                    user_id=UUID(meal["user_id"]),
                    meal_type=str(meal.get("meal_type", "POST_WORKOUT")),
                    name=meal.get("name"),
                    total_calories_kcal=float(meal.get("total_calories_kcal", 0.0)),
                    total_protein_g=float(meal.get("total_protein_g", 0.0)),
                    total_carbs_g=float(meal.get("total_carbs_g", 0.0)),
                    total_fat_g=float(meal.get("total_fat_g", 0.0)),
                    notes=meal.get("notes"),
                    logged_at=str(meal.get("logged_at", datetime.now(UTC).isoformat())),
                    items=items,
                )
            )
        return result


meal_service = MealService()
