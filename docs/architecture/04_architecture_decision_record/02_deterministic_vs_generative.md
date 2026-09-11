# ADR-002: Strict Separation of Deterministic Math vs. Generative LLM Bounds

## Status

**ACCEPTED**

## Date

2026-09-11

## Context & Problem Statement

Large Language Models (LLMs) excel at natural language understanding, intent interpretation, tool selection, and creative culinary text synthesis (generating recipes). However, LLMs are non-deterministic and prone to arithmetic hallucinations, making them unreliable for calculating physical metrics, Basal Metabolic Rates (BMR), macronutrient daily targets, MET-based caloric expenditure, and inventory portion subtractions.

Allowing the LLM to directly calculate nutritional targets or energy expenditure creates significant risks of invalid recommendations, non-reproducible outputs, and untraceable errors.

## Decision Drivers

- **Accuracy & Reproducibility**: Nutritional math must produce identical, mathematically verifiable results for identical physical inputs.
- **Safety & Reliability**: Prevent LLM arithmetic hallucinations from distorting daily caloric or macronutrient goals.
- **System Resilience**: The core application (user management, target calculation, inventory tracking, meal logging) must function completely even if LLM APIs are offline or disabled.

## Considered Options

1. **End-to-End Prompting (Pure LLM)**: Pass raw user data to the LLM and let it calculate targets, expenditures, and recipe recommendations in a single prompt step.
2. **LLM with Code Interpreter Plugin**: Rely on runtime code evaluation inside the LLM prompt loop.
3. **Strict Decoupled Engine Architecture (Deterministic Core + Bounded Generative Layer)**: Implement all mathematical formulas, BMR/TDEE calculations, MET lookups, macro target distribution, remaining balance math, and inventory pre-filtering in pure Python code (`core/nutrition/`, `core/formulas/`). Use the LLM (`agent/`) strictly for natural language query intent routing and culinary recipe generation (`recipe_node`) bounded by deterministic input payloads.

## Decision Outcome

**Option 3: Strict Decoupled Engine Architecture**.

### Pipeline Boundary Flow

$$\text{User Input} \xrightarrow{\text{Deterministic Engine (Math, BMR, METs, Inventory)}} \text{Structured JSON Payload} \xrightarrow{\text{Generative Node (LLM Recipe)}} \text{Structured Recommendation}$$

### Execution Responsibilities

| Subsystem | Execution Layer | Key Responsibilities |
|---|---|---|
| **Deterministic Engine** | Pure Code (`core/nutrition/`, `core/formulas/`) | BMR (Mifflin-St Jeor), TDEE (PAL multipliers), Macro Target distribution (g/kg), MET-based activity expenditure, Consumed macro aggregation, Remaining balance math, Inventory expiration sorting & nutrient density pre-filtering. |
| **Generative Layer** | LLM Agent (`agent/orchestrator/`, `agent/nodes/`) | Query intent classification, Tool routing, Culinary recipe generation (`recipe_node`) using provided inventory ingredients to match deterministic remaining macro targets. |

## Consequences

### Positive
- 100% reproducible and unit-testable calculations.
- Eliminates arithmetic hallucinations in nutritional targets.
- The system remains fully operational via traditional REST APIs without requiring AI services.

### Negative
- Requires maintaining separate deterministic logic layers and JSON schemas for node payloads.
