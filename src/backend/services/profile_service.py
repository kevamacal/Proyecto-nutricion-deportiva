"""Service layer managing user nutritional profile domain operations."""

from uuid import UUID

from src.backend.api.v1.schemas import (
    EnsureProfileRequest,
    UpdateProfileRequest,
    UserProfileResponse,
)
from src.backend.db.repository import user_profile_repository


class ProfileService:
    """Service for user profile management."""

    def get_profile(self, user_id: UUID) -> UserProfileResponse | None:
        """Fetch user profile."""
        data = user_profile_repository.get_by_user_id(str(user_id))
        if not data:
            return None
        return UserProfileResponse(
            id=UUID(data["id"]) if data.get("id") else None,
            user_id=UUID(data["user_id"]),
            email=data.get("email"),
            name=data.get("name"),
            weight_kg=float(data.get("weight_kg", 70.0)),
            height_cm=float(data.get("height_cm", 175.0)),
            age=int(data.get("age", 25)),
            gender=str(data.get("gender", "male")),
            activity_level=str(data.get("activity_level", "ACTIVE")),
            body_composition_goal=str(data.get("body_composition_goal", "BULK")),
            nutritional_goal=str(data.get("nutritional_goal", "PERFORMANCE")),
            daily_calories_target=float(data.get("daily_calories_target", 2500.0)),
            daily_protein_g_target=float(data.get("daily_protein_g_target", 160.0)),
            daily_carbs_g_target=float(data.get("daily_carbs_g_target", 280.0)),
            daily_fat_g_target=float(data.get("daily_fat_g_target", 70.0)),
            updated_at=str(data.get("updated_at")) if data.get("updated_at") else None,
        )

    def update_profile(
        self, user_id: UUID, payload: UpdateProfileRequest
    ) -> UserProfileResponse:
        """Update fields of user profile."""
        updates = payload.model_dump(exclude_none=True)
        data = user_profile_repository.update_profile(str(user_id), updates)
        if not data:
            existing = self.ensure_profile_exists(EnsureProfileRequest(user_id=user_id))
            return existing

        return UserProfileResponse(
            id=UUID(data["id"]) if data.get("id") else None,
            user_id=UUID(data["user_id"]),
            weight_kg=float(data.get("weight_kg", 70.0)),
            height_cm=float(data.get("height_cm", 175.0)),
            age=int(data.get("age", 25)),
            gender=str(data.get("gender", "male")),
            activity_level=str(data.get("activity_level", "ACTIVE")),
            body_composition_goal=str(data.get("body_composition_goal", "BULK")),
            nutritional_goal=str(data.get("nutritional_goal", "PERFORMANCE")),
            daily_calories_target=float(data.get("daily_calories_target", 2500.0)),
            daily_protein_g_target=float(data.get("daily_protein_g_target", 160.0)),
            daily_carbs_g_target=float(data.get("daily_carbs_g_target", 280.0)),
            daily_fat_g_target=float(data.get("daily_fat_g_target", 70.0)),
            updated_at=str(data.get("updated_at")) if data.get("updated_at") else None,
        )

    def ensure_profile_exists(
        self, payload: EnsureProfileRequest
    ) -> UserProfileResponse:
        """Ensure profile row exists for user, creating defaults if missing."""
        existing = self.get_profile(payload.user_id)
        if existing:
            return existing

        default_data = {
            "user_id": str(payload.user_id),
            "weight_kg": 70.0,
            "height_cm": 175.0,
            "age": 25,
            "gender": "male",
            "activity_level": "ACTIVE",
            "body_composition_goal": "BULK",
            "nutritional_goal": "PERFORMANCE",
            "daily_calories_target": 2500.0,
            "daily_protein_g_target": 160.0,
            "daily_carbs_g_target": 280.0,
            "daily_fat_g_target": 70.0,
        }
        created = user_profile_repository.upsert_profile(default_data)
        return UserProfileResponse(
            id=UUID(created["id"]) if created.get("id") else None,
            user_id=UUID(created["user_id"]),
            weight_kg=float(created.get("weight_kg", 70.0)),
            height_cm=float(created.get("height_cm", 175.0)),
            age=int(created.get("age", 25)),
            gender=str(created.get("gender", "male")),
            activity_level=str(created.get("activity_level", "ACTIVE")),
            body_composition_goal=str(created.get("body_composition_goal", "BULK")),
            nutritional_goal=str(created.get("nutritional_goal", "PERFORMANCE")),
            daily_calories_target=float(created.get("daily_calories_target", 2500.0)),
            daily_protein_g_target=float(created.get("daily_protein_g_target", 160.0)),
            daily_carbs_g_target=float(created.get("daily_carbs_g_target", 280.0)),
            daily_fat_g_target=float(created.get("daily_fat_g_target", 70.0)),
            updated_at=str(created.get("updated_at"))
            if created.get("updated_at")
            else None,
        )


profile_service = ProfileService()
