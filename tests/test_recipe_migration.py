"""Automated test validating SQL migration syntax and RLS policies for recipes."""

from pathlib import Path


def test_recipe_migration_sql_exists_and_valid():
    migration_path = Path(__file__).parent.parent / "supabase" / "migrations" / "00002_add_recipes_schema.sql"
    assert migration_path.exists(), "Migration 00002_add_recipes_schema.sql must exist"

    sql_content = migration_path.read_text(encoding="utf-8")

    # Assert mandatory RLS enablement
    assert "ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;" in sql_content
    assert "ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;" in sql_content

    # Assert explicit policies exist for recipes
    assert 'ON recipes FOR SELECT' in sql_content
    assert 'ON recipes FOR INSERT' in sql_content
    assert 'ON recipes FOR UPDATE' in sql_content
    assert 'ON recipes FOR DELETE' in sql_content

    # Assert explicit policies exist for recipe_ingredients
    assert 'ON recipe_ingredients FOR SELECT' in sql_content
    assert 'ON recipe_ingredients FOR INSERT' in sql_content
    assert 'ON recipe_ingredients FOR UPDATE' in sql_content
    assert 'ON recipe_ingredients FOR DELETE' in sql_content

    # Assert preset seeds exist
    assert 'Avena Proteica Post-Entreno' in sql_content
    assert 'Bowl de Pechuga, Arroz y Aguacate' in sql_content
