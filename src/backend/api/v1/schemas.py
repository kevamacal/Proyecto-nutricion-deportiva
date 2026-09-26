"""Pydantic API DTO schemas for request payloads and response bodies.

Defines clear contracts for computation layer, auth, user profiles, food catalog,
pantry inventory, meal logging, activity logging, and hydration.
"""

from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

# ============================================================================
# 1. COMPUTATION & TARGET SCHEMAS
# ============================================================================


class TargetCalculationRequest(BaseModel):
    """Payload for deterministic Target Calculation API."""

    user_id: UUID
    weight_kg: float = Field(..., gt=0, le=300)
    height_cm: float = Field(..., gt=0, le=300)
    age: int = Field(..., gt=0, le=120)
    gender: str = Field(..., pattern="^(male|female|hombre|mujer|M|F)$")
    activity_level: str = Field(..., min_length=1)
    body_composition_goal: str = Field(..., min_length=1)


class TargetCalculationResponse(BaseModel):
    """Response payload with calculated caloric and macronutrient targets."""

    user_id: UUID
    bmr_kcal: float
    base_tdee_kcal: float
    calories_target_kcal: float
    protein_target_g: float
    fat_target_g: float
    carbs_target_g: float


# ============================================================================
# 2. AUTHENTICATION & USER PROFILE SCHEMAS
# ============================================================================


class LoginRequest(BaseModel):
    """Payload for user login."""

    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    """Payload for user registration."""

    email: str = Field(..., min_length=3)
    name: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    primary_sport: str = Field(default="BASKETBALL")


class AuthResponse(BaseModel):
    """Response containing user profile and access token."""

    user_id: UUID
    email: str
    name: str
    primary_sport: str = Field(default="BASKETBALL")
    access_token: str | None = None


class UserProfileResponse(BaseModel):
    """User nutritional profile response model."""

    id: UUID | None = None
    user_id: UUID
    email: str | None = None
    name: str | None = None
    weight_kg: float = Field(default=70.0)
    height_cm: float = Field(default=175.0)
    age: int = Field(default=25)
    gender: str = Field(default="male")
    activity_level: str = Field(default="ACTIVE")
    body_composition_goal: str = Field(default="BULK")
    nutritional_goal: str = Field(default="PERFORMANCE")
    daily_calories_target: float = Field(default=2500.0)
    daily_protein_g_target: float = Field(default=160.0)
    daily_carbs_g_target: float = Field(default=280.0)
    daily_fat_g_target: float = Field(default=70.0)
    updated_at: str | None = None


class UpdateProfileRequest(BaseModel):
    """Partial updates for user profile."""

    weight_kg: float | None = Field(default=None, gt=0)
    height_cm: float | None = Field(default=None, gt=0)
    age: int | None = Field(default=None, gt=0)
    gender: str | None = None
    activity_level: str | None = None
    body_composition_goal: str | None = None
    nutritional_goal: str | None = None
    daily_calories_target: float | None = Field(default=None, ge=0)
    daily_protein_g_target: float | None = Field(default=None, ge=0)
    daily_carbs_g_target: float | None = Field(default=None, ge=0)
    daily_fat_g_target: float | None = Field(default=None, ge=0)


class EnsureProfileRequest(BaseModel):
    """Payload to ensure profile row exists."""

    user_id: UUID
    email: str | None = None
    name: str | None = None


# ============================================================================
# 3. FOOD CATALOG SCHEMAS
# ============================================================================


class NutritionInfoSchema(BaseModel):
    """Nutritional information schema."""

    serving_size: float = Field(default=100.0, gt=0)
    calories_kcal: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    carbohydrates_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)


class FoodItemResponse(BaseModel):
    """Food catalog item response model."""

    id: UUID | None = None
    food_item_id: UUID
    name: str
    category: str
    default_unit: str = Field(default="g")
    is_custom: bool = Field(default=False)
    nutrition: NutritionInfoSchema | None = None


class CreateCustomFoodRequest(BaseModel):
    """Payload to register a custom food item."""

    user_id: UUID | None = None
    name: str = Field(..., min_length=1)
    category: str = Field(default="Custom")
    default_unit: str = Field(default="g")
    serving_size: float = Field(default=100.0, gt=0)
    calories_kcal: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    carbohydrates_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)


# ============================================================================
# 4. PANTRY INVENTORY SCHEMAS
# ============================================================================


class PantryItemResponse(BaseModel):
    """Pantry inventory item DTO."""

    inventory_item_id: UUID
    food_item_id: UUID
    name: str
    category: str = Field(default="General")
    available_quantity: float = Field(ge=0)
    unit: str = Field(default="g")
    expiration_date: str | None = None
    days_until_expiration: int | None = None
    status: str = Field(default="AVAILABLE")
    density_class: str = Field(default="BALANCED")
    nutrition: NutritionInfoSchema | None = None


class AddPantryItemRequest(BaseModel):
    """Payload to add an item to pantry inventory."""

    user_id: UUID
    food_item_id: UUID
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="g")
    expiration_date: str | None = None


class AddPantryBatchRequest(BaseModel):
    """Batch payload to add multiple items to pantry inventory."""

    items: list[AddPantryItemRequest] = Field(default_factory=list)


# ============================================================================
# 5. MEAL LOGS SCHEMAS
# ============================================================================


