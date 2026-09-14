"""Specialized Strength Training Activity domain model extension."""

from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class StrengthTrainingType(str, Enum):
    """Categorization of gym strength training sessions."""

    HYPERTROPHY = "HYPERTROPHY"
    STRENGTH = "STRENGTH"
    POWER = "POWER"
    HYBRID = "HYBRID"
    ENDURANCE = "ENDURANCE"


class StrengthTrainingActivity(BaseModel):
    """Specialized strength training activity metrics model."""

    id: UUID = Field(default_factory=uuid4)
    activity_id: UUID
    training_type: StrengthTrainingType
    protein_demand_g: float = Field(
        ..., ge=0, description="Estimated protein recovery demand (g)"
    )
    targeted_muscle_groups: list[str] | None = Field(default=None)
    total_volume_kg: float | None = Field(
        default=None, ge=0, description="Optional total tonnage moved (kg)"
    )
    total_sets: int | None = Field(
        default=None, ge=0, description="Optional total completed sets"
    )
    total_reps: int | None = Field(
        default=None, ge=0, description="Optional total completed reps"
    )
