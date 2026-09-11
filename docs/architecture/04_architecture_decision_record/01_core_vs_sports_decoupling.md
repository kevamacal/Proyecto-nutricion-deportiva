# ADR-001: Decoupling Application Core from Sports Extensions

## Status

**ACCEPTED**

## Date

2026-09-11

## Context & Problem Statement

The system must support specific physical activities in its MVP (Basketball and Strength Training / Gym) while remaining extensible to future disciplines such as Running, Cycling, Football, or Swimming. 

If sport-specific attributes (e.g., basketball shot counts or bench press volume) are mixed directly into core activity schemas or core database tables, the core domain model will become bloated, fragile, and difficult to maintain. Future additions of sports would require modifying core database schemas, migrations, and shared business logic.

## Decision Drivers

- **Extensibility**: Adding new sports must not require database schema alterations or code changes in core services.
- **Domain Decoupling**: Core nutrition, inventory, and activity logging must remain agnostic to specific sports rules.
- **Maintainability**: Clear architectural separation between universal activity tracking (duration, energy expenditure) and sport-specific recovery demands (glycogen resynthesis, muscle protein synthesis).

## Considered Options

1. **Monolithic Activity Model (Single Table)**: Put all sport-specific columns into a single `Activity` table with nullable fields.
2. **Polymorphic / Dynamic EAV or JSON Field**: Store sport-specific metrics as un-structured `jsonb` payloads inside a generic `Activity` table.
3. **Core Entity with Modular Sports Extension Tables (Domain-Driven Design Plugin Architecture)**: Establish a base `Activity` model in `core/` and modular extension packages in `sports/` (e.g. `sports/basketball/` and `sports/strength_training/`) linked via foreign key extension tables (`BasketballActivity`, `StrengthTrainingActivity`).

## Decision Outcome

**Option 3: Core Entity with Modular Sports Extension Tables**.

### Architectural Breakdown

- **`src/backend/core/activity/`**: Defines the universal `Activity` base entity containing shared parameters (`id`, `user_id`, `sport`, `session_type`, `duration_minutes`, `intensity`, `date`, `estimated_expenditure_kcal`).
- **`src/backend/sports/basketball/`**: Implements specialized basketball logic, extending `Activity` via `BasketballActivity` with attributes like `session_category` (`TRAINING` vs `MATCH`), `carb_demand_g`, `hydration_demand_ml`, and `recovery_priority`.
- **`src/backend/sports/strength_training/`**: Implements strength training logic, extending `Activity` via `StrengthTrainingActivity` with attributes like `training_type`, `protein_demand_g`, `targeted_muscle_groups`, `total_volume_kg`, `total_sets`, and `total_reps`.

### Directory Layout

```
Proyecto-nutricion-deportiva/
└── src/
    ├── backend/
    │   ├── core/
    │   │   └── activity/          # Base universal activity domain model
    │   └── sports/
    │       ├── basketball/        # Basketball specialized domain module & node
    │       └── strength_training/ # Strength training specialized domain module & node
    ├── agent/                     # LLM Orchestration & Node execution logic
    └── frontend/                  # Web / mobile UI application
```

## Consequences

### Positive
- Adding a new sport (e.g., `sports/football/`) only requires adding a new extension package without altering existing core database tables or core services.
- Queries on core daily activity and expenditure execute cleanly on the `Activity` table without checking sport-specific nullable columns.
- Clear alignment with Domain-Driven Design (DDD) principles.

### Negative
- Requires 1:1 join queries when fetching detailed sport-specific records alongside base activity records.
