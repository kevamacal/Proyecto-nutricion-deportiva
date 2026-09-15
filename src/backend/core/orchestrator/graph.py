"""Master LangGraph StateGraph definition and compilation."""

from typing import Any, Literal

from langgraph.graph import (  # type: ignore[import-not-found,import-untyped]
    END,
    StateGraph,
)

from src.backend.core.orchestrator.nodes import (
    basketball_node,
    intent_classifier_node,
    inventory_node,
    nutrition_node,
    recipe_node,
    response_synthesizer_node,
    strength_node,
)
from src.backend.core.orchestrator.state import OrchestratorState


def route_intent(
    state: OrchestratorState,
) -> Literal["basketball_node", "strength_node", "nutrition_node", "inventory_node"]:
    """Route from intent_classifier based on classified query intent."""
    intent = state.get("intent", "RECIPE")
    if intent == "BASKETBALL":
        return "basketball_node"
    if intent == "STRENGTH":
        return "strength_node"
    if intent == "PANTRY_CHECK":
        return "inventory_node"
    return "nutrition_node"


def route_after_nutrition(
    state: OrchestratorState,
) -> Literal["inventory_node", "response_synthesizer"]:
    """Route from nutrition_node depending on whether recipe generation is needed."""
    intent = state.get("intent", "RECIPE")
    if intent == "NUTRITION_STATUS":
        return "response_synthesizer"
    return "inventory_node"


def route_after_inventory(
    state: OrchestratorState,
) -> Literal["recipe_node", "response_synthesizer"]:
    """Route from inventory_node depending on whether standalone pantry check was requested."""
    intent = state.get("intent", "RECIPE")
    if intent == "PANTRY_CHECK":
        return "response_synthesizer"
    return "recipe_node"


def build_master_orchestrator_graph() -> Any:
    """Construct and compile the Master LangGraph StateGraph pipeline."""
    builder = StateGraph(OrchestratorState)

    builder.add_node("intent_classifier", intent_classifier_node)
    builder.add_node("basketball_node", basketball_node)
    builder.add_node("strength_node", strength_node)
    builder.add_node("nutrition_node", nutrition_node)
    builder.add_node("inventory_node", inventory_node)
    builder.add_node("recipe_node", recipe_node)
    builder.add_node("response_synthesizer", response_synthesizer_node)

    builder.set_entry_point("intent_classifier")

    builder.add_conditional_edges(
        "intent_classifier",
        route_intent,
        {
            "basketball_node": "basketball_node",
            "strength_node": "strength_node",
            "nutrition_node": "nutrition_node",
            "inventory_node": "inventory_node",
        },
    )

    builder.add_edge("basketball_node", "nutrition_node")
    builder.add_edge("strength_node", "nutrition_node")

    builder.add_conditional_edges(
        "nutrition_node",
        route_after_nutrition,
        {
            "inventory_node": "inventory_node",
            "response_synthesizer": "response_synthesizer",
        },
    )

    builder.add_conditional_edges(
        "inventory_node",
        route_after_inventory,
        {
            "recipe_node": "recipe_node",
            "response_synthesizer": "response_synthesizer",
        },
    )

    builder.add_edge("recipe_node", "response_synthesizer")
    builder.add_edge("response_synthesizer", END)

    return builder.compile()
