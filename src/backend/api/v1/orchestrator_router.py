"""REST API Router for Master LangGraph Multi-Agent Orchestrator."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.backend.services import orchestrator_service

router = APIRouter(prefix="/api/v1/agent/orchestrator", tags=["agent-orchestrator"])


class OrchestratorQueryRequest(BaseModel):
    """Request payload for multi-agent query orchestration."""

    query: str = Field(
        ...,
        min_length=1,
        description="Natural language user query or activity prompt.",
    )
    user_id: UUID = Field(..., description="UUID of the target user.")
    date: str | None = Field(
        default=None, description="Optional target date YYYY-MM-DD."
    )


class OrchestratorQueryResponse(BaseModel):
    """Response payload returned by Master LangGraph Orchestrator."""

    query: str
    user_id: str
    intent: str
    execution_path: list[str]
    final_response: str
    sports_output: dict[str, Any] | None = None
    nutrition_output: dict[str, Any] | None = None
    inventory_output: dict[str, Any] | None = None
    recipe_output: dict[str, Any] | None = None


@router.post("/query")
def process_agent_query(
    request: OrchestratorQueryRequest,
) -> OrchestratorQueryResponse:
    """Execute Master LangGraph StateGraph pipeline for a user query."""
    date_str = request.date if request.date else "2026-09-15"
    result = orchestrator_service.process_query(
        query=request.query,
        user_id=str(request.user_id),
        date=date_str,
    )
    return OrchestratorQueryResponse(**result)
