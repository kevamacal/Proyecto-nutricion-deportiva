-- Migration: 00001_initial_schema.sql
-- Description: Initial database schema migration for Sports Nutrition System MVP.
-- Defines PostgreSQL ENUM types, core domain tables, Row Level Security (RLS) policies, and performance indexes.

-- ==========================================
-- 1. ENUM TYPES
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_sport') THEN
        CREATE TYPE activity_sport AS ENUM ('BASKETBALL', 'STRENGTH_TRAINING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_intensity') THEN
        CREATE TYPE activity_intensity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'basketball_session_category') THEN
        CREATE TYPE basketball_session_category AS ENUM ('TRAINING', 'MATCH');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'strength_training_type') THEN
        CREATE TYPE strength_training_type AS ENUM ('HYPERTROPHY', 'STRENGTH', 'POWER', 'HYBRID', 'ENDURANCE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_level') THEN
        CREATE TYPE activity_level AS ENUM ('SEDENTARY', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'body_composition_goal') THEN
        CREATE TYPE body_composition_goal AS ENUM ('MAINTAIN', 'BULK', 'CUT', 'RECOMP');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nutritional_goal') THEN
        CREATE TYPE nutritional_goal AS ENUM ('PERFORMANCE', 'HYPERTROPHY', 'HEALTH', 'FAT_LOSS_FOCUS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_status') THEN
        CREATE TYPE inventory_status AS ENUM ('AVAILABLE', 'LOW_STOCK', 'EXPIRED', 'CONSUMED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
        CREATE TYPE meal_type AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'POST_WORKOUT');
    END IF;
END $$;

-- ==========================================
-- 2. DOMAIN TABLES
-- ==========================================

-- 2.1 Nutritional Profiles
CREATE TABLE IF NOT EXISTS nutritional_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 0),
    age INTEGER NOT NULL CHECK (age > 0),
    activity_level activity_level NOT NULL,
    body_composition_goal body_composition_goal NOT NULL,
    nutritional_goal nutritional_goal NOT NULL,
    daily_calories_target NUMERIC(6,2) NOT NULL CHECK (daily_calories_target >= 0),
    daily_protein_g_target NUMERIC(5,2) NOT NULL CHECK (daily_protein_g_target >= 0),
    daily_carbs_g_target NUMERIC(5,2) NOT NULL CHECK (daily_carbs_g_target >= 0),
    daily_fat_g_target NUMERIC(5,2) NOT NULL CHECK (daily_fat_g_target >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Food Items Catalog
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    default_unit VARCHAR(50) NOT NULL DEFAULT 'g',
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Nutritional Information
CREATE TABLE IF NOT EXISTS nutritional_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID NOT NULL UNIQUE REFERENCES food_items(id) ON DELETE CASCADE,
    serving_size NUMERIC(6,2) NOT NULL CHECK (serving_size > 0),
    serving_unit VARCHAR(50) NOT NULL DEFAULT 'g',
    calories_kcal NUMERIC(6,2) NOT NULL CHECK (calories_kcal >= 0),
    protein_g NUMERIC(5,2) NOT NULL CHECK (protein_g >= 0),
    carbohydrates_g NUMERIC(5,2) NOT NULL CHECK (carbohydrates_g >= 0),
    fat_g NUMERIC(5,2) NOT NULL CHECK (fat_g >= 0),
    fiber_g NUMERIC(5,2) CHECK (fiber_g IS NULL OR fiber_g >= 0),
    sugars_g NUMERIC(5,2) CHECK (sugars_g IS NULL OR sugars_g >= 0),
    sodium_mg NUMERIC(6,2) CHECK (sodium_mg IS NULL OR sodium_mg >= 0)
);

-- 2.4 Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(7,2) NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL,
    date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiration_date DATE,
    status inventory_status NOT NULL DEFAULT 'AVAILABLE'
);

-- 2.5 Meals Log
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_type meal_type NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_calories_kcal NUMERIC(6,2) NOT NULL CHECK (total_calories_kcal >= 0),
    total_protein_g NUMERIC(5,2) NOT NULL CHECK (total_protein_g >= 0),
    total_carbs_g NUMERIC(5,2) NOT NULL CHECK (total_carbs_g >= 0),
    total_fat_g NUMERIC(5,2) NOT NULL CHECK (total_fat_g >= 0),
    notes TEXT
);

-- 2.6 Meal Items
CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(6,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    calories_kcal NUMERIC(6,2) NOT NULL CHECK (calories_kcal >= 0),
    protein_g NUMERIC(5,2) NOT NULL CHECK (protein_g >= 0),
    carbohydrates_g NUMERIC(5,2) NOT NULL CHECK (carbohydrates_g >= 0),
    fat_g NUMERIC(5,2) NOT NULL CHECK (fat_g >= 0)
);

-- 2.7 Activities Core
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sport activity_sport NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    intensity activity_intensity NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    estimated_expenditure_kcal NUMERIC(6,2) NOT NULL CHECK (estimated_expenditure_kcal >= 0)
);

-- 2.8 Basketball Activities Specialization
CREATE TABLE IF NOT EXISTS basketball_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    session_category basketball_session_category NOT NULL,
    carb_demand_g NUMERIC(5,2) NOT NULL CHECK (carb_demand_g >= 0),
    hydration_demand_ml NUMERIC(6,2) NOT NULL CHECK (hydration_demand_ml >= 0),
    recovery_priority VARCHAR(100) NOT NULL
);

