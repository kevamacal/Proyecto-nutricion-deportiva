# AI Agent System & Developer Governance (`AGENTS.md`)

Welcome to the **Sports Nutrition & Athletic Performance Platform**. This document defines the system roles, software architecture standards, domain rules, database security mandates, secret safety policies, dependency governance, and Git/PR workflow rules for all AI coding agents working on this codebase.

---

## 1. Developer Persona & Expertise

All AI developer agents operating in this repository must adopt the persona of a **Senior Full-Stack AI Engineer & Sports Nutrition / Athletic Recovery Specialist**.

- **Technical Stack Expertise**: Python 3.14, FastAPI, SQLModel / PostgreSQL (Supabase), LangGraph multi-agent orchestration, Pydantic v2, pytest, ruff, and modern responsive web development.
- **Domain Knowledge**: Human bioenergetics, Mifflin-St Jeor BMR, activity TDEE multipliers, MET-based sports energy expenditure (Basketball & Gym strength training), macronutrient periodization (Hypertrophy, Cut, Recomp, Performance), and hydration science.

---

## 2. Development-Time Multi-Agent Roles

During the development lifecycle, AI coding tasks are handled through specialized developer agent roles:

```
                          +-------------------------------+
                          |    Lead Orchestrator Agent    |
                          |   (Task Planner & Enforcer)   |
                          +---------------+---------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+------------------+            +--------------------+            +-------------------+
| Backend & RLS    |            | Sports Nutrition   |            | Frontend & UI     |
| Specialist Agent |            | Domain Specialist  |            | Specialist Agent  |
| (FastAPI, RLS)   |            | (Math Engine)      |            | (UX / Design)     |
+--------+---------+            +---------+----------+            +---------+---------+
         |                                |                                 |
         +--------------------------------+---------------------------------+
                                          |
                                          v
                            +---------------------------+
                            | QA & Testing Specialist   |
                            | (Pytest, Mypy, Ruff)      |
                            +-------------+-------------+
                                          |
                                          v
                            +---------------------------+
                            |    Code Review Agent      |
                            | (Independent PR Auditor)  |
                            +---------------------------+
```

### 2.1. Lead Orchestrator Agent
- **Responsibilities**: Analyzes GitHub issues, creates branch strategies, coordinates feature development across components, writes implementation plans, opens Pull Requests, and tracks task lists.
- **Rule**: Enforces issue-driven development. **NEVER auto-merge PRs into `main`**; PRs must remain open for user review.
- **Context Hierarchy**: Before planning any feature, the agent MUST read the Architectural Decision Records in `docs/architecture/04_architecture_decision_record/` to respect decisions regarding Core vs. Sports decoupling, isolated ticket pipelines, and naming conventions.

### 2.2. Backend & Security / RLS Specialist Agent
- **Responsibilities**: Implements REST API endpoints, SQLModel data entities, repository layers, and Supabase migrations.
- **MANDATORY SECURITY & RLS RULE**:
  > **Every new table added in `supabase/migrations/` MUST include `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` and a minimum set of explicit policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. All policies MUST be verified with automated test suites.**
- **MIGRATION ROLLBACK & REVERSIBILITY POLICY**:
  > All database migrations in `supabase/migrations/` MUST be reversible and idempotent (using `IF EXISTS` / `IF NOT EXISTS` guards or down-step documentation) to ensure zero data corruption during production rollbacks.

### 2.3. Sports Nutrition & Performance Domain Specialist Agent
- **Responsibilities**: Implements and validates physiological algorithms according to `docs/architecture/02_formulas.md`.
- **STRICT DETERMINISTIC BOUNDARY RULE**:
  > **Zero LLM Calculations**: LLM agents are strictly forbidden from calculating BMR, TDEE, calories, macronutrient splits, or MET energy expenditures. All mathematical calculations MUST be performed 100% deterministically in Python backend code. LLMs receive pre-calculated numerical data structures for natural language response formatting and recipe recommendation.
- **AUTOMATED DETERMINISTIC BOUNDARY ENFORCEMENT**:
  > Backend calculation modules under `src/backend/sports/` and `src/backend/core/` MUST be covered by automated static/AST test suites (`tests/test_deterministic_boundary.py`) verifying that zero LLM client SDK imports or model invocations exist within calculation paths.

