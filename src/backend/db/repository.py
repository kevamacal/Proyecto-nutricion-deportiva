"""In-memory database repository layer for Food Catalog and Inventory Management."""

from datetime import date
from uuid import UUID, uuid4

from src.backend.api.v1.schemas import (
    DailySummaryResponse,
    FoodItemCreate,
    FoodItemResponse,
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    MealCreate,
    MealItemResponse,
    MealResponse,
    NutritionalInfoSchema,
)
from src.backend.core.inventory.models import InventoryStatus


class FoodCatalogRepository:
    """Repository handling Food Catalog storage and queries."""

    def __init__(self) -> None:
        self._items: dict[UUID, FoodItemResponse] = {}
        self._seed_default_items()

    def _seed_default_items(self) -> None:
        """Seed default global food catalog items."""
        defaults = [
            (
                "Pechuga de pollo",
                "Meat",
                "g",
                100.0,
                165.0,
                31.0,
                0.0,
                3.6,
                0.0,
                0.0,
                74.0,
            ),
            (
                "Arroz blanco cocido",
                "Grains",
                "g",
                100.0,
                130.0,
                2.7,
                28.2,
                0.3,
                0.4,
                0.05,
                1.0,
            ),
            (
                "Huevo entero",
                "Dairy & Eggs",
                "unit",
                1.0,
                72.0,
                6.3,
                0.4,
                4.8,
                0.0,
                0.2,
                71.0,
            ),
            (
                "Pan de molde para sándwich",
                "Grains",
                "g",
                100.0,
                265.0,
                8.5,
                49.0,
                3.2,
                3.0,
                4.5,
                490.0,
            ),
            (
                "Jamón en lonchas (Chopped/Cocido)",
                "Processed Meats",
                "g",
                100.0,
                110.0,
                17.0,
                1.5,
                4.0,
                0.0,
                1.0,
                850.0,
            ),
            (
                "Queso en lonchas para sándwich",
                "Dairy & Eggs",
                "g",
                100.0,
                330.0,
                22.0,
                2.0,
                26.0,
                0.0,
                1.5,
                700.0,
            ),
        ]
        for (
            name,
            cat,
            unit,
            srv_sz,
            cal,
            prot,
            carb,
            fat,
            fib,
            sug,
            sod,
        ) in defaults:
            item_id = uuid4()
            self._items[item_id] = FoodItemResponse(
                id=item_id,
                name=name,
                category=cat,
                default_unit=unit,
                is_custom=False,
                created_by_user_id=None,
                nutrition=NutritionalInfoSchema(
                    serving_size=srv_sz,
                    serving_unit=unit,
                    calories_kcal=cal,
                    protein_g=prot,
                    carbohydrates_g=carb,
                    fat_g=fat,
                    fiber_g=fib,
                    sugars_g=sug,
                    sodium_mg=sod,
                ),
            )

    def list_items(
        self, query: str | None = None, user_id: UUID | None = None
    ) -> list[FoodItemResponse]:
        """List food items matching query or user filter."""
        results: list[FoodItemResponse] = []
        for item in self._items.values():
            if (not item.is_custom or item.created_by_user_id == user_id) and (
                query is None
                or query.lower() in item.name.lower()
                or query.lower() in item.category.lower()
            ):
                results.append(item)
        return results

    def get_by_id(self, item_id: UUID) -> FoodItemResponse | None:
        """Get food item by ID."""
        return self._items.get(item_id)

    def create_custom_item(self, payload: FoodItemCreate) -> FoodItemResponse:
        """Create custom food item."""
        item_id = uuid4()
        response = FoodItemResponse(
            id=item_id,
            name=payload.name,
            category=payload.category,
            default_unit=payload.default_unit,
            is_custom=True,
            created_by_user_id=payload.user_id,
            nutrition=NutritionalInfoSchema(
                serving_size=payload.serving_size,
                serving_unit=payload.serving_unit,
                calories_kcal=payload.calories_kcal,
                protein_g=payload.protein_g,
                carbohydrates_g=payload.carbohydrates_g,
                fat_g=payload.fat_g,
                fiber_g=payload.fiber_g,
                sugars_g=payload.sugars_g,
                sodium_mg=payload.sodium_mg,
            ),
        )
        self._items[item_id] = response
        return response


