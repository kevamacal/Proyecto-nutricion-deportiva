"""Domain models for FoodItem and NutritionalInformation entities."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class FoodItem(BaseModel):
    """Catalog food item entity model."""

    id: UUID = Field(default_factory=uuid4)
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    default_unit: str = Field(default="g", min_length=1, max_length=50)
    is_custom: bool = Field(default=False)
    created_by_user_id: UUID | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class NutritionalInformation(BaseModel):
    """Macronutrient and micronutrient breakdown per reference serving size."""

    id: UUID = Field(default_factory=uuid4)
    food_item_id: UUID
    serving_size: float = Field(..., gt=0, description="Reference serving size")
    serving_unit: str = Field(default="g", min_length=1, max_length=50)
    calories_kcal: float = Field(..., ge=0, description="Calories (kcal)")
    protein_g: float = Field(..., ge=0, description="Protein (g)")
    carbohydrates_g: float = Field(..., ge=0, description="Carbohydrates (g)")
    fat_g: float = Field(..., ge=0, description="Fat (g)")
    fiber_g: float | None = Field(default=None, ge=0, description="Fiber (g)")
    sugars_g: float | None = Field(default=None, ge=0, description="Sugars (g)")
    sodium_mg: float | None = Field(default=None, ge=0, description="Sodium (mg)")
