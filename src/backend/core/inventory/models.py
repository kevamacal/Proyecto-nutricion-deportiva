"""Domain models for InventoryItem entity."""

from datetime import UTC, date, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class InventoryStatus(str, Enum):
    """Pantry item availability status."""

    AVAILABLE = "AVAILABLE"
    LOW_STOCK = "LOW_STOCK"
    EXPIRED = "EXPIRED"
    CONSUMED = "CONSUMED"


class InventoryItem(BaseModel):
    """User pantry inventory item entity model."""

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    food_item_id: UUID
    quantity: float = Field(..., ge=0, description="Available stock quantity")
    unit: str = Field(..., min_length=1, max_length=50)
    date_added: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expiration_date: date | None = Field(default=None)
    status: InventoryStatus = Field(default=InventoryStatus.AVAILABLE)
