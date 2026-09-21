"""Pydantic API DTO schemas for request payloads and response bodies.

Only schemas required by the computation layer (nutrition targets, activity MET,
recommendation engine, recipe node, and LangGraph orchestrator) are defined here.
CRUD schemas have been removed — CRUD is handled directly by the frontend via Supabase.
"""

from uuid import UUID, uuid4

from pydantic import BaseModel, Field


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
    """Request payload for deterministic non-LLM recommendation engine.

    The frontend sends current macro targets, consumed values, activity context,
    and the user's actual pantry items — no DB access needed from the backend.
    """

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
