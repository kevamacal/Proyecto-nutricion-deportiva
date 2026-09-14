"""Automated test suite verifying global food catalog seed data integrity and idempotency.

Checks requirements for Issue #7.
"""

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


def test_idempotency_cte_guard_present():
    """Verify CTE idempotency check WHERE NOT EXISTS is present."""
    sql = SEED_PATH.read_text(encoding="utf-8")
    assert "WHERE NOT EXISTS" in sql, "Idempotency check WHERE NOT EXISTS missing"
    assert "SELECT 1 FROM food_items fi WHERE fi.name = fc.name" in sql, (
        "Item name matching check missing from CTE"
    )


def test_declarative_cte_structure():
    """Verify script uses a clean declarative CTE structure without PL/pgSQL duplication."""
    sql = SEED_PATH.read_text(encoding="utf-8")
    assert "WITH food_catalog" in sql, "Declarative CTE food_catalog missing"
    assert "INSERT INTO food_items" in sql, "Food items insertion statement missing"
    assert "INSERT INTO nutritional_information" in sql, (
        "Nutritional information insertion statement missing"
    )
