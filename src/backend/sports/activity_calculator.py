"""Deterministic sports activity expenditure (MET method) and recovery demand calculators.

Follows physiological formulas in docs/architecture/02_formulas.md.
Zero LLM calls or external client invocations.
"""

from src.backend.core.activity.models import ActivityIntensity
from src.backend.sports.basketball.models import BasketballSessionCategory
from src.backend.sports.strength_training.models import StrengthTrainingType

# Basketball MET Lookup Matrix
BASKETBALL_MET_MATRIX: dict[
    BasketballSessionCategory, dict[ActivityIntensity, float]
] = {
    BasketballSessionCategory.TRAINING: {
        ActivityIntensity.LOW: 5.0,
        ActivityIntensity.MEDIUM: 6.5,
        ActivityIntensity.HIGH: 8.0,
        ActivityIntensity.VERY_HIGH: 9.0,
    },
    BasketballSessionCategory.MATCH: {
        ActivityIntensity.LOW: 6.5,
        ActivityIntensity.MEDIUM: 8.0,
        ActivityIntensity.HIGH: 9.0,
        ActivityIntensity.VERY_HIGH: 10.0,
    },
}

# Strength Training MET Lookup Matrix
STRENGTH_MET_MATRIX: dict[StrengthTrainingType, dict[ActivityIntensity, float]] = {
    StrengthTrainingType.STRENGTH: {
        ActivityIntensity.LOW: 4.0,
        ActivityIntensity.MEDIUM: 5.0,
        ActivityIntensity.HIGH: 6.0,
        ActivityIntensity.VERY_HIGH: 7.0,
    },
    StrengthTrainingType.POWER: {
        ActivityIntensity.LOW: 4.0,
        ActivityIntensity.MEDIUM: 5.0,
        ActivityIntensity.HIGH: 6.0,
        ActivityIntensity.VERY_HIGH: 7.0,
    },
    StrengthTrainingType.HYPERTROPHY: {
        ActivityIntensity.LOW: 4.5,
        ActivityIntensity.MEDIUM: 6.0,
        ActivityIntensity.HIGH: 7.0,
        ActivityIntensity.VERY_HIGH: 8.0,
    },
    StrengthTrainingType.HYBRID: {
        ActivityIntensity.LOW: 5.0,
        ActivityIntensity.MEDIUM: 6.5,
        ActivityIntensity.HIGH: 7.5,
        ActivityIntensity.VERY_HIGH: 9.0,
    },
    StrengthTrainingType.ENDURANCE: {
        ActivityIntensity.LOW: 5.0,
        ActivityIntensity.MEDIUM: 6.5,
        ActivityIntensity.HIGH: 7.5,
        ActivityIntensity.VERY_HIGH: 9.0,
    },
}


def calculate_met_expenditure(
    met: float, weight_kg: float, duration_minutes: int
) -> float:
    """Calculate energy expenditure using MET formula: MET * weight * (duration / 60).

    Args:
        met: Metabolic Equivalent of Task (> 0).
        weight_kg: Athlete weight in kilograms (> 0).
        duration_minutes: Duration in minutes (> 0).

    Returns:
        Estimated expenditure in kcal (rounded to 2 decimal places).
    """
    if met <= 0 or weight_kg <= 0 or duration_minutes <= 0:
        raise ValueError("MET, weight, and duration_minutes must be strictly positive")

    expenditure = met * weight_kg * (duration_minutes / 60.0)
    return round(expenditure, 2)


def calculate_basketball_expenditure_and_demands(
    weight_kg: float,
    duration_minutes: int,
    intensity: ActivityIntensity,
    session_category: BasketballSessionCategory,
) -> dict[str, float | str]:
    """Calculate basketball session expenditure and recovery demands.

    Returns:
        Dict with keys:
            - estimated_expenditure_kcal
            - carb_demand_g
            - hydration_demand_ml
            - recovery_priority
    """
    met = BASKETBALL_MET_MATRIX[session_category][intensity]
    expenditure = calculate_met_expenditure(met, weight_kg, duration_minutes)

    # Glycogen Resynthesis Demand (Carbohydrates)
    carb_factor = 1.0 if session_category == BasketballSessionCategory.TRAINING else 1.2
    carb_demand = round(weight_kg * carb_factor, 2)

    # Rehydration Demand (12.5 ml/min = ~750 ml/hour)
    hydration_demand = round(duration_minutes * 12.5, 2)

    return {
        "estimated_expenditure_kcal": expenditure,
        "carb_demand_g": carb_demand,
        "hydration_demand_ml": hydration_demand,
        "recovery_priority": "GLYCOGEN_REPLETON_AND_HYDRATION",
    }


def calculate_strength_expenditure_and_demands(
    weight_kg: float,
    duration_minutes: int,
    intensity: ActivityIntensity,
    training_type: StrengthTrainingType,
) -> dict[str, float | str]:
    """Calculate strength training session expenditure and recovery demands.

    Returns:
        Dict with keys:
            - estimated_expenditure_kcal
            - protein_demand_g
            - carb_demand_g
            - recovery_priority
    """
    met = STRENGTH_MET_MATRIX[training_type][intensity]
    expenditure = calculate_met_expenditure(met, weight_kg, duration_minutes)

    # MPS Recovery Protein Demand (min 30g, or weight * 0.35g)
    protein_demand = round(max(30.0, weight_kg * 0.35), 2)

    # Glycogen Replenishment Demand (weight * 0.60g)
    carb_demand = round(weight_kg * 0.60, 2)

    return {
        "estimated_expenditure_kcal": expenditure,
        "protein_demand_g": protein_demand,
        "carb_demand_g": carb_demand,
        "recovery_priority": "MUSCLE_PROTEIN_SYNTHESIS_AND_REPAIR",
    }
