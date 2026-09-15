# Skill: Node Contract Compatibility Check

## Purpose
Prevent an agent from unknowingly breaking the input/output contract of a LangGraph node (`nutrition_node`, `inventory_node`, `basketball_node`, `strength_node`, `recipe_node`) documented in `docs/architecture/03_node_contracts.md`. Especially important when multiple agents work in parallel on different nodes that communicate with each other.

## When to trigger
- Before modifying the signature (input/output schema) of any node in the graph.
- Before modifying the orchestrator (LangGraph graph definition) that connects the nodes.
- When reviewing a PR that touches any file inside the nodes package.

## Audit checklist

1. **Compare the current schema against the documented one.**
   - Open `docs/architecture/03_node_contracts.md` and compare, field by field, the modified node's Pydantic input/output model against what's documented.
   - Any field added, removed, renamed, or with a changed type is a potential *breaking change*.

2. **Classify the change.**
   - **Additive (safe):** adding an optional field with a default value. Doesn't break existing consumers of the node.
   - **Breaking (requires coordination):** removing a field, changing its type, making a previously optional field required, or renaming it.
   - If breaking, the PR must:
     - Update `03_node_contracts.md` in the same PR.
     - Explicitly list which other nodes/consumers of the contract are affected (search the graph for which node produces or consumes that schema).

3. **Verify actual consumers, not just the modified node.**
   - For example, if `nutrition_node`'s contract changes (goal, intake, remaining balance), check whether `recipe_node` (which is documented as depending on "needs + ingredients") consumes any of those fields directly or via shared graph state.

4. **Contract tests.**
   - Every node should have a test that validates its output against the documented Pydantic schema, independent of the node's internal logic tests. This catches drift between what the node actually returns and what the contract says.
   - Recommended: a lightweight integration test that runs the full graph (or the relevant subgraph) with a sample input and verifies the final state has the expected shape.

5. **Contract versioning (optional but recommended as the project grows).**
   - If the project starts having multiple clients or parallel graph versions, consider versioning contract schemas (`NutritionNodeOutputV1`, `V2`) instead of mutating the existing one.

## Red flags
- A PR that modifies a node's Pydantic model without touching `docs/architecture/03_node_contracts.md`.
- "Silent" type changes (e.g. a field going from `float` to `Optional[float]` without the consumer handling `None`).
- Nodes accessing shared LangGraph state keys via loose strings (`state["balance"]`) instead of through the typed Pydantic model — this hides any contract change until it fails at runtime.

## Suggested automation
A "contract snapshot" test: serialize the JSON schema of each node's Pydantic model and compare it against a version saved in the repo; if it differs, CI requires an explicit confirmation (update the snapshot + the contracts document in the same commit).