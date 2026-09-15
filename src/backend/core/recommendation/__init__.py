"""Deterministic Non-LLM Recommendation Engine package."""

from src.backend.core.recommendation.engine import (
    calculate_remaining_demands,
    generate_deterministic_recommendation,
    identify_dominant_deficit,
)

__all__ = [
    "calculate_remaining_demands",
    "generate_deterministic_recommendation",
    "identify_dominant_deficit",
]
