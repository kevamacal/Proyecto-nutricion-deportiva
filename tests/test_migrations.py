"""Automated test suite verifying SQL migration schema integrity and RLS compliance.

Enforces rules defined in skills/rls_migration_skill/SKILL.md.
"""

import re
from pathlib import Path

MIGRATION_PATH = (
    Path(__file__).parent.parent
    / "supabase"
    / "migrations"
    / "00001_initial_schema.sql"
)

EXPECTED_TABLES = [
    "nutritional_profiles",
    "food_items",
    "nutritional_information",
    "inventory_items",
    "meals",
    "meal_items",
    "activities",
    "basketball_activities",
    "strength_training_activities",
]

EXPECTED_ENUMS = [
    "activity_sport",
    "activity_intensity",
    "basketball_session_category",
    "strength_training_type",
    "activity_level",
    "body_composition_goal",
    "nutritional_goal",
    "inventory_status",
    "meal_type",
]


def test_migration_file_exists():
    """Verify migration file exists."""
    assert MIGRATION_PATH.exists(), f"Migration file missing at {MIGRATION_PATH}"


def test_all_expected_tables_created():
    """Verify all 9 domain tables are defined in the migration script."""
    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    for table in EXPECTED_TABLES:
        pattern = rf"CREATE TABLE\s+(IF NOT EXISTS\s+)?{table}\b"
        assert re.search(pattern, sql, re.IGNORECASE), (
            f"Table '{table}' not found in migration script"
        )


def test_all_tables_have_rls_enabled():
    """Verify EVERY created table has ROW LEVEL SECURITY enabled per skill requirements."""
    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    for table in EXPECTED_TABLES:
        pattern = rf"ALTER TABLE\s+{table}\s+ENABLE ROW LEVEL SECURITY;"
        assert re.search(pattern, sql, re.IGNORECASE), (
            f"RLS not enabled for table '{table}' in migration script"
        )


def test_all_enums_declared():
    """Verify all 9 ENUM types are declared."""
    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    for enum_name in EXPECTED_ENUMS:
        assert enum_name in sql, f"ENUM '{enum_name}' not found in migration script"


def test_rls_policies_exist_for_user_tables():
    """Verify RLS policies exist for SELECT, INSERT, UPDATE, and DELETE operations."""
    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    for action in ["SELECT", "INSERT", "UPDATE", "DELETE"]:
        matches = re.findall(rf"FOR {action}\b", sql, re.IGNORECASE)
        assert len(matches) >= 9, (
            f"Expected at least 9 RLS policies for {action}, found {len(matches)}"
        )


def test_performance_indexes_exist():
    """Verify foreign key and compound B-tree performance indexes are created."""
    sql = MIGRATION_PATH.read_text(encoding="utf-8")
    expected_indexes = [
        "idx_inventory_user_id",
        "idx_inventory_food_item_id",
        "idx_meals_user_id",
        "idx_meal_items_meal_id",
        "idx_meal_items_food_item_id",
        "idx_activities_user_id",
        "idx_basketball_activity_id",
        "idx_strength_activity_id",
        "idx_meals_user_date",
        "idx_activities_user_date",
        "idx_inventory_user_status",
        "idx_inventory_expiry",
    ]
    for idx in expected_indexes:
        assert idx in sql, f"Performance index '{idx}' missing from migration script"
