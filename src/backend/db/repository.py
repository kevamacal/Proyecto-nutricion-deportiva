"""Data Access Layer (Repository Pattern) for Supabase Database operations.

ALL Supabase database and authentication calls MUST reside exclusively in this module or backend/db.
"""

from datetime import UTC, datetime
from typing import Any, cast

from src.backend.db.client import get_supabase_client


class AuthRepository:
    """Repository handling Supabase Authentication operations."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        """Sign in user with email and password."""
        res = self.client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
        user_obj = res.user
        user_data = (
            user_obj.model_dump()
            if user_obj and hasattr(user_obj, "model_dump")
            else (user_obj.dict() if user_obj and hasattr(user_obj, "dict") else {})
        )
        session_data = (
            res.session.model_dump()
            if res.session and hasattr(res.session, "model_dump")
            else {}
        )
        return {"user": user_data, "session": session_data}

    def sign_up(
        self, email: str, password: str, name: str, primary_sport: str = "BASKETBALL"
    ) -> dict[str, Any]:
        """Register a new user in Supabase Auth with metadata."""
        res = self.client.auth.sign_up(
            {
                "email": email,
                "password": password,
                "options": {"data": {"name": name, "primary_sport": primary_sport}},
            }
        )
        user_obj = res.user
        user_data = (
            user_obj.model_dump()
            if user_obj and hasattr(user_obj, "model_dump")
            else (user_obj.dict() if user_obj and hasattr(user_obj, "dict") else {})
        )
        session_data = (
            res.session.model_dump()
            if res.session and hasattr(res.session, "model_dump")
            else {}
        )
        return {"user": user_data, "session": session_data}

    def get_user_from_token(self, jwt_token: str) -> dict[str, Any] | None:
        """Get user metadata from JWT access token."""
        res = self.client.auth.get_user(jwt_token)
        if res and res.user:
            return cast(
                dict[str, Any],
                res.user.model_dump()
                if hasattr(res.user, "model_dump")
                else res.user.dict(),
            )
        return None


class UserProfileRepository:
    """Repository managing nutritional_profiles table access."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def get_by_user_id(self, user_id: str) -> dict[str, Any] | None:
        """Fetch user profile record by user_id."""
        res = (
            self.client.table("nutritional_profiles")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if res and res.data and isinstance(res.data, dict):
            return cast(dict[str, Any], res.data)
        return None

    def upsert_profile(self, profile_data: dict[str, Any]) -> dict[str, Any]:
        """Upsert user profile record."""
        payload = {**profile_data, "updated_at": datetime.now(UTC).isoformat()}
        res = (
            self.client.table("nutritional_profiles")
            .upsert(payload, on_conflict="user_id")
            .execute()
        )
        if res and res.data and isinstance(res.data, list) and len(res.data) > 0:
            return cast(dict[str, Any], res.data[0])
        return payload

    def update_profile(
        self, user_id: str, updates: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update specific fields of user profile."""
        payload = {**updates, "updated_at": datetime.now(UTC).isoformat()}
        res = (
            self.client.table("nutritional_profiles")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
        if res and res.data and isinstance(res.data, list) and len(res.data) > 0:
            return cast(dict[str, Any], res.data[0])
        return self.get_by_user_id(user_id)


class FoodCatalogRepository:
    """Repository managing food_items and nutritional_information tables."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def list_food_catalog(self) -> list[dict[str, Any]]:
        """Fetch global food catalog joined with nutritional information."""
        res = (
            self.client.table("food_items")
            .select("*, nutritional_information(*)")
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def create_custom_food(
        self, food_payload: dict[str, Any], nutrition_payload: dict[str, Any]
    ) -> dict[str, Any]:
        """Insert new custom food item and its nutritional information."""
        food_res = self.client.table("food_items").insert(food_payload).execute()
        if (
            not food_res
            or not food_res.data
            or not isinstance(food_res.data, list)
            or len(food_res.data) == 0
        ):
            raise RuntimeError("Failed to create food item in database")
        created_food = cast(dict[str, Any], food_res.data[0])

        nutrition_payload_full = {
            **nutrition_payload,
            "food_item_id": created_food["id"],
        }
        nutr_res = (
            self.client.table("nutritional_information")
            .insert(nutrition_payload_full)
            .execute()
        )
        created_nutr = (
            cast(dict[str, Any], nutr_res.data[0])
            if nutr_res
            and nutr_res.data
            and isinstance(nutr_res.data, list)
            and len(nutr_res.data) > 0
            else nutrition_payload_full
        )

        return {"food_item": created_food, "nutritional_information": created_nutr}


class PantryRepository:
    """Repository managing inventory_items table access."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def list_inventory(self, user_id: str) -> list[dict[str, Any]]:
        """Fetch active inventory stock for a user."""
        res = (
            self.client.table("inventory_items")
            .select("*, food_items(*, nutritional_information(*))")
            .eq("user_id", user_id)
            .eq("status", "AVAILABLE")
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def find_available_item(
        self, user_id: str, food_item_id: str, unit: str
    ) -> dict[str, Any] | None:
        """Find an existing available pantry item matching food_item_id and unit."""
        res = (
            self.client.table("inventory_items")
            .select("*")
            .eq("user_id", user_id)
            .eq("food_item_id", food_item_id)
            .eq("unit", unit)
            .eq("status", "AVAILABLE")
            .maybe_single()
            .execute()
        )
        if res and res.data and isinstance(res.data, dict):
            return cast(dict[str, Any], res.data)
        return None

    def insert_item(self, item_data: dict[str, Any]) -> dict[str, Any]:
        """Insert a single pantry item."""
        res = self.client.table("inventory_items").insert(item_data).execute()
        if res and res.data and isinstance(res.data, list) and len(res.data) > 0:
            return cast(dict[str, Any], res.data[0])
        return item_data

    def update_quantity(
        self, item_id: str, new_quantity: float, status: str = "AVAILABLE"
    ) -> dict[str, Any] | None:
        """Update quantity and status of an existing pantry item."""
        res = (
            self.client.table("inventory_items")
            .update({"quantity": new_quantity, "status": status})
            .eq("id", item_id)
            .execute()
        )
        if res and res.data and isinstance(res.data, list) and len(res.data) > 0:
            return cast(dict[str, Any], res.data[0])
        return None

    def delete_item(self, item_id: str) -> None:
        """Delete item from pantry inventory."""
        self.client.table("inventory_items").delete().eq("id", item_id).execute()


class MealRepository:
    """Repository managing meals and meal_items tables access."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def get_meals_by_date_range(
        self, user_id: str, start_iso: str, end_iso: str
    ) -> list[dict[str, Any]]:
        """Fetch meals logged by user within timestamp range."""
        res = (
            self.client.table("meals")
            .select("*, meal_items(*, food_items(name, category))")
            .eq("user_id", user_id)
            .gte("logged_at", start_iso)
            .lte("logged_at", end_iso)
            .order("logged_at", desc=False)
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def get_recent_meals(self, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
        """Fetch recent meals logged by user."""
        res = (
            self.client.table("meals")
            .select("*, meal_items(*, food_items(name, category))")
            .eq("user_id", user_id)
            .order("logged_at", desc=True)
            .limit(limit)
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def create_meal(
        self, meal_data: dict[str, Any], items_data: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Insert meal entry and associated meal_items."""
        res = self.client.table("meals").insert(meal_data).execute()
        if (
            not res
            or not res.data
            or not isinstance(res.data, list)
            or len(res.data) == 0
        ):
            raise RuntimeError("Failed to insert meal")
        meal = cast(dict[str, Any], res.data[0])

        created_items: list[dict[str, Any]] = []
        if items_data:
            meal_items_payload = [
                {**item, "meal_id": meal["id"]}
                for item in items_data
                if item.get("food_item_id")
            ]
            if meal_items_payload:
                items_res = (
                    self.client.table("meal_items").insert(meal_items_payload).execute()
                )
                if items_res and items_res.data and isinstance(items_res.data, list):
                    created_items = cast(list[dict[str, Any]], items_res.data)

        meal["meal_items"] = created_items
        return meal


class ActivityRepository:
    """Repository managing activities, basketball_activities, and strength_training_activities tables access."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def get_activities_by_date_range(
        self, user_id: str, start_iso: str, end_iso: str
    ) -> list[dict[str, Any]]:
        """Fetch activities logged by user within timestamp range."""
        res = (
            self.client.table("activities")
            .select("*, basketball_activities(*), strength_training_activities(*)")
            .eq("user_id", user_id)
            .gte("date", start_iso)
            .lte("date", end_iso)
            .order("date", desc=False)
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def create_activity(
        self,
        activity_data: dict[str, Any],
        bball_data: dict[str, Any] | None = None,
        strength_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create new activity record with optional sports specialization rows."""
        act_res = self.client.table("activities").insert(activity_data).execute()
        if (
            not act_res
            or not act_res.data
            or not isinstance(act_res.data, list)
            or len(act_res.data) == 0
        ):
            raise RuntimeError("Failed to insert activity")
        activity = cast(dict[str, Any], act_res.data[0])
        act_id = activity["id"]

        if bball_data:
            bball_payload = {**bball_data, "activity_id": act_id}
            self.client.table("basketball_activities").insert(bball_payload).execute()
        elif strength_data:
            strength_payload = {**strength_data, "activity_id": act_id}
            self.client.table("strength_training_activities").insert(
                strength_payload
            ).execute()

        return activity

    def update_activity(
        self,
        activity_id: str,
        activity_data: dict[str, Any],
        bball_data: dict[str, Any] | None = None,
        strength_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Update existing activity record and specialization rows."""
        act_res = (
            self.client.table("activities")
            .update(activity_data)
            .eq("id", activity_id)
            .execute()
        )
        updated_act = (
            cast(dict[str, Any], act_res.data[0])
            if act_res
            and act_res.data
            and isinstance(act_res.data, list)
            and len(act_res.data) > 0
            else activity_data
        )

        if bball_data:
            self.client.table("basketball_activities").update(bball_data).eq(
                "activity_id", activity_id
            ).execute()
        elif strength_data:
            self.client.table("strength_training_activities").update(strength_data).eq(
                "activity_id", activity_id
            ).execute()

        return updated_act

    def delete_activity(self, activity_id: str) -> None:
        """Delete activity session (cascades to specialization tables)."""
        self.client.table("activities").delete().eq("id", activity_id).execute()


class HydrationRepository:
    """Repository managing hydration_logs table access."""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    def get_hydration_logs_by_date_range(
        self, user_id: str, start_iso: str, end_iso: str
    ) -> list[dict[str, Any]]:
        """Fetch hydration logs logged by user within timestamp range."""
        res = (
            self.client.table("hydration_logs")
            .select("*")
            .eq("user_id", user_id)
            .gte("logged_at", start_iso)
            .lte("logged_at", end_iso)
            .order("logged_at", desc=True)
            .execute()
        )
        if res and res.data and isinstance(res.data, list):
            return cast(list[dict[str, Any]], res.data)
        return []

    def create_hydration_log(self, user_id: str, amount_ml: int) -> dict[str, Any]:
        """Insert a new hydration intake log."""
        payload: dict[str, Any] = {"user_id": user_id, "amount_ml": amount_ml}
        res = self.client.table("hydration_logs").insert(cast(Any, payload)).execute()
        if res and res.data and isinstance(res.data, list) and len(res.data) > 0:
            return cast(dict[str, Any], res.data[0])
        return payload

    def delete_hydration_log(self, log_id: str) -> None:
        """Delete hydration log entry."""
        self.client.table("hydration_logs").delete().eq("id", log_id).execute()


# Singleton instances
auth_repository = AuthRepository()
user_profile_repository = UserProfileRepository()
food_catalog_repository = FoodCatalogRepository()
pantry_repository = PantryRepository()
meal_repository = MealRepository()
activity_repository = ActivityRepository()
hydration_repository = HydrationRepository()
