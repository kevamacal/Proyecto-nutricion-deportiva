"""Main FastAPI Application Entrypoint — Pure Computation Layer."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.api.v1.activities_router import router as activities_router
from src.backend.api.v1.nutrition_router import router as nutrition_router
from src.backend.api.v1.orchestrator_router import router as orchestrator_router
from src.backend.api.v1.recipe_router import router as recipe_router
from src.backend.api.v1.recommendation_router import router as recommendation_router

app = FastAPI(
    title="Sports Nutrition & Athletic Performance Platform API",
    description=(
        "FastAPI Backend — Pure Computation Layer for Bioenergetics (BMR/TDEE), "
        "MET-based Activity Expenditure, Deterministic Recommendation Engine, "
        "and LangGraph Multi-Agent Orchestration. "
    ),
    version="2.0.0",
)

# Enable CORS for local web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Computation API Routers only
app.include_router(nutrition_router)
app.include_router(activities_router)
app.include_router(recommendation_router)
app.include_router(recipe_router)
app.include_router(orchestrator_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Health check endpoint verifying API service status."""
    return {"status": "ok", "service": "Sports Nutrition Computation API v2"}
