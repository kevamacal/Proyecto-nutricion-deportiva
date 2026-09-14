"""Automated test suite verifying global food catalog seed data integrity and idempotency.

Checks requirements for Issue #7.
"""

import re
from pathlib import Path

SEED_PATH = Path(__file__).parent.parent / "supabase" / "seed.sql"

EXPECTED_FOOD_ITEMS = [
    "Pechuga de pollo",
    "Arroz blanco cocido",
    "Huevo entero",
    "Plátano",
    "Aceite de oliva virgen extra",
    "Leche entera",
    "Avena en copos",
    "Salmón fresco",
    "Atún al natural",
    "Patata cocida",
    "Pan de molde para sándwich",
    "Jamón en lonchas (Chopped/Cocido)",
    "Queso en lonchas para sándwich",
]


def test_seed_file_exists():
    """Verify seed file exists."""
    assert SEED_PATH.exists(), f"Seed file missing at {SEED_PATH}"


def test_all_expected_food_items_seeded():
    """Verify all 13 expected global food items are included in seed script."""
    sql = SEED_PATH.read_text(encoding="utf-8")
    for item in EXPECTED_FOOD_ITEMS:
        assert item in sql, (
            f"Expected food item '{item}' missing from supabase/seed.sql"
        )


def test_idempotency_guards_present():
    """Verify idempotent IF NOT EXISTS checks exist for every food item."""
    sql = SEED_PATH.read_text(encoding="utf-8")
    for item in EXPECTED_FOOD_ITEMS:
        pattern = rf"IF NOT EXISTS\s*\(\s*SELECT 1 FROM food_items WHERE name = '{re.escape(item)}'"
        assert re.search(pattern, sql), (
            f"Idempotency check missing for food item '{item}'"
        )


def test_nutritional_information_entries_exist():
    """Verify INSERT INTO nutritional_information is executed for each item."""
    sql = SEED_PATH.read_text(encoding="utf-8")
    insert_count = len(
        re.findall(r"INSERT INTO nutritional_information", sql, re.IGNORECASE)
    )
    assert insert_count == len(EXPECTED_FOOD_ITEMS), (
        f"Expected {len(EXPECTED_FOOD_ITEMS)} nutritional info inserts, found {insert_count}"
    )
