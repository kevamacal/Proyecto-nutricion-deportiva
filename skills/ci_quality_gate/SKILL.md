# Skill: CI Quality Gate

## Purpose
Define and maintain the CI workflow (`.github/workflows/ci.yml`) that blocks merges to `main` if code fails typing, lint, tests, or a basic vulnerable-dependency check. Directly covers the "ci: initial workflow" issue.

## When to trigger
- When creating or modifying `.github/workflows/ci.yml`.
- On every push to a branch with an open PR against `main`.
- When adding a new dependency to the project (`pyproject.toml` / `requirements.txt`).

## Minimum workflow content checklist

1. **Lint and formatting:**
   - `ruff check .`
   - `ruff format --check .`

2. **Static typing:**
   - `mypy src/backend` (or the actual backend package path).

3. **Tests:**
   - `pytest` with coverage output (`pytest --cov=src/backend --cov-report=term-missing`), even without enforcing a minimum threshold yet.

4. **Dependency audit (recommended addition, not in the original AGENTS.md):**
   - `pip-audit` (or `safety check`) over resolved dependencies, to catch known CVEs before merging.
   - Run this on every PR that modifies `pyproject.toml`/`requirements.txt`, and optionally on a weekly cron to catch new CVEs in existing dependencies.

5. **Deterministic boundary and RLS audits (integrate with the other skills):**
   - Include as steps in the same workflow the checks described in `deterministic_boundary_audit_skill.md` and `rls_migration_audit_skill.md`, so they don't depend on an agent remembering to run them manually.

6. **Every step must return exit code 0 for the PR to be considered "green".**
   - No step should be marked `continue-on-error: true` unless it's explicitly informational (e.g. a coverage report that doesn't block).

## Suggested workflow structure

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.14"
      - name: Install dependencies
        run: pip install -e ".[dev]"
      - name: Lint (ruff)
        run: ruff check .
      - name: Format check (ruff)
        run: ruff format --check .
      - name: Type check (mypy)
        run: mypy src/backend
      - name: Tests (pytest)
        run: pytest --cov=src/backend --cov-report=term-missing
      - name: Dependency audit
        run: pip-audit
      - name: Deterministic boundary audit
        run: grep -rlE "import (anthropic|openai)" src/backend/domain/ && exit 1 || exit 0
```

## Red flags
- A workflow that only runs on `push` to `main` and not on `pull_request` (lets broken code reach review without prior feedback).
- Steps with `continue-on-error: true` on lint/typing/tests (turns the gate decorative).
- No dependency caching (`actions/setup-python` with `cache: pip`) — not a quality risk per se, but it significantly slows down agent iteration if CI takes too long.

## Note on agents working locally
If your agents run these same checks locally before pushing (as section 3.1 of `AGENTS.md` requires), the CI on GitHub Actions should be treated as the final source of truth, not an optional repeat — an agent might report "tests passing" locally due to a drifted environment (different library version, unset environment variable) that fails in CI.