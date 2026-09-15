"""Integration and unit tests for Master LangGraph Multi-Agent Orchestrator (Issue #33 / PDF Iteration 8)."""

from uuid import uuid4

from fastapi.testclient import TestClient

from src.backend.main import app
from src.backend.services.orchestrator_service import OrchestratorService

client = TestClient(app)


def test_basketball_post_workout_workflow() -> None:
    """Validate full multi-agent pipeline execution for a Basketball match query."""
    service = OrchestratorService()
    user_id = str(uuid4())
    query = "I just finished a 90 minute basketball match, what should I cook for dinner with what I have in my pantry?"

    result = service.process_query(query=query, user_id=user_id)

    assert result["intent"] == "BASKETBALL"
    assert result["execution_path"] == [
        "intent_classifier",
        "basketball_node",
        "nutrition_node",
        "inventory_node",
        "recipe_node",
        "response_synthesizer",
    ]
    assert result["sports_output"] is not None
    assert result["sports_output"]["sport"] == "BASKETBALL"
    assert result["sports_output"]["estimated_expenditure_kcal"] > 0.0
    assert result["nutrition_output"] is not None
    assert result["inventory_output"] is not None
    assert result["recipe_output"] is not None
    assert "Basketball" in result["final_response"] or "🏀" in result["final_response"]


def test_strength_post_workout_workflow() -> None:
    """Validate multi-agent pipeline execution for a Strength/Gym workout query."""
    service = OrchestratorService()
    user_id = str(uuid4())
    query = "Acabo de hacer una sesión intensa de gimnasio y pesas de 60 minutos"

    result = service.process_query(query=query, user_id=user_id)

    assert result["intent"] == "STRENGTH"
    assert result["execution_path"] == [
        "intent_classifier",
        "strength_node",
        "nutrition_node",
        "inventory_node",
        "recipe_node",
        "response_synthesizer",
    ]
    assert result["sports_output"] is not None
    assert result["sports_output"]["sport"] == "STRENGTH_TRAINING"


def test_standalone_pantry_check_workflow() -> None:
    """Validate standalone query routing for pantry inventory check."""
    service = OrchestratorService()
    user_id = str(uuid4())
    query = "¿Qué alimentos tengo disponibles en mi despensa?"

    result = service.process_query(query=query, user_id=user_id)

    assert result["intent"] == "PANTRY_CHECK"
    assert result["execution_path"] == [
        "intent_classifier",
        "inventory_node",
        "response_synthesizer",
    ]
    assert result["inventory_output"] is not None
    assert result["recipe_output"] is None


def test_standalone_nutrition_status_workflow() -> None:
    """Validate standalone query routing for nutrition status check."""
    service = OrchestratorService()
    user_id = str(uuid4())
    query = "¿Cuál es mi balance de calorias y macros hoy?"

    result = service.process_query(query=query, user_id=user_id)

    assert result["intent"] == "NUTRITION_STATUS"
    assert result["execution_path"] == [
        "intent_classifier",
        "nutrition_node",
        "response_synthesizer",
    ]
    assert result["nutrition_output"] is not None
    assert result["recipe_output"] is None


def test_orchestrator_rest_api_endpoint() -> None:
    """Validate POST /api/v1/agent/orchestrator/query REST API endpoint."""
    payload = {
        "query": "Jugué un partido de baloncesto de 90 min y quiero cenar",
        "user_id": str(uuid4()),
        "date": "2026-09-15",
    }

    response = client.post("/api/v1/agent/orchestrator/query", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["intent"] == "BASKETBALL"
    assert "execution_path" in data
    assert "final_response" in data
    assert len(data["execution_path"]) > 0
