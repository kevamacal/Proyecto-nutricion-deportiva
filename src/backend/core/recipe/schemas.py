"""Pydantic input and output contract schemas for recipe_node.

Must conform strictly to Section 6 of docs/architecture/03_node_contracts.md.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RemainingNeedsInput(BaseModel):
    """Remaining nutritional target requirements."""

    model_config = ConfigDict(extra="forbid")

    remaining_calories_kcal: float
    remaining_protein_g: float
    remaining_carbs_g: float
    remaining_fat_g: float


class AvailableIngredientInput(BaseModel):
    """Pantry stock ingredient input for recipe generation."""

    model_config = ConfigDict(extra="forbid")

    food_item_id: UUID
    name: str
    available_quantity: float
    unit: str
    density_class: str
    expiration_date: str | None = None


class UserConstraintsInput(BaseModel):
    """Optional user preferences and meal constraints."""

    model_config = ConfigDict(extra="forbid")

    max_preparation_time_minutes: int = Field(default=30, ge=1)
    meal_type: str | None = Field(default="DINNER")
    dietary_restrictions: list[str] = Field(default_factory=list)
    disliked_ingredients: list[str] = Field(default_factory=list)


class SportsRecoveryContextInput(BaseModel):
    """Optional athletic recovery demand context."""

    model_config = ConfigDict(extra="forbid")

    sport: str | None = None
    recovery_priority: str | None = None


class RecipeNodeInput(BaseModel):
    """Strict input contract schema for recipe_node (Section 6.2 of 03_node_contracts.md)."""

    model_config = ConfigDict(extra="forbid")

    remaining_needs: RemainingNeedsInput
    available_ingredients: list[AvailableIngredientInput] = Field(default_factory=list)
    user_constraints: UserConstraintsInput | None = Field(
        default_factory=UserConstraintsInput
    )
    sports_recovery_context: SportsRecoveryContextInput | None = None


class IngredientUsedOutput(BaseModel):
    """Ingredient used in generated recipe."""

    model_config = ConfigDict(extra="forbid")

    food_item_id: UUID | None = None
    name: str
    quantity_used: float = Field(..., ge=0)
    unit: str
    is_from_inventory: bool


class PreparationStepOutput(BaseModel):
    """Step-by-step culinary preparation instruction."""

    model_config = ConfigDict(extra="forbid")

    step_number: int = Field(..., ge=1)
    instruction: str


class EstimatedNutritionalSummaryOutput(BaseModel):
    """Estimated macronutrient totals for generated recipe."""

    model_config = ConfigDict(extra="forbid")

    calories_kcal: float
    protein_g: float
    carbohydrates_g: float
    fat_g: float


class RecipeNodeOutput(BaseModel):
    """Strict output contract schema for recipe_node (Section 6.3 of 03_node_contracts.md)."""

    model_config = ConfigDict(extra="forbid")

    recipe_name: str
    prep_time_minutes: int = Field(..., ge=0)
    cook_time_minutes: int = Field(..., ge=0)
    total_time_minutes: int = Field(..., ge=0)
    servings: int = Field(default=1, ge=1)
    ingredients_used: list[IngredientUsedOutput]
    preparation_steps: list[PreparationStepOutput]
    estimated_nutritional_summary: EstimatedNutritionalSummaryOutput
    nutritional_fit_score: float = Field(default=100.0, ge=0.0, le=100.0)
    explanation: str
