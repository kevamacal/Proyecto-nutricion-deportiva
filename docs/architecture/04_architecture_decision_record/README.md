# Architecture Decision Records (ADRs)

This directory contains the formal Architectural Decision Records (ADRs) for the Intelligent Sports Nutrition System MVP.

## Index of Decision Records

| ID | Title | Status | Date |
|---|---|---|---|
| [ADR-001](./01_core_vs_sports_decoupling.md) | Decoupling Application Core from Sports Extensions | ACCEPTED | 2026-09-11 |
| [ADR-002](./02_deterministic_vs_generative.md) | Strict Separation of Deterministic Math vs. Generative LLM Bounds | ACCEPTED | 2026-09-11 |
| [ADR-003](./03_isolated_ticket_pipeline.md) | Isolated Ingestion Pipeline for Receipt/Ticket OCR | ACCEPTED | 2026-09-11 |
| [ADR-004](./04_domain_naming_conventions.md) | Domain Naming Conventions (`FoodItem` vs `InventoryItem` vs `NutritionalInformation`) | ACCEPTED | 2026-09-11 |

---

## Directory Architecture Mapping

The code base structure reflects these decisions directly under `src/`:

- `src/backend/core/`: Common domain logic, entities (`User`, `NutritionalProfile`, `FoodItem`, `InventoryItem`, `Meal`, `Activity`), and deterministic calculation engines.
- `src/backend/sports/`: Modular sports specializations (`src/backend/sports/basketball/`, `src/backend/sports/strength_training/`) that plug into the core domain without modifying base database tables.
- `src/agent/`: Orchestration layer (`src/agent/orchestrator/`) and node execution contracts (`src/agent/nodes/`) managing LLM intent routing and generative meal synthesis (`recipe_node`).
- `src/frontend/`: User interface components and application pages.