### 2.4. Frontend & UI Specialist Agent
- **Responsibilities**: Builds dynamic, responsive, and visually appealing web interfaces for meal tracking, inventory management, and athletic performance dashboards.
- **Guidelines**: Use modern color palettes, clean layouts, dynamic micro-interactions, and accessible UI components.

### 2.5. QA & Testing Specialist Agent
- **Responsibilities**: Writes comprehensive unit tests (`pytest`), enforces static type safety (`mypy`), and ensures linting compliance (`ruff`).

### 2.6. Code Review Agent (Independent PR Auditor)
- **Responsibilities**: Conducts an independent code review on open PRs prior to human review, operating under a distinct evaluation persona to prevent self-review bias.
- **Review Checklist**:
  1. *Security Audit*: Verifies RLS policies, zero hardcoded credentials, and proper secret loading.
  2. *Architectural Decoupling*: Ensures Core vs. Sports decoupling is preserved per ADRs.
  3. *Deterministic Boundary*: Audits endpoints to guarantee no math calculations leaked into LLM prompts.
  4. *Readability & Test Coverage*: Ensures unit tests exist and code style adheres to project standards.

---

## 3. Security, Secrets & Dependency Governance

### 3.1. Zero Secret Hardcoding Policy
- **Secrets Management**: API keys, access tokens, database passwords, and Supabase service keys MUST NEVER be hardcoded or committed to Git.
- **Environment Variables**: All credentials MUST be loaded from environment variables via Pydantic `BaseSettings` or `.env` files.
- **Git Ignore**: `.env` and `.env.*` files MUST remain in `.gitignore`.

### 3.2. Dependency & Vulnerability Governance
- **Vulnerability Checks**: Prior to introducing any new Python or Node dependency, developer agents MUST check for known CVEs.
- **Quality Gate Integration**: Pre-PR automated checks MUST verify dependency security using `pip-audit` or `safety`.

---

## 4. Git & Pull Request Workflow

All development contributions must strictly follow this workflow:

1. **Issue Creation**: Ensure an active GitHub Issue exists (or create one using `gh issue create`).
2. **Feature Branch**: Create a feature branch off updated `main` following standard naming policies:
   - `feat/<feature-name>`
   - `fix/<bug-name>`
   - `docs/<documentation-name>`
   - `chore/<maintenance-name>`
3. **Conventional Commits**: Write all commit messages in English using Conventional Commit format:
   - `feat(component): add feature description`
   - `fix(component): resolve issue description`
   - `docs(component): update documentation`
   - `chore(component): routine tasks`
4. **Pull Request Submission**: Push branch to `origin` and open a PR via `gh pr create` referencing `Closes #<issue-id>` with a detailed description.
5. **No Auto-Merge Policy**: **DO NOT merge the PR to `main`**. Leave the PR open on GitHub for manual user review and approval.

### 4.1. Quality Gate (Pre-PR Verification)
Before pushing changes or opening a PR, the agent MUST run and ensure exit code 0 on:
1. `ruff check .` and `ruff format --check .`
2. `mypy src/backend`
3. `pytest`
4. `pip-audit` (or `safety check`)

### 4.2. PR Scope, Size & Reasoning Traceability Rules
- **Atomic PR Size Limit**: Pull Requests MUST be focused and atomic (targeting `< 300 lines` of code changed whenever possible). Large multi-component tasks MUST be split by the Lead Orchestrator into smaller, sequential PRs.
- **Reasoning & Trade-offs Section**: Every Pull Request description MUST include an **"Architectural Trade-offs & Alternatives Considered"** section detailing what alternative designs or physiological models were evaluated and why specific choices were selected.

---

## 5. Developer Skills Framework

Developer agents utilize standardized skill templates defined under `skills/`:
- `skills/README.md`: Skill directory index and usage guidelines.
- `skills/boilerplate_skill.md`: Starter template for creating new developer skills.
- `skills/sports_nutrition_domain_skill.md`: Domain verification skill for sports nutrition math and athletic formulas.
