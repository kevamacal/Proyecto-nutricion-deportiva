"""Service layer managing Athletic Activity Session domain operations."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.backend.api.v1.schemas import (
    ActivityLogRequest,
    ActivityLogResponse,
    LogActivitySessionRequest,
    LoggedActivityEntryResponse,
)
from src.backend.core.activity.models import ActivityIntensity
from src.backend.db.repository import activity_repository
from src.backend.sports.activity_calculator import (
    calculate_basketball_expenditure_and_demands,
    calculate_strength_expenditure_and_demands,
)
from src.backend.sports.basketball.models import BasketballSessionCategory
from src.backend.sports.strength_training.models import StrengthTrainingType


class ActivityService:
    """Service handling athletic session expenditure, recovery demands, and database persistence."""

    def log_activity(self, payload: ActivityLogRequest) -> ActivityLogResponse:
        """Calculate expenditure and recovery demands for a session."""
        int_str = payload.intensity.lower()
        if "very" in int_str or "high" in int_str:
            intensity = ActivityIntensity.HIGH
        elif "low" in int_str:
            intensity = ActivityIntensity.LOW
        else:
            intensity = ActivityIntensity.MEDIUM

        sport = payload.sport_type.lower()
        if "basket" in sport:
            demands = calculate_basketball_expenditure_and_demands(
                weight_kg=payload.weight_kg,
                duration_minutes=int(payload.duration_minutes),
                intensity=intensity,
                session_category=BasketballSessionCategory.TRAINING,
            )
            expenditure = float(demands["estimated_expenditure_kcal"])
            hydration = float(demands["hydration_demand_ml"])
            notes = f"Basketball session logged. Carb replenishment demand: {demands['carb_demand_g']}g."
        else:
            demands = calculate_strength_expenditure_and_demands(
                weight_kg=payload.weight_kg,
                duration_minutes=int(payload.duration_minutes),
                intensity=intensity,
                training_type=StrengthTrainingType.HYPERTROPHY,
            )
            expenditure = float(demands["estimated_expenditure_kcal"])
            hydration = round(payload.duration_minutes * 10.0, 2)
            notes = (
                f"Strength training logged. MPS Protein demand: {demands['protein_demand_g']}g, "
                f"Carb demand: {demands['carb_demand_g']}g."
            )

        return ActivityLogResponse(
            id=uuid4(),
            user_id=payload.user_id,
            sport_type=payload.sport_type,
            duration_minutes=payload.duration_minutes,
            energy_expended_kcal=expenditure,
            hydration_recommendation_ml=hydration,
            recovery_notes=notes,
        )

    def get_logged_activities(
        self, user_id: UUID, date_str: str
    ) -> list[LoggedActivityEntryResponse]:
        """Fetch logged activities for specific user and date."""
        start_iso = f"{date_str}T00:00:00.000Z"
        end_iso = f"{date_str}T23:59:59.999Z"

        rows = activity_repository.get_activities_by_date_range(
            str(user_id), start_iso, end_iso
        )
        result: list[LoggedActivityEntryResponse] = []

        for row in rows:
            bball = row.get("basketball_activities")
            if isinstance(bball, list):
                bball = bball[0] if len(bball) > 0 else None

            strength = row.get("strength_training_activities")
            if isinstance(strength, list):
                strength = strength[0] if len(strength) > 0 else None

            bball_dict = None
            if bball:
                bball_dict = {
                    "id": bball.get("id"),
                    "session_category": bball.get("session_category"),
                    "carb_demand_g": float(bball.get("carb_demand_g", 0.0)),
                    "hydration_demand_ml": float(bball.get("hydration_demand_ml", 0.0)),
                    "recovery_priority": str(
                        bball.get("recovery_priority", "RECOVERY")
                    ),
                }

            strength_dict = None
            if strength:
                strength_dict = {
                    "id": strength.get("id"),
                    "training_type": strength.get("training_type"),
                    "protein_demand_g": float(strength.get("protein_demand_g", 0.0)),
                    "targeted_muscle_groups": strength.get(
                        "targeted_muscle_groups", []
                    ),
                    "total_volume_kg": float(strength.get("total_volume_kg", 0.0)),
                    "total_sets": int(strength.get("total_sets", 0)),
                    "total_reps": int(strength.get("total_reps", 0)),
                }

            result.append(
                LoggedActivityEntryResponse(
                    id=UUID(row["id"]),
                    user_id=UUID(row["user_id"]),
                    sport=str(row.get("sport", "BASKETBALL")),
                    session_type=str(row.get("session_type", "Training")),
                    duration_minutes=float(row.get("duration_minutes", 0.0)),
                    intensity=str(row.get("intensity", "MEDIUM")),
                    date=str(row.get("date", date_str)),
                    estimated_expenditure_kcal=float(
                        row.get("estimated_expenditure_kcal", 0.0)
                    ),
                    basketball_details=bball_dict,
                    strength_details=strength_dict,
                )
            )

        return result

    def log_activity_session(
        self, payload: LogActivitySessionRequest
    ) -> LoggedActivityEntryResponse:
        """Persist full athletic activity session with specialized sports rows."""
        activity_data = {
            "user_id": str(payload.user_id),
            "sport": payload.sport,
            "session_type": payload.session_type,
            "duration_minutes": payload.duration_minutes,
            "intensity": payload.intensity,
            "estimated_expenditure_kcal": payload.estimated_expenditure_kcal,
            "date": datetime.now(UTC).isoformat(),
        }

        bball_data = (
            payload.basketball_details.model_dump(exclude_none=True)
            if payload.basketball_details
            else None
        )
        strength_data = (
            payload.strength_details.model_dump(exclude_none=True)
            if payload.strength_details
            else None
        )

        created = activity_repository.create_activity(
            activity_data, bball_data, strength_data
        )
        act_id = UUID(created["id"])

        return LoggedActivityEntryResponse(
            id=act_id,
            user_id=payload.user_id,
            sport=payload.sport,
            session_type=payload.session_type,
            duration_minutes=payload.duration_minutes,
            intensity=payload.intensity,
            date=str(created.get("date", datetime.now(UTC).isoformat())),
            estimated_expenditure_kcal=payload.estimated_expenditure_kcal,
            basketball_details=bball_data,
            strength_details=strength_data,
        )

    def update_activity_session(
        self, activity_id: UUID, payload: LogActivitySessionRequest
    ) -> LoggedActivityEntryResponse:
        """Update existing activity session in database."""
        activity_data = {
            "sport": payload.sport,
            "session_type": payload.session_type,
            "duration_minutes": payload.duration_minutes,
            "intensity": payload.intensity,
            "estimated_expenditure_kcal": payload.estimated_expenditure_kcal,
        }

        bball_data = (
            payload.basketball_details.model_dump(exclude_none=True)
            if payload.basketball_details
            else None
        )
        strength_data = (
            payload.strength_details.model_dump(exclude_none=True)
            if payload.strength_details
            else None
        )

        updated = activity_repository.update_activity(
            str(activity_id), activity_data, bball_data, strength_data
        )

        return LoggedActivityEntryResponse(
            id=activity_id,
            user_id=payload.user_id,
            sport=payload.sport,
            session_type=payload.session_type,
            duration_minutes=payload.duration_minutes,
            intensity=payload.intensity,
            date=str(updated.get("date", datetime.now(UTC).isoformat())),
            estimated_expenditure_kcal=payload.estimated_expenditure_kcal,
            basketball_details=bball_data,
            strength_details=strength_data,
        )

    def delete_activity_session(self, activity_id: UUID) -> None:
        """Delete activity session."""
        activity_repository.delete_activity(str(activity_id))


activity_service = ActivityService()
