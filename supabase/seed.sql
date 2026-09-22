-- Seed: supabase/seed.sql
-- Description: Idempotent seed data populating the global food dictionary catalog
-- and corresponding nutritional information per reference serving size.

WITH food_catalog (name, category, default_unit, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg) AS (
    VALUES
        ('Pechuga de pollo', 'Carnes', 'g', 100.00, 'g', 165.00, 31.00, 0.00, 3.60, 0.00, 0.00, 74.00),
        ('Arroz blanco cocido', 'Cereales y Derivados', 'g', 100.00, 'g', 130.00, 2.70, 28.20, 0.30, 0.40, 0.05, 1.00),
        ('Huevo entero', 'Lácteos y Huevos', 'unit', 1.00, 'unit', 72.00, 6.30, 0.40, 4.80, 0.00, 0.20, 71.00),
        ('Plátano', 'Frutas', 'g', 100.00, 'g', 89.00, 1.10, 22.80, 0.30, 2.60, 12.20, 1.00),
        ('Aceite de oliva virgen extra', 'Aceites y Grasas', 'ml', 100.00, 'ml', 884.00, 0.00, 0.00, 100.00, 0.00, 0.00, 2.00),
        ('Leche entera', 'Lácteos y Huevos', 'ml', 100.00, 'ml', 61.00, 3.20, 4.80, 3.30, 0.00, 5.10, 43.00),
        ('Avena en copos', 'Cereales y Derivados', 'g', 100.00, 'g', 389.00, 16.90, 66.30, 6.90, 10.60, 0.99, 2.00),
        ('Salmón fresco', 'Pescados y Mariscos', 'g', 100.00, 'g', 208.00, 20.40, 0.00, 13.40, 0.00, 0.00, 59.00),
        ('Atún al natural', 'Pescados y Mariscos', 'g', 100.00, 'g', 116.00, 26.00, 0.00, 1.00, 0.00, 0.00, 338.00),
        ('Patata cocida', 'Tubérculos', 'g', 100.00, 'g', 87.00, 1.90, 20.10, 0.10, 1.80, 0.90, 6.00),
        ('Pan de molde para sándwich', 'Cereales y Derivados', 'g', 100.00, 'g', 265.00, 8.50, 49.00, 3.20, 3.00, 4.50, 490.00),
        ('Jamón en lonchas (Chopped/Cocido)', 'Carnes Procesadas', 'g', 100.00, 'g', 110.00, 17.00, 1.50, 4.00, 0.00, 1.00, 850.00),
        ('Queso en lonchas para sándwich', 'Lácteos y Huevos', 'g', 100.00, 'g', 330.00, 22.00, 2.00, 26.00, 0.00, 1.50, 700.00)
),
inserted_foods AS (
    INSERT INTO food_items (id, name, category, default_unit, is_custom, created_by_user_id)
    SELECT gen_random_uuid(), fc.name, fc.category, fc.default_unit, false, NULL
    FROM food_catalog fc
    WHERE NOT EXISTS (
        SELECT 1 FROM food_items fi WHERE fi.name = fc.name AND fi.is_custom = false
    )
    RETURNING id, name
)
INSERT INTO nutritional_information (id, food_item_id, serving_size, serving_unit, calories_kcal, protein_g, carbohydrates_g, fat_g, fiber_g, sugars_g, sodium_mg)
SELECT
    gen_random_uuid(),
    inf.id,
    fc.serving_size,
    fc.serving_unit,
    fc.calories_kcal,
    fc.protein_g,
    fc.carbohydrates_g,
    fc.fat_g,
    fc.fiber_g,
    fc.sugars_g,
    fc.sodium_mg
FROM inserted_foods inf
JOIN food_catalog fc ON fc.name = inf.name;
