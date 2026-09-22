"""Automated test validating SQL migration syntax for meals table extension."""

from pathlib import Path


def test_meal_migration_sql_exists_and_valid():
    migration_path = Path(__file__).parent.parent / "supabase" / "migrations" / "00002_add_meal_name_column.sql"
    assert migration_path.exists(), "Migration 00002_add_meal_name_column.sql must exist"

    sql_content = migration_path.read_text(encoding="utf-8")
    assert "ALTER TABLE meals ADD COLUMN IF NOT EXISTS name VARCHAR(255);" in sql_content
