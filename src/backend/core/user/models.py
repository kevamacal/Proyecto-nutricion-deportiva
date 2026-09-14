"""Domain models for User and NutritionalProfile entities."""

from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ActivityLevel(str, Enum):
    """Activity level categories for energy expenditure multipliers."""

    SEDENTARY = "SEDENTARY"
    MODERATE = "MODERATE"
    ACTIVE = "ACTIVE"
    VERY_ACTIVE = "VERY_ACTIVE"


class BodyCompositionGoal(str, Enum):
    """Body composition goals impacting caloric target adjustment."""

    MAINTAIN = "MAINTAIN"
    BULK = "BULK"
    CUT = "CUT"
    RECOMP = "RECOMP"


class NutritionalGoal(str, Enum):
    """Nutritional goals shaping macronutrient distribution ratios."""

    PERFORMANCE = "PERFORMANCE"
    HYPERTROPHY = "HYPERTROPHY"
    HEALTH = "HEALTH"
    FAT_LOSS_FOCUS = "FAT_LOSS_FOCUS"


class User(BaseModel):
    """Core domain representation of a system user."""

    id: UUID = Field(default_factory=uuid4)
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class NutritionalProfile(BaseModel):
    """Nutritional profile storing user metrics and computed daily targets."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    weight_kg: float = Field(..., gt=0, description="Weight in kilograms")
    height_cm: float = Field(..., gt=0, description="Height in centimeters")
    age: int = Field(..., gt=0, description="Age in years")
    activity_level: ActivityLevel
    body_composition_goal: BodyCompositionGoal
    nutritional_goal: NutritionalGoal
    daily_calories_target: float = Field(
        ..., ge=0, description="Computed daily caloric target (kcal)"
    )
    daily_protein_g_target: float = Field(
        ..., ge=0, description="Computed daily protein target (g)"
    )
    daily_carbs_g_target: float = Field(
        ..., ge=0, description="Computed daily carbohydrate target (g)"
    )
    daily_fat_g_target: float = Field(
        ..., ge=0, description="Computed daily fat target (g)"
    )
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
