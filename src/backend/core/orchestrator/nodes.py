"""Master Orchestrator Node implementations.

Defines deterministic & generative node execution wrappers for the LangGraph StateGraph.
"""

import re
from typing import Any
from uuid import uuid4

from src.backend.core.activity.models import ActivityIntensity
from src.backend.core.orchestrator.state import OrchestratorState
from src.backend.core.recipe.node import execute_recipe_node
from src.backend.core.recipe.schemas import (
    AvailableIngredientInput,
    RecipeNodeInput,
    RemainingNeedsInput,
    SportsRecoveryContextInput,
    UserConstraintsInput,
)
from src.backend.sports.activity_calculator import (
    calculate_basketball_expenditure_and_demands,
    calculate_strength_expenditure_and_demands,
)
from src.backend.sports.basketball.models import BasketballSessionCategory
from src.backend.sports.strength_training.models import StrengthTrainingType


def _parse_duration(query: str, default: int = 60) -> int:
    """Extract duration in minutes from query string if present."""
    match = re.search(r"(\d+)\s*min", query, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return default


def intent_classifier_node(state: OrchestratorState) -> OrchestratorState:
    """Classify user query intent and parse initial sports parameters."""
    query = state.get("query", "").lower()
    path = list(state.get("execution_path", []))
    path.append("intent_classifier")

    intent = "RECIPE"
    sports_params: dict[str, Any] = {}

    if any(kw in query for kw in ["basketball", "baloncesto", "basket"]):
        intent = "BASKETBALL"
        duration = _parse_duration(query, 60)
        category = (
            BasketballSessionCategory.MATCH
            if "match" in query or "partido" in query
            else BasketballSessionCategory.TRAINING
        )
        sports_params = {
            "duration_minutes": duration,
            "intensity": ActivityIntensity.HIGH,
            "session_category": category,
            "user_weight_kg": 75.0,
        }
    elif any(kw in query for kw in ["gym", "gimnasio", "pesas", "fuerza", "strength"]):
        intent = "STRENGTH"
        duration = _parse_duration(query, 60)
        sports_params = {
            "duration_minutes": duration,
            "intensity": ActivityIntensity.HIGH,
            "training_type": StrengthTrainingType.HYPERTROPHY,
            "user_weight_kg": 75.0,
        }
    elif any(
        kw in query for kw in ["despensa", "pantry", "ingredientes", "stock", "tengo"]
    ) and not any(kw in query for kw in ["receta", "cocinar", "cena", "comer"]):
        intent = "PANTRY_CHECK"
    elif any(
        kw in query
        for kw in ["calorias", "macros", "balance", "estado nutricional", "targets"]
    ) and not any(kw in query for kw in ["receta", "cocinar"]):
        intent = "NUTRITION_STATUS"

    return {
        **state,
        "intent": intent,
        "sports_params": sports_params,
        "execution_path": path,
    }


def basketball_node(state: OrchestratorState) -> OrchestratorState:
    """Execute basketball activity calculation node."""
    params = state.get("sports_params", {})
    weight = float(params.get("user_weight_kg", 75.0))
    duration = int(params.get("duration_minutes", 60))
    intensity = params.get("intensity", ActivityIntensity.HIGH)
    category = params.get("session_category", BasketballSessionCategory.MATCH)

    output = calculate_basketball_expenditure_and_demands(
        weight_kg=weight,
        duration_minutes=duration,
        intensity=intensity,
        session_category=category,
    )
    output["sport"] = "BASKETBALL"

    path = list(state.get("execution_path", []))
    path.append("basketball_node")

    return {
        **state,
        "sports_output": output,
        "execution_path": path,
    }


def strength_node(state: OrchestratorState) -> OrchestratorState:
    """Execute strength activity calculation node."""
    params = state.get("sports_params", {})
    weight = float(params.get("user_weight_kg", 75.0))
    duration = int(params.get("duration_minutes", 60))
    intensity = params.get("intensity", ActivityIntensity.HIGH)
    training_type = params.get("training_type", StrengthTrainingType.HYPERTROPHY)

    output = calculate_strength_expenditure_and_demands(
        weight_kg=weight,
        duration_minutes=duration,
        intensity=intensity,
        training_type=training_type,
    )
    output["sport"] = "STRENGTH_TRAINING"

    path = list(state.get("execution_path", []))
    path.append("strength_node")

    return {
        **state,
        "sports_output": output,
        "execution_path": path,
    }


def nutrition_node(state: OrchestratorState) -> OrchestratorState:
    """Calculate daily balance and adjusted macro targets based on sports context."""
    user_id = state.get("user_id", "00000000-0000-0000-0000-000000000000")
    date = state.get("date", "2026-09-15")
    sports_output = state.get("sports_output") or {}

    extra_kcal = float(sports_output.get("estimated_expenditure_kcal", 0.0))
    extra_carbs = float(sports_output.get("carb_demand_g", 0.0))

    base_calories = 2200.0
    base_protein = 150.0
    base_carbs = 250.0
    base_fat = 65.0

    adjusted_calories = base_calories + extra_kcal
    adjusted_carbs = base_carbs + extra_carbs

    consumed_cal = 1200.0
    consumed_prot = 80.0
    consumed_carbs = 140.0
    consumed_fat = 40.0

    rem_cal = max(0.0, adjusted_calories - consumed_cal)
    rem_prot = max(0.0, base_protein - consumed_prot)
    rem_carbs = max(0.0, adjusted_carbs - consumed_carbs)
    rem_fat = max(0.0, base_fat - consumed_fat)

    output = {
        "user_id": user_id,
        "date": date,
        "daily_targets": {
            "calories_kcal": base_calories,
            "protein_g": base_protein,
            "carbohydrates_g": base_carbs,
            "fat_g": base_fat,
        },
        "consumed": {
            "calories_kcal": consumed_cal,
            "protein_g": consumed_prot,
            "carbohydrates_g": consumed_carbs,
            "fat_g": consumed_fat,
            "logged_meals_count": 2,
        },
        "activity_expenditure": {
            "total_expenditure_kcal": extra_kcal,
            "additional_carbs_demand_g": extra_carbs,
            "logged_activities_count": 1 if sports_output else 0,
        },
        "adjusted_targets": {
            "calories_kcal": adjusted_calories,
            "protein_g": base_protein,
            "carbohydrates_g": adjusted_carbs,
            "fat_g": base_fat,
        },
        "remaining_balance": {
            "remaining_calories_kcal": rem_cal,
            "remaining_protein_g": rem_prot,
            "remaining_carbs_g": rem_carbs,
            "remaining_fat_g": rem_fat,
        },
        "nutritional_status_flag": "DEFICIT" if rem_cal > 0 else "SURPLUS",
    }

    path = list(state.get("execution_path", []))
    path.append("nutrition_node")

    return {
        **state,
        "nutrition_output": output,
        "execution_path": path,
    }


def inventory_node(state: OrchestratorState) -> OrchestratorState:
    """Fetch user pantry inventory items and status."""
    user_id = state.get("user_id", "00000000-0000-0000-0000-000000000000")

    items = [
        {
            "inventory_item_id": str(uuid4()),
            "food_item_id": str(uuid4()),
            "name": "Chicken breast",
            "category": "Poultry",
            "available_quantity": 400.0,
            "unit": "g",
            "expiration_date": "2026-09-18",
            "days_until_expiration": 3,
            "status": "AVAILABLE",
            "density_class": "PROTEIN_DENSE",
            "nutrition_per_serving": {
                "serving_size": 100.0,
                "serving_unit": "g",
                "calories_kcal": 165.0,
                "protein_g": 31.0,
                "carbohydrates_g": 0.0,
                "fat_g": 3.6,
            },
        },
        {
            "inventory_item_id": str(uuid4()),
            "food_item_id": str(uuid4()),
            "name": "White rice",
            "category": "Grains",
            "available_quantity": 1000.0,
            "unit": "g",
            "expiration_date": None,
            "days_until_expiration": None,
            "status": "AVAILABLE",
            "density_class": "CARB_DENSE",
            "nutrition_per_serving": {
                "serving_size": 100.0,
                "serving_unit": "g",
                "calories_kcal": 130.0,
                "protein_g": 2.7,
                "carbohydrates_g": 28.0,
                "fat_g": 0.3,
            },
        },
    ]

    output = {
        "user_id": user_id,
        "total_items_found": len(items),
        "inventory_items": items,
    }

    path = list(state.get("execution_path", []))
    path.append("inventory_node")

    return {
        **state,
        "inventory_output": output,
        "execution_path": path,
    }


def recipe_node(state: OrchestratorState) -> OrchestratorState:
    """Execute generative recipe node using deterministic outputs from prior nodes."""
    nutrition_output = state.get("nutrition_output") or {}
    rem_balance = nutrition_output.get("remaining_balance", {})
    inventory_output = state.get("inventory_output") or {}
    inv_items = inventory_output.get("inventory_items", [])
    sports_output = state.get("sports_output") or {}

    remaining_needs = RemainingNeedsInput(
        remaining_calories_kcal=float(
            rem_balance.get("remaining_calories_kcal", 500.0)
        ),
        remaining_protein_g=float(rem_balance.get("remaining_protein_g", 40.0)),
        remaining_carbs_g=float(rem_balance.get("remaining_carbs_g", 60.0)),
        remaining_fat_g=float(rem_balance.get("remaining_fat_g", 15.0)),
    )

    available_ingredients = [
        AvailableIngredientInput(
            food_item_id=item["food_item_id"],
            name=item["name"],
            available_quantity=float(item["available_quantity"]),
            unit=item["unit"],
            density_class=item.get("density_class", "BALANCED"),
            expiration_date=item.get("expiration_date"),
        )
        for item in inv_items
    ]

    sports_recovery = None
    if sports_output:
        sports_recovery = SportsRecoveryContextInput(
            sport=str(sports_output.get("sport", "GENERAL")),
            recovery_priority=str(
                sports_output.get("recovery_priority", "GENERAL_RECOVERY")
            ),
        )

    recipe_input = RecipeNodeInput(
        remaining_needs=remaining_needs,
        available_ingredients=available_ingredients,
        user_constraints=UserConstraintsInput(
            max_preparation_time_minutes=30,
            meal_type="DINNER",
        ),
        sports_recovery_context=sports_recovery,
    )

    recipe_result = execute_recipe_node(recipe_input)

    path = list(state.get("execution_path", []))
    path.append("recipe_node")

    return {
        **state,
        "recipe_output": recipe_result.model_dump(),
        "execution_path": path,
    }


def response_synthesizer_node(state: OrchestratorState) -> OrchestratorState:
    """Synthesize final user response string combining deterministic outputs."""
    intent = state.get("intent", "UNKNOWN")
    sports_output = state.get("sports_output")
    nutrition_output = state.get("nutrition_output")
    inventory_output = state.get("inventory_output")
    recipe_output = state.get("recipe_output")

    lines: list[str] = []

    if intent in ["BASKETBALL", "STRENGTH"] and sports_output:
        sport = sports_output.get("sport", "")
        kcal = sports_output.get("estimated_expenditure_kcal", 0.0)
        lines.append(
            f"### 🏀 Sesión Deportiva ({sport})\n- **Gasto Estimado**: {kcal} kcal"
        )
        if "carb_demand_g" in sports_output:
            lines.append(
                f"- **Demanda de Carbohidratos**: {sports_output['carb_demand_g']}g"
            )
        if "hydration_demand_ml" in sports_output:
            lines.append(
                f"- **Hidratación Recomendada**: {sports_output['hydration_demand_ml']} ml"
            )

    if nutrition_output:
        rem = nutrition_output.get("remaining_balance", {})
        lines.append(
            "\n### 📊 Balance Nutricional Restante\n"
            f"- Calorías: {rem.get('remaining_calories_kcal', 0.0)} kcal | "
            f"Proteínas: {rem.get('remaining_protein_g', 0.0)}g | "
            f"Carbohidratos: {rem.get('remaining_carbs_g', 0.0)}g | "
            f"Grasas: {rem.get('remaining_fat_g', 0.0)}g"
        )

    if inventory_output:
        count = inventory_output.get("total_items_found", 0)
        lines.append(f"\n### 📦 Despensa\n- **Alimentos Disponibles**: {count} ítems")

    if recipe_output:
        name = recipe_output.get("recipe_name", "Receta Recomendada")
        time_min = recipe_output.get("total_time_minutes", 0)
        explanation = recipe_output.get("explanation", "")
        lines.append(
            f"\n### 👨‍🍳 Receta Recomendada: {name}\n"
            f"- **Tiempo Total**: {time_min} minutos\n"
            f"- **Detalle**: {explanation}"
        )

    response_text = "\n".join(lines) if lines else "Proceso completado correctamente."

    path = list(state.get("execution_path", []))
    path.append("response_synthesizer")

    return {
        **state,
        "final_response": response_text,
        "execution_path": path,
    }