class InventoryRepository:
    """Repository handling Pantry Inventory items."""

    def __init__(self, food_repo: FoodCatalogRepository) -> None:
        self._items: dict[UUID, InventoryItemResponse] = {}
        self._food_repo = food_repo

    def list_by_user(
        self, user_id: UUID, status: InventoryStatus | None = None
    ) -> list[InventoryItemResponse]:
        """List inventory items owned by user."""
        results: list[InventoryItemResponse] = []
        for item in self._items.values():
            if item.user_id == user_id and (status is None or item.status == status):
                results.append(item)
        return results

    def get_by_id(self, item_id: UUID) -> InventoryItemResponse | None:
        """Get inventory item by ID."""
        return self._items.get(item_id)

    def add_item(self, payload: InventoryItemCreate) -> InventoryItemResponse:
        """Add item to inventory."""
        item_id = uuid4()
        food_item = self._food_repo.get_by_id(payload.food_item_id)
        response = InventoryItemResponse(
            id=item_id,
            user_id=payload.user_id,
            food_item_id=payload.food_item_id,
            quantity=payload.quantity,
            unit=payload.unit,
            expiration_date=payload.expiration_date,
            status=InventoryStatus.AVAILABLE,
            food_item=food_item,
        )
        self._items[item_id] = response
        return response

    def update_item(
        self, item_id: UUID, payload: InventoryItemUpdate
    ) -> InventoryItemResponse | None:
        """Update existing inventory item quantity or status."""
        item = self._items.get(item_id)
        if not item:
            return None

        new_quantity = (
            payload.quantity if payload.quantity is not None else item.quantity
        )
        new_status = payload.status if payload.status is not None else item.status
        new_exp = (
            payload.expiration_date
            if payload.expiration_date is not None
            else item.expiration_date
        )

        updated = InventoryItemResponse(
            id=item.id,
            user_id=item.user_id,
            food_item_id=item.food_item_id,
            quantity=new_quantity,
            unit=item.unit,
            date_added=item.date_added,
            expiration_date=new_exp,
            status=new_status,
            food_item=item.food_item,
        )
        self._items[item_id] = updated
        return updated

    def delete_item(self, item_id: UUID) -> bool:
        """Delete item from inventory."""
        if item_id in self._items:
            del self._items[item_id]
            return True
        return False


class MealRepository:
    """Repository handling Meal logging and intake aggregation."""

    def __init__(self, food_repo: FoodCatalogRepository) -> None:
        self._meals: dict[UUID, MealResponse] = {}
        self._food_repo = food_repo

    def log_meal(self, payload: MealCreate) -> MealResponse:
        """Log a meal event and aggregate item macronutrients."""
        meal_id = uuid4()
        calculated_items: list[MealItemResponse] = []
        tot_cal, tot_prot, tot_carb, tot_fat = 0.0, 0.0, 0.0, 0.0

        for item_payload in payload.items:
            food_item = self._food_repo.get_by_id(item_payload.food_item_id)
            if food_item and food_item.nutrition:
                factor = item_payload.quantity / food_item.nutrition.serving_size
                cal = food_item.nutrition.calories_kcal * factor
                prot = food_item.nutrition.protein_g * factor
                carb = food_item.nutrition.carbohydrates_g * factor
                fat = food_item.nutrition.fat_g * factor
                name = food_item.name
            else:
                cal, prot, carb, fat = 0.0, 0.0, 0.0, 0.0
                name = "Unknown Food Item"

            tot_cal += cal
            tot_prot += prot
            tot_carb += carb
            tot_fat += fat

            calculated_items.append(
                MealItemResponse(
                    id=uuid4(),
                    food_item_id=item_payload.food_item_id,
                    food_item_name=name,
                    quantity=item_payload.quantity,
                    unit=item_payload.unit,
                    calories_kcal=round(cal, 2),
                    protein_g=round(prot, 2),
                    carbohydrates_g=round(carb, 2),
                    fat_g=round(fat, 2),
                )
            )

        response = MealResponse(
            id=meal_id,
            user_id=payload.user_id,
            meal_type=payload.meal_type,
            logged_at=payload.logged_at,
            items=calculated_items,
            total_calories_kcal=round(tot_cal, 2),
            total_protein_g=round(tot_prot, 2),
            total_carbohydrates_g=round(tot_carb, 2),
            total_fat_g=round(tot_fat, 2),
        )
        self._meals[meal_id] = response
        return response

    def list_meals(
        self, user_id: UUID, target_date: date | None = None
    ) -> list[MealResponse]:
        """List meals logged by user, optionally filtered by date."""
        results: list[MealResponse] = []
        for meal in self._meals.values():
            if meal.user_id == user_id and (
                target_date is None or meal.logged_at.date() == target_date
            ):
                results.append(meal)
        return results

    def get_daily_summary(
        self, user_id: UUID, target_date: date
    ) -> DailySummaryResponse:
        """Aggregate total consumed calories and macronutrients for a given date."""
        meals = self.list_meals(user_id, target_date)
        consumed_cal = sum(m.total_calories_kcal for m in meals)
        consumed_prot = sum(m.total_protein_g for m in meals)
        consumed_carb = sum(m.total_carbohydrates_g for m in meals)
        consumed_fat = sum(m.total_fat_g for m in meals)

        return DailySummaryResponse(
            date=target_date,
            user_id=user_id,
            consumed_calories_kcal=round(consumed_cal, 2),
            consumed_protein_g=round(consumed_prot, 2),
            consumed_carbohydrates_g=round(consumed_carb, 2),
            consumed_fat_g=round(consumed_fat, 2),
            meals_logged_count=len(meals),
        )


# Global singletons
food_repository = FoodCatalogRepository()
inventory_repository = InventoryRepository(food_repository)
meal_repository = MealRepository(food_repository)
