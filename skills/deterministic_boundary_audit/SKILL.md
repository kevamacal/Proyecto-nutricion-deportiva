# Skill: Deterministic Boundary Audit

## Purpose
Verify that no LLM (agent, LangGraph node, or call to the Claude/OpenAI API) participates in calculating BMR, TDEE, macronutrients, or MET-based energy expenditure. All of that logic must live in 100% deterministic Python code. This skill exists because rule 2.3 in `AGENTS.md` is an instruction, not a verification mechanism — this skill is the mechanism.

## When to trigger
- Before opening a PR that touches `src/backend/domain/` (or the equivalent nutrition/sports formulas module).
- Before opening a PR that touches any LangGraph node (`nutrition_node`, `basketball_node`, `strength_node`, `recipe_node`, `inventory_node`).
- When an agent adds or modifies a system prompt for a node.
- As part of the CI quality gate, on every PR (not just on demand).

## Audit checklist

1. **Grep for LLM client calls inside calculation modules.**
   - Search for imports of LLM clients (`anthropic`, `openai`, HTTP clients to model endpoints) inside any file under the domain/formulas package (e.g. `domain/`, `formulas/`, `calculations/`).
   - If any is found: **automatic failure**. No calculation file should import a model client.

2. **Verify the direction of data flow in LangGraph nodes.**
   - Every calculation-adjacent node (`nutrition_node`, `basketball_node`, `strength_node`) must receive an already-calculated object as input (a Pydantic model with the numbers already resolved), and its only job should be formatting/explaining in natural language or routing — never deriving the number.
   - Check the node's input signature: if the node receives "raw" data (weight, height, age, activity level) instead of "resolved" data (TDEE already computed, macros already computed), that's a red flag that the calculation may be delegated to the LLM inside the node.

3. **Review each node's system prompt.**
   - No system prompt should ask the model to "calculate", "estimate", or "adjust" a numeric value for calories, macros, or energy expenditure.
   - Prompts may ask the model to *use* an already-given number (e.g. "the user has a 350 kcal deficit, recommend a recipe that fits this") but never to derive it.

4. **Automated regression test (recommended in CI).**
   - A test that calls domain functions (`calculate_bmr`, `calculate_tdee`, `calculate_macros`, `calculate_met_expenditure`) with fixed inputs and verifies the result is bit-for-bit deterministic across multiple runs (same input → same output, no network calls).
   - Can be reinforced by mocking the LLM client in these tests: if a domain function invokes the mock during execution, the test fails.

5. **Traceability in the PR.**
   - The PR description should explicitly state: "This change does not introduce LLM calls in the calculation path" (or justify why it doesn't apply).

## Red flags
- A node that "explains" a result but whose prompt includes instructions like "recalculate if the number doesn't look right."
- Domain functions that accept an `llm_client` parameter or similar.
- Domain tests that use `vcr`/`responses`/network mocks — if a test for a math function needs to mock an HTTP call, something is misplaced.

## Suggested automation (CI)
```bash
# Fails if an LLM client import is detected inside the domain package
grep -rlE "import (anthropic|openai)" src/backend/domain/ && exit 1 || exit 0
```
Add this as an extra step in `.github/workflows/ci.yml`, alongside ruff/mypy/pytest.