class MealItemPayload(BaseModel):
    """Single item consumed in a meal."""

    food_item_id: UUID | None = None
    name: str | None = None
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="g")
    calories_kcal: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    carbohydrates_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)


class LogMealRequest(BaseModel):
    """Payload to log a meal entry."""

    user_id: UUID
    meal_type: str = Field(default="POST_WORKOUT")
    name: str | None = None
    image_url: str | None = None
    total_calories_kcal: float = Field(default=0.0, ge=0)
    total_protein_g: float = Field(default=0.0, ge=0)
    total_carbs_g: float = Field(default=0.0, ge=0)
    total_fat_g: float = Field(default=0.0, ge=0)
    notes: str | None = None
    items: list[MealItemPayload] = Field(default_factory=list)


class LoggedMealItemResponse(BaseModel):
    """Item detail inside logged meal response."""

    id: UUID | None = None
    food_item_id: UUID | None = None
    name: str | None = None
    quantity: float
    unit: str
    calories_kcal: float
    protein_g: float
    carbohydrates_g: float
    fat_g: float


class LoggedMealEntryResponse(BaseModel):
    """Logged meal entry response DTO."""

    id: UUID
    user_id: UUID
    meal_type: str
    name: str | None = None
    total_calories_kcal: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    notes: str | None = None
    logged_at: str
    items: list[LoggedMealItemResponse] = Field(default_factory=list)


class DailySummaryResponse(BaseModel):
    """Macro and calorie total for a given date."""

    consumed_calories_kcal: float = Field(default=0.0, ge=0)
    consumed_protein_g: float = Field(default=0.0, ge=0)
    consumed_carbohydrates_g: float = Field(default=0.0, ge=0)
    consumed_fat_g: float = Field(default=0.0, ge=0)
    meals_logged_count: int = Field(default=0, ge=0)


# ============================================================================
# 6. ATHLETIC ACTIVITIES SCHEMAS
# ============================================================================


class ActivityLogRequest(BaseModel):
    """Payload for logging an athletic session (basic calculation endpoint)."""

    user_id: UUID
    sport_type: str = Field(..., min_length=1)
    duration_minutes: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)
    intensity: str = Field(default="moderate")
    rpe: float | None = Field(default=None, ge=1, le=10)


class ActivityLogResponse(BaseModel):
    """Response DTO for logged athletic activity session (basic calculation endpoint)."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    sport_type: str
    duration_minutes: float
    energy_expended_kcal: float
    hydration_recommendation_ml: float
    recovery_notes: str


class BasketballDetailsPayload(BaseModel):
    """Basketball specialized details."""

    session_category: str = Field(..., pattern="^(TRAINING|MATCH)$")
    carb_demand_g: float = Field(default=0.0, ge=0)
    hydration_demand_ml: float = Field(default=0.0, ge=0)
    recovery_priority: str = Field(default="RECOVERY")


class StrengthDetailsPayload(BaseModel):
    """Strength training specialized details."""

    training_type: str = Field(
        ..., pattern="^(HYPERTROPHY|STRENGTH|POWER|HYBRID|ENDURANCE)$"
    )
    protein_demand_g: float = Field(default=0.0, ge=0)
    targeted_muscle_groups: list[str] = Field(default_factory=list)
    total_volume_kg: float = Field(default=0.0, ge=0)
    total_sets: int = Field(default=0, ge=0)
    total_reps: int = Field(default=0, ge=0)


class LogActivitySessionRequest(BaseModel):
    """Full session payload to persist an athletic session in database."""

    user_id: UUID
    sport: str = Field(..., pattern="^(BASKETBALL|STRENGTH_TRAINING)$")
    session_type: str = Field(..., min_length=1)
    duration_minutes: float = Field(..., gt=0)
    intensity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|VERY_HIGH)$")
    estimated_expenditure_kcal: float = Field(default=0.0, ge=0)
    basketball_details: BasketballDetailsPayload | None = None
    strength_details: StrengthDetailsPayload | None = None


class LoggedActivityEntryResponse(BaseModel):
    """Persisted athletic activity session response."""

    id: UUID
    user_id: UUID
    sport: str
    session_type: str
    duration_minutes: float
    intensity: str
    date: str
    estimated_expenditure_kcal: float
    basketball_details: dict[str, Any] | None = None
    strength_details: dict[str, Any] | None = None


# ============================================================================
# 7. HYDRATION SCHEMAS
# ============================================================================


class LogWaterIntakeRequest(BaseModel):
    """Payload to log water intake."""

    user_id: UUID
    amount_ml: int = Field(..., gt=0)


class HydrationLogEntryResponse(BaseModel):
    """Logged hydration entry response."""

    id: UUID
    user_id: UUID
    amount_ml: int
    logged_at: str


# ============================================================================
# 8. RECOMMENDATION SCHEMAS
# ============================================================================


class PantryItemNutritionInput(BaseModel):
    """Nutritional values per serving for a pantry item sent from the frontend."""

    serving_size: float = Field(default=100.0, gt=0)
    calories_kcal: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    carbohydrates_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)


class PantryItemInput(BaseModel):
    """Pantry item payload sent by the frontend for recommendation computation."""

    food_item_id: UUID
    name: str
    category: str = Field(default="General")
    available_quantity: float = Field(..., gt=0)
    unit: str = Field(default="g")
    nutrition: PantryItemNutritionInput


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
    pantry_items: list[PantryItemInput] = Field(default_factory=list)


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
