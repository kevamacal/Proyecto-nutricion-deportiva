"""Service layer wrapping Master LangGraph Multi-Agent Orchestrator execution."""

from typing import Any

from src.backend.core.orchestrator.graph import build_master_orchestrator_graph
from src.backend.core.orchestrator.state import OrchestratorState


class OrchestratorService:
    """Service providing multi-agent query orchestration."""

    def __init__(self) -> None:
        """Initialize and compile the master state graph."""
        self.graph = build_master_orchestrator_graph()

    def process_query(
        self, query: str, user_id: str, date: str = "2026-09-15"
    ) -> dict[str, Any]:
        """Orchestrate multi-agent graph execution for a user query."""
        initial_state: OrchestratorState = {
            "query": query,
            "user_id": user_id,
            "date": date,
            "execution_path": [],
        }

        result_state: dict[str, Any] = self.graph.invoke(initial_state)

        return {
            "query": result_state.get("query", query),
            "user_id": result_state.get("user_id", user_id),
            "intent": result_state.get("intent", "UNKNOWN"),
            "execution_path": result_state.get("execution_path", []),
            "final_response": result_state.get("final_response", ""),
            "sports_output": result_state.get("sports_output"),
            "nutrition_output": result_state.get("nutrition_output"),
            "inventory_output": result_state.get("inventory_output"),
            "recipe_output": result_state.get("recipe_output"),
        }
