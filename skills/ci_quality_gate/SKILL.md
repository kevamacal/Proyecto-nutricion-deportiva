# Skill: CI Quality Gate Audit

## Purpose
Ensure that all code introduced in feature branches passes mandatory static analysis, type safety, automated tests, security checks, and deterministic boundaries before a Pull Request is opened or approved. This skill enforces Section 4.1 of `AGENTS.md`.

## When to Trigger
- Before creating or updating any Pull Request.
- Before committing changes on any feature or fix branch.
- As part of automated GitHub Actions CI (`.github/workflows/ci.yml`).

## Quality Gate Checklist

1. **Linting & Code Formatting**:
   - Run `ruff check .` (Exit Code 0).
   - Run `ruff format --check .` (Exit Code 0).

2. **Static Type Checking**:
   - Run `mypy src/backend` (Exit Code 0).
   - Ensure strict Pydantic v2 type annotations across domain models and API endpoints.

3. **Automated Unit & Integration Tests**:
   - Run `pytest` (Exit Code 0).
   - Verify all domain calculations, API routes, and RLS policies have passing test coverage.

4. **Dependency & Vulnerability Audit**:
   - Run `pip-audit` or `safety check` (Exit Code 0).
   - Ensure zero dependencies with known High or Critical CVEs are committed to lockfiles.

5. **Deterministic Boundary Check**:
   - Ensure no LLM client calls exist inside calculation paths:
     ```bash
     grep -rlE "import (anthropic|openai)" src/backend/domain/ && exit 1 || exit 0
     ```

## Red Flags
- Opening a PR without running and passing all 5 checks.
- Bypassing linting or type checking with `# type: ignore` or `# noqa` without explicit written justification in an ADR.
