"""Deterministic Non-LLM Recommendation Engine.

Follows physiological recommendation rules in docs/architecture/02_formulas.md and PDF Section 24.
Zero LLM calls or external client SDK invocations.
"""

from src.backend.api.v1.schemas import (
    IngredientMatch,
    InventoryItemResponse,
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
    elif remaining_carbs_g >= 40.0 and remaining_carbs_g > remaining_protein_g * 1.5:
        return "CARBOHYDRATES"
    return "BALANCED"


def match_ingredients_from_pantry(
    pantry_items: list[InventoryItemResponse],
    dominant_deficit: str,
    remaining_cal: float,
    remaining_prot: float,
    remaining_carbs: float,
) -> list[IngredientMatch]:
    """Rank available pantry items matching dominant deficit and compute recommended portion sizes."""
    matches: list[IngredientMatch] = []

    # Filter items with non-zero stock having valid nutrition
    valid_items = [
        item
        for item in pantry_items
        if item.quantity > 0 and item.food_item and item.food_item.nutrition
    ]

    # Score function based on dominant deficit macronutrient per 100g
    def score_item(item: InventoryItemResponse) -> float:
        if not item.food_item or not item.food_item.nutrition:
            return 0.0
        nutr = item.food_item.nutrition
        if dominant_deficit == "PROTEIN":
            return nutr.protein_g
        elif dominant_deficit == "CARBOHYDRATES":
            return nutr.carbohydrates_g
        else:
            return nutr.protein_g + nutr.carbohydrates_g

    sorted_items = sorted(valid_items, key=score_item, reverse=True)

    for item in sorted_items:
        food = item.food_item
        assert food is not None and food.nutrition is not None
        nutr = food.nutrition

        # Standard reference serving (default 100g)
        serving = nutr.serving_size if nutr.serving_size > 0 else 100.0

        # Calculate max portion needed based on remaining deficit
        if dominant_deficit == "PROTEIN" and nutr.protein_g > 0:
            desired_g = (remaining_prot / nutr.protein_g) * serving
        elif dominant_deficit == "CARBOHYDRATES" and nutr.carbohydrates_g > 0:
            desired_g = (remaining_carbs / nutr.carbohydrates_g) * serving
        else:
            desired_g = (
                (remaining_cal / nutr.calories_kcal) * serving
                if nutr.calories_kcal > 0
                else serving
            )

        # Cap recommended portion by available inventory quantity
        portion_g = round(min(desired_g, item.quantity, 300.0), 2)
        if portion_g <= 0:
            continue

        factor = portion_g / serving
        c_cal = round(nutr.calories_kcal * factor, 2)
        c_prot = round(nutr.protein_g * factor, 2)
        c_carbs = round(nutr.carbohydrates_g * factor, 2)
        c_fat = round(nutr.fat_g * factor, 2)

        matches.append(
            IngredientMatch(
                food_item_id=food.id,
                food_name=food.name,
                category=food.category,
                available_stock=item.quantity,
                unit=item.unit,
                recommended_portion_g=portion_g,
                calories_contribution_kcal=c_cal,
                protein_contribution_g=c_prot,
                carbs_contribution_g=c_carbs,
                fat_contribution_g=c_fat,
            )
        )

        # Limit to top 3 matched ingredients
        if len(matches) >= 3:
            break

    return matches


def generate_deterministic_recommendation(
    payload: RecommendationRequest, pantry_items: list[InventoryItemResponse]
) -> RecommendationResponse:
    """Execute complete deterministic recommendation pipeline without LLM inference."""
    demands = calculate_remaining_demands(payload)
    rem_cal = demands["remaining_calories_kcal"]
    rem_prot = demands["remaining_protein_g"]
    rem_carbs = demands["remaining_carbohydrates_g"]
    rem_fat = demands["remaining_fat_g"]

    deficit = identify_dominant_deficit(rem_prot, rem_carbs)
    matches = match_ingredients_from_pantry(
        pantry_items=pantry_items,
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
