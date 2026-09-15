"""Pydantic API DTO schemas for request payloads and response bodies."""

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from src.backend.core.inventory.models import InventoryStatus


class NutritionalInfoSchema(BaseModel):
    """Nutritional information schema for food item responses."""

    serving_size: float = Field(default=100.0, gt=0)
    serving_unit: str = Field(default="g")
    calories_kcal: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    carbohydrates_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    sugars_g: float | None = Field(default=None, ge=0)
    sodium_mg: float | None = Field(default=None, ge=0)


class FoodItemCreate(BaseModel):
    """Payload for creating a custom food item with nutritional values."""

    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    default_unit: str = Field(default="g", min_length=1, max_length=50)
    serving_size: float = Field(default=100.0, gt=0)
    serving_unit: str = Field(default="g", min_length=1, max_length=50)
    calories_kcal: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    carbohydrates_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    sugars_g: float | None = Field(default=None, ge=0)
    sodium_mg: float | None = Field(default=None, ge=0)
    user_id: UUID | None = Field(default=None)


class FoodItemResponse(BaseModel):
    """Response DTO for catalog food items."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    category: str
    default_unit: str
    is_custom: bool
    created_by_user_id: UUID | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    nutrition: NutritionalInfoSchema | None = None


class InventoryItemCreate(BaseModel):
    """Payload for adding an item to pantry inventory."""

    user_id: UUID
    food_item_id: UUID
    quantity: float = Field(..., ge=0)
    unit: str = Field(..., min_length=1, max_length=50)
    expiration_date: date | None = Field(default=None)


class InventoryItemUpdate(BaseModel):
    """Payload for updating pantry stock, status or expiration date."""

    quantity: float | None = Field(default=None, ge=0)
    status: InventoryStatus | None = Field(default=None)
    expiration_date: date | None = Field(default=None)


class InventoryItemResponse(BaseModel):
    """Response DTO for inventory item records."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    food_item_id: UUID
    quantity: float
    unit: str
    date_added: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expiration_date: date | None = None
    status: InventoryStatus = Field(default=InventoryStatus.AVAILABLE)
    food_item: FoodItemResponse | None = None


class MealItemCreate(BaseModel):
    """Item component in a logged meal."""

    food_item_id: UUID
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="g")


class MealItemResponse(BaseModel):
    """Calculated nutrition item response in a logged meal."""

    id: UUID = Field(default_factory=uuid4)
    food_item_id: UUID
    food_item_name: str
    quantity: float
    unit: str
    calories_kcal: float
    protein_g: float
    carbohydrates_g: float
    fat_g: float


class MealCreate(BaseModel):
    """Payload for logging a meal event."""

    user_id: UUID
    meal_type: str = Field(default="Breakfast", min_length=1, max_length=50)
    logged_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    items: list[MealItemCreate] = Field(..., min_length=1)


class MealResponse(BaseModel):
    """Response DTO for logged meal event with aggregated totals."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    meal_type: str
    logged_at: datetime
    items: list[MealItemResponse]
    total_calories_kcal: float
    total_protein_g: float
    total_carbohydrates_g: float
    total_fat_g: float


class DailySummaryResponse(BaseModel):
    """Response DTO for aggregated daily nutritional intake summary."""

    date: date
    user_id: UUID
    consumed_calories_kcal: float
    consumed_protein_g: float
    consumed_carbohydrates_g: float
    consumed_fat_g: float
    meals_logged_count: int


class TargetCalculationRequest(BaseModel):
    """Payload for deterministic Target Calculation API."""

    user_id: UUID
    weight_kg: float = Field(..., gt=0, le=300)
    height_cm: float = Field(..., gt=0, le=300)
    age: int = Field(..., gt=0, le=120)
    sex: str = Field(..., pattern="^(male|female|hombre|mujer|M|F)$")
    activity_level: str = Field(..., min_length=1)
    goal: str = Field(..., min_length=1)


class TargetCalculationResponse(BaseModel):
    """Response payload with calculated caloric and macronutrient targets."""

    user_id: UUID
    bmr_kcal: float
    base_tdee_kcal: float
    calories_target_kcal: float
    protein_target_g: float
    fat_target_g: float
    carbs_target_g: float


class ActivityLogRequest(BaseModel):
    """Payload for logging an athletic session."""

    user_id: UUID
    sport_type: str = Field(..., min_length=1)
    duration_minutes: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)
    intensity: str = Field(default="moderate")
    rpe: float | None = Field(default=None, ge=1, le=10)


class ActivityLogResponse(BaseModel):
    """Response DTO for logged athletic activity session."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    sport_type: str
    duration_minutes: float
    energy_expended_kcal: float
    hydration_recommendation_ml: float
    recovery_notes: str


class RecommendationRequest(BaseModel):
    """Request payload for deterministic non-LLM recommendation engine."""

    user_id: UUID
    target_calories_kcal: float = Field(..., gt=0)
    target_protein_g: float = Field(..., gt=0)
    target_carbohydrates_g: float = Field(..., gt=0)
    target_fat_g: float = Field(..., gt=0)
    consumed_calories_kcal: float = Field(default=0.0, ge=0)
    consumed_protein_g: float = Field(default=0.0, ge=0)
    consumed_carbohydrates_g: float = Field(default=0.0, ge=0)
    consumed_fat_g: float = Field(default=0.0, ge=0)
    activity_expenditure_kcal: float = Field(default=0.0, ge=0)
    activity_carb_demand_g: float = Field(default=0.0, ge=0)
    activity_protein_demand_g: float = Field(default=0.0, ge=0)


class IngredientMatch(BaseModel):
    """Pantry inventory item matched for meal recommendation."""

    food_item_id: UUID
    food_name: str
    category: str
    available_stock: float
    unit: str
    recommended_portion_g: float
    calories_contribution_kcal: float
    protein_contribution_g: float
    carbs_contribution_g: float
    fat_contribution_g: float


class RecommendationResponse(BaseModel):
    """Response payload with calculated remaining intake demands and matched pantry stock."""

    user_id: UUID
    remaining_calories_kcal: float
    remaining_protein_g: float
    remaining_carbohydrates_g: float
    remaining_fat_g: float
    dominant_deficit_macronutrient: str
    recommended_ingredients: list[IngredientMatch]
    recommendation_summary: str
