# Developer Skill Boilerplate: [Skill Name]

> **Skill Identifier**: `developer-skill-boilerplate`  
> **Target Role**: [Lead Orchestrator / Backend & RLS / Sports Nutrition / Frontend / QA]

## 1. Skill Purpose

Briefly state the goal of this developer skill and when coding agents should invoke it.

## 2. Context & Input Parameters

List required context files, environment configurations, and parameters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `task_description` | `string` | Yes | High-level summary of developer task |
| `target_files` | `list[string]` | Yes | List of absolute file paths to modify/create |

## 3. Step-by-Step Execution Protocol

1. **Step 1 - Inspection**: View target files and verify existing code structures.
2. **Step 2 - Implementation**: Apply changes following project standards (Python 3.14, Pydantic v2, SQLModel).
3. **Step 3 - Verification**: Run automated tests (`pytest`) and linters (`ruff check .`).

## 4. Verification & Output Checklist

- [ ] All code changes pass `ruff` formatting and `mypy` static type checks.
- [ ] New database migrations include `ENABLE ROW LEVEL SECURITY` and RLS policies.
- [ ] No arithmetic calculations performed inside LLM prompts; all math uses Python engine functions.
- [ ] Commit created using Conventional Commits in English.
