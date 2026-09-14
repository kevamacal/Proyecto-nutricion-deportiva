# Developer Skills Framework (`skills/`)

This directory contains specialized developer skills used by AI coding agents when working on the **Sports Nutrition & Athletic Performance Platform**.

## Active Developer Skills Index

| Skill Name | Location | Target Role | Description |
|---|---|---|---|
| **ADR Maintenance** | [`skills/adr_maintenance/SKILL.md`](./adr_maintenance/SKILL.md) | Lead Orchestrator | Rules for writing and updating Architectural Decision Records during feature development. |
| **CI Quality Gate** | [`skills/ci_quality_gate/SKILL.md`](./ci_quality_gate/SKILL.md) | QA & Testing Specialist | Verification protocol for linting (`ruff`), typing (`mypy`), tests (`pytest`), and security audits. |
| **Deterministic Boundary Audit** | [`skills/deterministic_boundary_audit/SKILL.md`](./deterministic_boundary_audit/SKILL.md) | Sports Nutrition Specialist | Audit procedure ensuring zero LLM math calculations inside Python backend formulas. |
| **Node Contract Compatibility** | [`skills/node_contract_compatibility/SKILL.md`](./node_contract_compatibility/SKILL.md) | Lead Orchestrator / Backend | Schema compatibility check for LangGraph node Pydantic inputs and outputs (`03_node_contracts.md`). |
| **PR Review Agent** | [`skills/pr_review_skill/SKILL.md`](./pr_review_skill/SKILL.md) | Code Review Agent | Independent PR code review checklist auditing security, RLS, readability, and test coverage. |
| **RLS Migration Audit** | [`skills/rls_migration_skill/SKILL.md`](./rls_migration_skill/SKILL.md) | Backend & RLS Specialist | Supabase database migration audit ensuring `ENABLE ROW LEVEL SECURITY` and multi-user isolation tests. |
| **Sports Nutrition Domain Math** | [`skills/sports_nutrition_domain_skill.md`](./sports_nutrition_domain_skill.md) | Sports Nutrition Specialist | Physiological math reference (Mifflin-St Jeor, TDEE multipliers, Basketball/Gym METs, Recovery). |
| **Sports Nutrition UI Direction** | [`skills/sports_nutrition_ui_direction/SKILL.MD`](./sports_nutrition_ui_direction/SKILL.MD) | Frontend & UI Specialist | Scoreboard & Nutrition Label design tokens, color palette (`#171511`, `#2A2118`, `#C1622B`), and ledger layouts. |

## Execution Rule for Developer Agents

Before executing any multi-step task, developer agents MUST identify and load the relevant skill from this index to ensure strict compliance with project architecture and domain standards.
