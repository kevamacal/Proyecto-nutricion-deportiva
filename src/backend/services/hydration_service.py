"""Service layer managing daily hydration intake domain operations."""

from datetime import UTC, datetime
from uuid import UUID

from src.backend.api.v1.schemas import HydrationLogEntryResponse, LogWaterIntakeRequest
from src.backend.db.repository import hydration_repository


class HydrationService:
    """Service handling water intake logs and daily hydration tracking."""

    def get_daily_hydration(
        self, user_id: UUID, date_str: str
    ) -> list[HydrationLogEntryResponse]:
        """Fetch hydration log entries for specific user and date."""
        start_iso = f"{date_str}T00:00:00.000Z"
        end_iso = f"{date_str}T23:59:59.999Z"

        rows = hydration_repository.get_hydration_logs_by_date_range(
            str(user_id), start_iso, end_iso
        )
        result: list[HydrationLogEntryResponse] = []

        for r in rows:
            result.append(
                HydrationLogEntryResponse(
                    id=UUID(r["id"]),
                    user_id=UUID(r["user_id"]),
                    amount_ml=int(r.get("amount_ml", 0)),
                    logged_at=str(r.get("logged_at", datetime.now(UTC).isoformat())),
                )
            )
        return result

    def log_water_intake(
        self, payload: LogWaterIntakeRequest
    ) -> HydrationLogEntryResponse:
        """Log a new water intake entry."""
        created = hydration_repository.create_hydration_log(
            str(payload.user_id), payload.amount_ml
        )
        return HydrationLogEntryResponse(
            id=UUID(created["id"])
            if created.get("id")
            else UUID("00000000-0000-0000-0000-000000000000"),
            user_id=payload.user_id,
            amount_ml=payload.amount_ml,
            logged_at=str(created.get("logged_at", datetime.now(UTC).isoformat())),
        )

    def delete_hydration_log(self, log_id: UUID) -> None:
        """Delete hydration log entry."""
        hydration_repository.delete_hydration_log(str(log_id))


hydration_service = HydrationService()
