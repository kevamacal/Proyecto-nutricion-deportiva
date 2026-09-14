"""Core Activity domain entity model."""

from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ActivitySport(str, Enum):
    """Supported sports for activity tracking."""

    BASKETBALL = "BASKETBALL"
    STRENGTH_TRAINING = "STRENGTH_TRAINING"


class ActivityIntensity(str, Enum):
    """Session perceived or MET intensity rating."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


class Activity(BaseModel):
    """Core physical activity exercise session entity model."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    sport: ActivitySport
    session_type: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    intensity: ActivityIntensity
    date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    estimated_expenditure_kcal: float = Field(
        ..., ge=0, description="Computed energy expenditure (kcal)"
    )
