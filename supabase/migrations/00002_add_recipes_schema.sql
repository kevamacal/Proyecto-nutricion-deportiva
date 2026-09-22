-- Migration: 00002_add_recipes_schema.sql
-- Description: Adds recipes & recipe_ingredients tables, extends meals table with name/image_url, and seeds preset recipes.

-- 1. EXTEND MEALS TABLE
ALTER TABLE meals ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. RECIPES TABLE
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    servings INTEGER NOT NULL DEFAULT 1 CHECK (servings > 0),
    prep_time_minutes INTEGER NOT NULL DEFAULT 15 CHECK (prep_time_minutes >= 0),
    total_calories_kcal NUMERIC(6,2) NOT NULL CHECK (total_calories_kcal >= 0),
    total_protein_g NUMERIC(5,2) NOT NULL CHECK (total_protein_g >= 0),
    total_carbs_g NUMERIC(5,2) NOT NULL CHECK (total_carbs_g >= 0),
    total_fat_g NUMERIC(5,2) NOT NULL CHECK (total_fat_g >= 0),
    image_url TEXT,
    is_preset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RECIPE INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    quantity NUMERIC(6,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'g',
    calories_kcal NUMERIC(6,2) NOT NULL CHECK (calories_kcal >= 0),
    protein_g NUMERIC(5,2) NOT NULL CHECK (protein_g >= 0),
    carbohydrates_g NUMERIC(5,2) NOT NULL CHECK (carbohydrates_g >= 0),
    fat_g NUMERIC(5,2) NOT NULL CHECK (fat_g >= 0)
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 4.1 recipes Policies
CREATE POLICY "Authenticated users can read global preset or own recipes"
    ON recipes FOR SELECT
    TO authenticated
    USING (is_preset = true OR user_id IS NULL OR (select auth.uid()) = user_id);

CREATE POLICY "Users can insert own recipes"
    ON recipes FOR INSERT
    TO authenticated
    WITH CHECK (is_preset = false AND (select auth.uid()) = user_id);

CREATE POLICY "Users can update own recipes"
    ON recipes FOR UPDATE
    TO authenticated
    USING (is_preset = false AND (select auth.uid()) = user_id)
    WITH CHECK (is_preset = false AND (select auth.uid()) = user_id);

CREATE POLICY "Users can delete own recipes"
    ON recipes FOR DELETE
    TO authenticated
    USING (is_preset = false AND (select auth.uid()) = user_id);

-- 4.2 recipe_ingredients Policies
CREATE POLICY "Authenticated users can read ingredients of accessible recipes"
    ON recipe_ingredients FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
        AND (r.is_preset = true OR r.user_id IS NULL OR r.user_id = (select auth.uid()))
    ));

CREATE POLICY "Users can insert ingredients for own recipes"
    ON recipe_ingredients FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
        AND r.is_preset = false AND r.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update ingredients for own recipes"
    ON recipe_ingredients FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
        AND r.is_preset = false AND r.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
        AND r.is_preset = false AND r.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can delete ingredients for own recipes"
    ON recipe_ingredients FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
        AND r.is_preset = false AND r.user_id = (select auth.uid())
    ));

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- 6. SEED PRESET ATHLETIC RECIPES
INSERT INTO recipes (id, user_id, name, description, category, servings, prep_time_minutes, total_calories_kcal, total_protein_g, total_carbs_g, total_fat_g, image_url, is_preset)
VALUES
  ('a1111111-1111-1111-1111-111111111111', NULL, 'Avena Proteica Post-Entreno', 'Copos de avena cocidos con proteína whey, plátano y semillas de chía para rápida recuperación muscular.', 'BREAKFAST', 1, 10, 450.0, 35.0, 55.0, 8.0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80', true),
  ('a2222222-2222-2222-2222-222222222222', NULL, 'Bowl de Pechuga, Arroz y Aguacate', 'Plato equilibrado de alto rendimiento deportivo con pechuga a la plancha, arroz blanco y aguacate fresco.', 'LUNCH', 1, 20, 650.0, 48.0, 70.0, 18.0, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', true),
  ('a3333333-3333-3333-3333-333333333333', NULL, 'Salmón a la Plancha con Quinoa', 'Rico en ácidos grasos Omega-3 y carbohidratos complejos de absorción lenta ideal para cena deportiva.', 'DINNER', 1, 25, 580.0, 42.0, 45.0, 22.0, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', true),
  ('a4444444-4444-4444-4444-444444444444', NULL, 'Yogur Griego con Frutos Secos y Miel', 'Snack proteico de fácil digestión entre sesiones de entrenamiento.', 'SNACK', 1, 5, 320.0, 22.0, 25.0, 14.0, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT (id) DO NOTHING;
