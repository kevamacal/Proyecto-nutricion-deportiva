# Skill: ADR Maintenance

## Purpose
Ensure Architectural Decision Records (`docs/architecture/04_architecture_decision_record/`) are kept as a living source of truth, not just as required reading before planning (already mandated by `AGENTS.md` section 2.1). This skill covers the *writing* side: when an agent should create or update an ADR.

## When to trigger
- Before planning any feature (reading — already covered by AGENTS.md 2.1).
- **When making a new architectural decision** during development (this is the missing piece):
  - Choosing between two implementation approaches with meaningful trade-offs (e.g. "does `recipe_node` filter by inventory before or after applying the calorie goal").
  - Changing a decision previously documented in an existing ADR.
  - Introducing a significant new dependency (library, external service) that constrains the design.
  - Deciding how two components are decoupled (e.g. Core vs. Sports, as already referenced in `AGENTS.md`).

## Checklist when an architectural decision is detected

1. **Does an ADR already cover this decision?**
   - If yes, and the new decision contradicts it: don't edit the old ADR in place — create a new one that marks the old as "Superseded by ADR-XXX" (standard ADR practice).
   - If not: create a new one with sequential numbering.

2. **Minimum ADR format:**
   ```
   # ADR-XXX: <Short decision title>

   ## Status
   Accepted / Proposed / Superseded by ADR-YYY

   ## Context
   What problem or choice was on the table?

   ## Decision
   What was decided, in one clear sentence?

   ## Alternatives considered
   - Option A: why it was rejected
   - Option B: why it was rejected

   ## Consequences
   What this decision implies going forward (positive and negative)
   ```

3. **The PR that introduces the decision must include the ADR in the same commit/PR**, not as a separate "later" task — if separated, it almost never gets done.

4. **Reference the ADR from the PR and from the code where relevant** (a short comment like `# see ADR-012` at the point in the code where the decision is relevant and non-obvious).

## Red flags
- A PR that introduces a significant approach change (e.g. changing how two graph nodes communicate) without an associated ADR.
- ADRs that document the decision but not the rejected alternatives — without that, a future agent can't tell whether an idea it's about to propose was already evaluated and discarded.
- Contradictory ADRs with no "supersedes" relationship between them, which confuses agents reading them as context before planning.

## Why this matters especially with parallel agents
With multiple agents generating code in the same repo, it's easy for two different agents to make incompatible design decisions for the same problem at different times, simply because neither left a written record. The ADR is the shared memory between agents that don't share conversational context with each other.