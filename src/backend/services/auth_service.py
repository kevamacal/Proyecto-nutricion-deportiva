"""Service layer managing authentication and user session domain operations."""

from uuid import UUID

from src.backend.api.v1.schemas import AuthResponse, LoginRequest, RegisterRequest
from src.backend.db.repository import auth_repository, user_profile_repository


class AuthService:
    """Service handling user authentication and registration."""

    def login(self, payload: LoginRequest) -> AuthResponse:
        """Authenticate user and retrieve session info."""
        res = auth_repository.sign_in(payload.email, payload.password)
        user_dict = res.get("user") or {}
        session_dict = res.get("session") or {}
        access_token = session_dict.get("access_token")

        user_id = user_dict.get("id")
        user_meta = user_dict.get("user_metadata") or {}
        name = user_meta.get("name") or payload.email.split("@")[0]
        primary_sport = user_meta.get("primary_sport", "BASKETBALL")

        if user_id:
            profile = user_profile_repository.get_by_user_id(str(user_id))
            if not profile:
                user_profile_repository.upsert_profile(
                    {
                        "user_id": str(user_id),
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
                )

        return AuthResponse(
            user_id=UUID(user_id),
            email=user_dict.get("email", payload.email),
            name=name,
            primary_sport=primary_sport,
            access_token=access_token,
        )

    def register(self, payload: RegisterRequest) -> AuthResponse:
        """Register a new user and initialize profile."""
        res = auth_repository.sign_up(
            email=payload.email,
            password=payload.password,
            name=payload.name,
            primary_sport=payload.primary_sport,
        )
        user_dict = res.get("user") or {}
        session_dict = res.get("session") or {}
        access_token = session_dict.get("access_token")
        user_id = user_dict.get("id")

        if user_id:
            user_profile_repository.upsert_profile(
                {
                    "user_id": str(user_id),
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
            )

        return AuthResponse(
            user_id=UUID(user_id)
            if user_id
            else UUID("00000000-0000-0000-0000-000000000000"),
            email=payload.email,
            name=payload.name,
            primary_sport=payload.primary_sport,
            access_token=access_token,
        )


auth_service = AuthService()
