"""LangGraph Generative Recipe Node implementation (recipe_node).

Conforms strictly to Section 6 of docs/architecture/03_node_contracts.md.
"""

from src.backend.core.recipe.schemas import (
    EstimatedNutritionalSummaryOutput,
    IngredientUsedOutput,
    PreparationStepOutput,
    RecipeNodeInput,
    RecipeNodeOutput,
)


def execute_recipe_node(payload: RecipeNodeInput) -> RecipeNodeOutput:
    """Execute recipe_node transforming structured inputs into a culinary proposal."""
    needs = payload.remaining_needs
    ingredients = payload.available_ingredients
    constraints = payload.user_constraints
    recovery = payload.sports_recovery_context

    max_prep = constraints.max_preparation_time_minutes if constraints else 30
    meal_type = (
        constraints.meal_type if constraints and constraints.meal_type else "Meal"
    )

    # Case 1: Inventory available
    if ingredients:
        ingredients_used: list[IngredientUsedOutput] = []
        tot_cal, tot_prot, tot_carb, tot_fat = 0.0, 0.0, 0.0, 0.0

        for ing in ingredients[:3]:
            # Estimate portion used up to available stock
            portion = min(ing.available_quantity, 150.0)
            ingredients_used.append(
                IngredientUsedOutput(
                    food_item_id=ing.food_item_id,
                    name=ing.name,
                    quantity_used=portion,
                    unit=ing.unit,
                    is_from_inventory=True,
                )
            )
            # Standard nutritional contribution estimate
            if "PROTEIN" in ing.density_class or "PROTEÍNA" in ing.density_class or "PROTEINA" in ing.density_class:
                tot_prot += (portion / 100.0) * 25.0
                tot_cal += (portion / 100.0) * 150.0
            elif "CARB" in ing.density_class or "CARBOHIDRATO" in ing.density_class:
                tot_carb += (portion / 100.0) * 25.0
                tot_cal += (portion / 100.0) * 130.0
            else:
                tot_prot += (portion / 100.0) * 10.0
                tot_carb += (portion / 100.0) * 15.0
                tot_cal += (portion / 100.0) * 120.0

        ing_names = " and ".join(i.name for i in ingredients_used)
        recipe_name = f"Custom {meal_type.title()} Bowl with {ing_names}"
        explanation = (
            f"Recipe prepared using available pantry stock: {ing_names}. "
            f"Designed for remaining needs ({needs.remaining_protein_g}g P / {needs.remaining_carbs_g}g C)."
        )

    # Case 2: Empty inventory fallback
    else:
        ingredients_used = [
            IngredientUsedOutput(
                food_item_id=None,
                name="Chicken Breast",
                quantity_used=150.0,
                unit="g",
                is_from_inventory=False,
            ),
            IngredientUsedOutput(
                food_item_id=None,
                name="White Rice",
                quantity_used=150.0,
                unit="g",
                is_from_inventory=False,
            ),
        ]
        tot_cal, tot_prot, tot_carb, tot_fat = 420.0, 42.0, 45.0, 4.0
        recipe_name = f"Quick Post-Workout {meal_type.title()} Bowl"
        explanation = (
            "Warning: Pantry empty. Recommendation based on standard store ingredients "
            f"to meet target ({needs.remaining_protein_g}g protein)."
        )

    if recovery and recovery.sport:
        explanation += f" Optimized for {recovery.sport} recovery."

    prep_t = min(10, max_prep // 2)
    cook_t = min(15, max_prep // 2)

    return RecipeNodeOutput(
        recipe_name=recipe_name,
        prep_time_minutes=prep_t,
        cook_time_minutes=cook_t,
        total_time_minutes=prep_t + cook_t,
        servings=1,
        ingredients_used=ingredients_used,
        preparation_steps=[
            PreparationStepOutput(
                step_number=1,
                instruction="Prepare ingredients and cook grains or carbohydrates as specified.",
            ),
            PreparationStepOutput(
                step_number=2,
                instruction="Pan-fry or sear protein source until fully cooked.",
            ),
            PreparationStepOutput(
                step_number=3,
                instruction="Combine all prepared ingredients in a bowl and serve warm.",
            ),
        ],
        estimated_nutritional_summary=EstimatedNutritionalSummaryOutput(
            calories_kcal=round(tot_cal, 2),
            protein_g=round(tot_prot, 2),
            carbohydrates_g=round(tot_carb, 2),
            fat_g=round(tot_fat, 2),
        ),
        nutritional_fit_score=90.0,
        explanation=explanation,
    )