-- 2.9 Strength Training Activities Specialization
CREATE TABLE IF NOT EXISTS strength_training_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    training_type strength_training_type NOT NULL,
    protein_demand_g NUMERIC(5,2) NOT NULL CHECK (protein_demand_g >= 0),
    targeted_muscle_groups TEXT[],
    total_volume_kg NUMERIC(8,2) CHECK (total_volume_kg IS NULL OR total_volume_kg >= 0),
    total_sets INTEGER CHECK (total_sets IS NULL OR total_sets >= 0),
    total_reps INTEGER CHECK (total_reps IS NULL OR total_reps >= 0)
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all 9 tables
ALTER TABLE nutritional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritional_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE basketball_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_training_activities ENABLE ROW LEVEL SECURITY;

-- 3.1 nutritional_profiles Policies
CREATE POLICY "Users can read own nutritional profile"
    ON nutritional_profiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own nutritional profile"
    ON nutritional_profiles FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own nutritional profile"
    ON nutritional_profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own nutritional profile"
    ON nutritional_profiles FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3.2 food_items Policies
CREATE POLICY "Authenticated users can read global or own custom foods"
    ON food_items FOR SELECT
    TO authenticated
    USING (is_custom = false OR created_by_user_id IS NULL OR created_by_user_id = (select auth.uid()));

CREATE POLICY "Users can insert custom food items"
    ON food_items FOR INSERT
    TO authenticated
    WITH CHECK (is_custom = true AND created_by_user_id = (select auth.uid()));

CREATE POLICY "Users can update own custom food items"
    ON food_items FOR UPDATE
    TO authenticated
    USING (is_custom = true AND created_by_user_id = (select auth.uid()))
    WITH CHECK (is_custom = true AND created_by_user_id = (select auth.uid()));

CREATE POLICY "Users can delete own custom food items"
    ON food_items FOR DELETE
    TO authenticated
    USING (is_custom = true AND created_by_user_id = (select auth.uid()));

-- 3.3 nutritional_information Policies
CREATE POLICY "Authenticated users can read nutritional info for accessible foods"
    ON nutritional_information FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM food_items f
        WHERE f.id = nutritional_information.food_item_id
        AND (f.is_custom = false OR f.created_by_user_id IS NULL OR f.created_by_user_id = (select auth.uid()))
    ));

CREATE POLICY "Users can insert nutritional info for own custom foods"
    ON nutritional_information FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM food_items f
        WHERE f.id = nutritional_information.food_item_id
        AND f.is_custom = true AND f.created_by_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update nutritional info for own custom foods"
    ON nutritional_information FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM food_items f
        WHERE f.id = nutritional_information.food_item_id
        AND f.is_custom = true AND f.created_by_user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM food_items f
        WHERE f.id = nutritional_information.food_item_id
        AND f.is_custom = true AND f.created_by_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can delete nutritional info for own custom foods"
    ON nutritional_information FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM food_items f
        WHERE f.id = nutritional_information.food_item_id
        AND f.is_custom = true AND f.created_by_user_id = (select auth.uid())
    ));

-- 3.4 inventory_items Policies
CREATE POLICY "Users can read own inventory items"
    ON inventory_items FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own inventory items"
    ON inventory_items FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own inventory items"
    ON inventory_items FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own inventory items"
    ON inventory_items FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3.5 meals Policies
CREATE POLICY "Users can read own meals"
    ON meals FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own meals"
    ON meals FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own meals"
    ON meals FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own meals"
    ON meals FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3.6 meal_items Policies
CREATE POLICY "Users can read own meal items"
    ON meal_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_items.meal_id
        AND m.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own meal items"
    ON meal_items FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_items.meal_id
        AND m.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update own meal items"
    ON meal_items FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_items.meal_id
        AND m.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_items.meal_id
        AND m.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can delete own meal items"
    ON meal_items FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals m
        WHERE m.id = meal_items.meal_id
        AND m.user_id = (select auth.uid())
    ));

-- 3.7 activities Policies
CREATE POLICY "Users can read own activities"
    ON activities FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own activities"
    ON activities FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own activities"
    ON activities FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3.8 basketball_activities Policies
CREATE POLICY "Users can read own basketball activities"
    ON basketball_activities FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = basketball_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own basketball activities"
    ON basketball_activities FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = basketball_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update own basketball activities"
    ON basketball_activities FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = basketball_activities.activity_id
        AND a.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = basketball_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can delete own basketball activities"
    ON basketball_activities FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = basketball_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

-- 3.9 strength_training_activities Policies
CREATE POLICY "Users can read own strength training activities"
    ON strength_training_activities FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = strength_training_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can insert own strength training activities"
    ON strength_training_activities FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = strength_training_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can update own strength training activities"
    ON strength_training_activities FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = strength_training_activities.activity_id
        AND a.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = strength_training_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

CREATE POLICY "Users can delete own strength training activities"
    ON strength_training_activities FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = strength_training_activities.activity_id
        AND a.user_id = (select auth.uid())
    ));

-- ==========================================
-- 4. B-TREE INDEXES FOR PERFORMANCE
-- ==========================================

-- Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_food_item_id ON inventory_items(food_item_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_food_item_id ON meal_items(food_item_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_basketball_activity_id ON basketball_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_strength_activity_id ON strength_training_activities(activity_id);

-- Compound Query Indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user_status ON inventory_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(user_id, expiration_date ASC) WHERE status = 'AVAILABLE';
