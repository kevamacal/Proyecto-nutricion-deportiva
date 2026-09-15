"""Master LangGraph Orchestrator State definitions."""

from typing import Any, TypedDict


class OrchestratorState(TypedDict, total=False):
    """Execution state passed across master orchestrator graph nodes."""

    query: str
    user_id: str
    date: str
    intent: str
    sports_params: dict[str, Any]
    nutrition_output: dict[str, Any] | None
    sports_output: dict[str, Any] | None
    inventory_output: dict[str, Any] | None
    recipe_output: dict[str, Any] | None
    final_response: str | None
    execution_path: list[str]
