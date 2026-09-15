"""Main FastAPI Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.api.v1.activities_router import router as activities_router
from src.backend.api.v1.food_router import router as food_router
from src.backend.api.v1.inventory_router import router as inventory_router
from src.backend.api.v1.meals_router import router as meals_router
from src.backend.api.v1.nutrition_router import router as nutrition_router
from src.backend.api.v1.orchestrator_router import router as orchestrator_router
from src.backend.api.v1.recipe_router import router as recipe_router
from src.backend.api.v1.recommendation_router import router as recommendation_router
from src.backend.api.v1.summary_router import router as summary_router

app = FastAPI(
    title="Sports Nutrition & Athletic Performance Platform API",
    description="FastAPI Backend for Sports Bioenergetics, Food Catalog, Pantry Inventory, and Meal Tracking.",
    version="1.0.0",
)

# Enable CORS for local web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(food_router)
app.include_router(inventory_router)
app.include_router(meals_router)
app.include_router(summary_router)
app.include_router(nutrition_router)
app.include_router(activities_router)
app.include_router(recommendation_router)
app.include_router(recipe_router)
app.include_router(orchestrator_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Health check endpoint verifying API service status."""
    return {"status": "ok", "service": "Sports Nutrition API"}
