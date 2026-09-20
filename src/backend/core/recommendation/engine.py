"""Deterministic Non-LLM Recommendation Engine.

Follows physiological recommendation rules in docs/architecture/02_formulas.md and PDF Section 24.
Zero LLM calls or external client SDK invocations.
"""

from src.backend.api.v1.schemas import (
    IngredientMatch,
    PantryItemInput,
    PantryItemNutritionInput,
    RecommendationRequest,
    RecommendationResponse,
)


def calculate_remaining_demands(payload: RecommendationRequest) -> dict[str, float]:
    """Calculate remaining caloric and macronutrient demands accounting for activity expenditure."""
    adjusted_calories_target = (
        payload.target_calories_kcal + payload.activity_expenditure_kcal
    )
    adjusted_protein_target = (
        payload.target_protein_g + payload.activity_protein_demand_g
    )
    adjusted_carbs_target = (
        payload.target_carbohydrates_g + payload.activity_carb_demand_g
    )

    remaining_cal = max(0.0, adjusted_calories_target - payload.consumed_calories_kcal)
    remaining_prot = max(0.0, adjusted_protein_target - payload.consumed_protein_g)
    remaining_carbs = max(0.0, adjusted_carbs_target - payload.consumed_carbohydrates_g)
    remaining_fat = max(0.0, payload.target_fat_g - payload.consumed_fat_g)

    return {
        "remaining_calories_kcal": round(remaining_cal, 2),
        "remaining_protein_g": round(remaining_prot, 2),
        "remaining_carbohydrates_g": round(remaining_carbs, 2),
        "remaining_fat_g": round(remaining_fat, 2),
    }


def identify_dominant_deficit(
    remaining_protein_g: float, remaining_carbs_g: float
) -> str:
    """Identify dominant deficit macronutrient (PROTEIN, CARBOHYDRATES, or BALANCED)."""
    if remaining_protein_g >= 25.0 and remaining_protein_g > remaining_carbs_g * 0.4:
        return "PROTEIN"
    if remaining_carbs_g >= 40.0 and remaining_carbs_g > remaining_protein_g * 1.5:
        return "CARBOHYDRATES"
    return "BALANCED"


def _score_pantry_item(item: PantryItemInput, dominant_deficit: str) -> float:
    """Helper scoring a pantry stock item based on dominant deficit density."""
    nutr = item.nutrition
    if dominant_deficit == "PROTEIN":
        return nutr.protein_g
    if dominant_deficit == "CARBOHYDRATES":
        return nutr.carbohydrates_g
    return nutr.protein_g + nutr.carbohydrates_g


def _calculate_desired_portion(
    nutr: PantryItemNutritionInput,
    dominant_deficit: str,
    remaining_cal: float,
    remaining_prot: float,
    remaining_carbs: float,
) -> float:
    """Helper calculating desired portion in grams based on remaining deficit."""
    serving = nutr.serving_size if nutr.serving_size > 0 else 100.0

    if dominant_deficit == "PROTEIN" and nutr.protein_g > 0:
        return (remaining_prot / nutr.protein_g) * serving
    if dominant_deficit == "CARBOHYDRATES" and nutr.carbohydrates_g > 0:
        return (remaining_carbs / nutr.carbohydrates_g) * serving
    if nutr.calories_kcal > 0:
        return (remaining_cal / nutr.calories_kcal) * serving
    return serving


def _create_ingredient_match(
    item: PantryItemInput, portion_g: float
) -> IngredientMatch:
    """Helper constructing IngredientMatch DTO for a given portion size."""
    nutr = item.nutrition
    serving = nutr.serving_size if nutr.serving_size > 0 else 100.0

    factor = portion_g / serving
    return IngredientMatch(
        food_item_id=item.food_item_id,
        food_name=item.name,
        category=item.category,
        available_stock=item.available_quantity,
        unit=item.unit,
        recommended_portion_g=portion_g,
        calories_contribution_kcal=round(nutr.calories_kcal * factor, 2),
        protein_contribution_g=round(nutr.protein_g * factor, 2),
        carbs_contribution_g=round(nutr.carbohydrates_g * factor, 2),
        fat_contribution_g=round(nutr.fat_g * factor, 2),
    )


def match_ingredients_from_pantry(
    pantry_items: list[PantryItemInput],
    dominant_deficit: str,
    remaining_cal: float,
    remaining_prot: float,
    remaining_carbs: float,
) -> list[IngredientMatch]:
    """Rank available pantry items matching dominant deficit and compute recommended portion sizes."""
    valid_items = [
        item for item in pantry_items if item.available_quantity > 0 and item.nutrition
    ]

    sorted_items = sorted(
        valid_items,
        key=lambda i: _score_pantry_item(i, dominant_deficit),
        reverse=True,
    )

    matches: list[IngredientMatch] = []
    for item in sorted_items:
        nutr = item.nutrition
        desired_g = _calculate_desired_portion(
            nutr=nutr,
            dominant_deficit=dominant_deficit,
            remaining_cal=remaining_cal,
            remaining_prot=remaining_prot,
            remaining_carbs=remaining_carbs,
        )

        portion_g = round(min(desired_g, item.available_quantity, 300.0), 2)
        if portion_g <= 0:
            continue

        matches.append(_create_ingredient_match(item, portion_g))
        if len(matches) >= 3:
            break

    return matches


def generate_deterministic_recommendation(
    payload: RecommendationRequest,
) -> RecommendationResponse:
    """Execute complete deterministic recommendation pipeline without LLM inference."""
    demands = calculate_remaining_demands(payload)
    rem_cal = demands["remaining_calories_kcal"]
    rem_prot = demands["remaining_protein_g"]
    rem_carbs = demands["remaining_carbohydrates_g"]
    rem_fat = demands["remaining_fat_g"]

    deficit = identify_dominant_deficit(rem_prot, rem_carbs)
    matches = match_ingredients_from_pantry(
        pantry_items=payload.pantry_items,
        dominant_deficit=deficit,
        remaining_cal=rem_cal,
        remaining_prot=rem_prot,
        remaining_carbs=rem_carbs,
    )

    if matches:
        ing_names = ", ".join(m.food_name for m in matches)
        summary = (
            f"Prioridad nutricional: {deficit}. Tienes disponible en despensa: {ing_names}. "
            f"Se recomiendan porciones ajustadas para cubrir {rem_prot}g de proteína y {rem_carbs}g de carbohidratos."
        )
    else:
        summary = (
            f"Prioridad nutricional: {deficit}. Te quedan {rem_cal} kcal ({rem_prot}g P / {rem_carbs}g C / {rem_fat}g G). "
            "No se encontraron ingredientes en despensa para cubrir este déficit. Considera añadir alimentos a tu inventario."
        )

    return RecommendationResponse(
        user_id=payload.user_id,
        remaining_calories_kcal=rem_cal,
        remaining_protein_g=rem_prot,
        remaining_carbohydrates_g=rem_carbs,
        remaining_fat_g=rem_fat,
        dominant_deficit_macronutrient=deficit,
        recommended_ingredients=matches,
        recommendation_summary=summary,
    )
