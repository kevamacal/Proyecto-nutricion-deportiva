"""Domain models for Meal and MealItem entities."""

from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class MealType(str, Enum):
    """Categorization of eating sessions."""

    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    SNACK = "SNACK"
    POST_WORKOUT = "POST_WORKOUT"


class MealItem(BaseModel):
    """Individual food item portion consumed within a meal."""

    id: UUID = Field(default_factory=uuid4)
    meal_id: UUID
    food_item_id: UUID
    quantity: float = Field(..., gt=0, description="Amount consumed")
    unit: str = Field(..., min_length=1, max_length=50)
    calories_kcal: float = Field(..., ge=0, description="Portion calculated calories")
    protein_g: float = Field(..., ge=0, description="Portion calculated protein (g)")
    carbohydrates_g: float = Field(
        ..., ge=0, description="Portion calculated carbs (g)"
    )
    fat_g: float = Field(..., ge=0, description="Portion calculated fat (g)")


class Meal(BaseModel):
    """Logged meal eating event entity model."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    meal_type: MealType
    logged_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    total_calories_kcal: float = Field(
        ..., ge=0, description="Aggregated sum of MealItem calories"
    )
    total_protein_g: float = Field(
        ..., ge=0, description="Aggregated sum of MealItem protein"
    )
    total_carbs_g: float = Field(
        ..., ge=0, description="Aggregated sum of MealItem carbs"
    )
    total_fat_g: float = Field(..., ge=0, description="Aggregated sum of MealItem fat")
    notes: str | None = Field(default=None)
