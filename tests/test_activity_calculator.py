"""Unit test suite for sports MET activity expenditure and recovery demand calculators."""

import pytest

from src.backend.core.activity.models import ActivityIntensity
from src.backend.sports.activity_calculator import (
    calculate_basketball_expenditure_and_demands,
    calculate_met_expenditure,
    calculate_strength_expenditure_and_demands,
)
from src.backend.sports.basketball.models import BasketballSessionCategory
from src.backend.sports.strength_training.models import StrengthTrainingType


def test_calculate_met_expenditure_valid():
    # MET = 8.0, Weight = 80kg, Duration = 90 min (1.5h) => 8.0 * 80 * 1.5 = 960 kcal
    expenditure = calculate_met_expenditure(
        met=8.0, weight_kg=80.0, duration_minutes=90
    )
    assert expenditure == 960.0


def test_calculate_met_expenditure_invalid():
    with pytest.raises(ValueError):
        calculate_met_expenditure(met=0.0, weight_kg=80.0, duration_minutes=60)
    with pytest.raises(ValueError):
        calculate_met_expenditure(met=5.0, weight_kg=-70.0, duration_minutes=60)
    with pytest.raises(ValueError):
        calculate_met_expenditure(met=5.0, weight_kg=70.0, duration_minutes=0)


def test_basketball_expenditure_and_demands():
    # Basketball Match, HIGH intensity (MET=9.0), 80kg, 60min
    # Expenditure: 9.0 * 80 * 1.0 = 720.0 kcal
    # Carb demand: 80kg * 1.2 = 96.0g
    # Hydration demand: 60 * 12.5 = 750.0 ml
    result = calculate_basketball_expenditure_and_demands(
        weight_kg=80.0,
        duration_minutes=60,
        intensity=ActivityIntensity.HIGH,
        session_category=BasketballSessionCategory.MATCH,
    )
    assert result["estimated_expenditure_kcal"] == 720.0
    assert result["carb_demand_g"] == 96.0
    assert result["hydration_demand_ml"] == 750.0
    assert result["recovery_priority"] == "GLYCOGEN_REPLETON_AND_HYDRATION"


def test_strength_expenditure_and_demands():
    # Strength Hypertrophy, MEDIUM intensity (MET=6.0), 80kg, 60min
    # Expenditure: 6.0 * 80 * 1.0 = 480.0 kcal
    # Protein demand: max(30.0, 80 * 0.35 = 28.0) => 30.0g
    # Carb demand: 80 * 0.60 = 48.0g
    result = calculate_strength_expenditure_and_demands(
        weight_kg=80.0,
        duration_minutes=60,
        intensity=ActivityIntensity.MEDIUM,
        training_type=StrengthTrainingType.HYPERTROPHY,
    )
    assert result["estimated_expenditure_kcal"] == 480.0
    assert result["protein_demand_g"] == 30.0
    assert result["carb_demand_g"] == 48.0
    assert result["recovery_priority"] == "MUSCLE_PROTEIN_SYNTHESIS_AND_REPAIR"
