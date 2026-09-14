-- Seed: supabase/seed.sql
-- Description: Idempotent seed data populating the global food dictionary catalog
-- and corresponding nutritional information per reference serving size.

DO $$
DECLARE
    v_food_id UUID;
BEGIN
    -- Helper Procedure / Inline logic for Pechuga de Pollo
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Pechuga de pollo' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Pechuga de pollo', 'Meat', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 165.00, 31.00, 0.00, 3.60, 0.00, 0.00, 74.00);
    END IF;

    -- Arroz blanco cocido
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Arroz blanco cocido' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Arroz blanco cocido', 'Grains', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 130.00, 2.70, 28.20, 0.30, 0.40, 0.05, 1.00);
    END IF;

    -- Huevo entero
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Huevo entero' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Huevo entero', 'Dairy & Eggs', 'unit', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 1.00, 'unit', 72.00, 6.30, 0.40, 4.80, 0.00, 0.20, 71.00);
    END IF;

    -- Plátano
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Plátano' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Plátano', 'Fruits', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 89.00, 1.10, 22.80, 0.30, 2.60, 12.20, 1.00);
    END IF;

    -- Aceite de oliva virgen extra
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Aceite de oliva virgen extra' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Aceite de oliva virgen extra', 'Oils & Fats', 'ml', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'ml', 884.00, 0.00, 0.00, 100.00, 0.00, 0.00, 2.00);
    END IF;

    -- Leche entera
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Leche entera' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Leche entera', 'Dairy & Eggs', 'ml', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'ml', 61.00, 3.20, 4.80, 3.30, 0.00, 5.10, 43.00);
    END IF;

    -- Avena en copos
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Avena en copos' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Avena en copos', 'Grains', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 389.00, 16.90, 66.30, 6.90, 10.60, 0.99, 2.00);
    END IF;

    -- Salmón fresco
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Salmón fresco' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Salmón fresco', 'Fish & Seafood', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 208.00, 20.40, 0.00, 13.40, 0.00, 0.00, 59.00);
    END IF;

    -- Atún al natural
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Atún al natural' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Atún al natural', 'Fish & Seafood', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 116.00, 26.00, 0.00, 1.00, 0.00, 0.00, 338.00);
    END IF;

    -- Patata cocida
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Patata cocida' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Patata cocida', 'Tubers', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 87.00, 1.90, 20.10, 0.10, 1.80, 0.90, 6.00);
    END IF;

    -- Pan de molde para sándwich (User Requested)
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Pan de molde para sándwich' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Pan de molde para sándwich', 'Grains', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 265.00, 8.50, 49.00, 3.20, 3.00, 4.50, 490.00);
    END IF;

    -- Jamón / Chopped en lonchas para sándwich (User Requested)
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Jamón en lonchas (Chopped/Cocido)' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Jamón en lonchas (Chopped/Cocido)', 'Processed Meats', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 110.00, 17.00, 1.50, 4.00, 0.00, 1.00, 850.00);
    END IF;

    -- Queso en lonchas para sándwich (User Requested)
    IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Queso en lonchas para sándwich' AND is_custom = false) THEN
        INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
        VALUES (gen_random_uuid(), 'Queso en lonchas para sándwich', 'Dairy & Eggs', 'g', false, NULL)
        RETURNING id INTO v_food_id;

        INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
        VALUES (gen_random_uuid(), v_food_id, 100.00, 'g', 330.00, 22.00, 2.00, 26.00, 0.00, 1.50, 700.00);
    END IF;

END $$;
