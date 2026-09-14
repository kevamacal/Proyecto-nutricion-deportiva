"""Specialized Basketball Activity domain model extension."""

from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class BasketballSessionCategory(str, Enum):
    """Categorization of basketball sessions."""

    TRAINING = "TRAINING"
    MATCH = "MATCH"


class BasketballActivity(BaseModel):
    """Specialized basketball activity metrics model."""

    id: UUID = Field(default_factory=uuid4)
    activity_id: UUID
    session_category: BasketballSessionCategory
    carb_demand_g: float = Field(
        ..., ge=0, description="Estimated carbohydrate recovery demand (g)"
    )
    hydration_demand_ml: float = Field(
        ..., ge=0, description="Recommended fluid recovery intake (ml)"
    )
    recovery_priority: str = Field(..., min_length=1, max_length=100)
