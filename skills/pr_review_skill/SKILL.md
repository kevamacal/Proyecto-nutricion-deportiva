# Skill: PR Review Agent

## Purpose
Give the "Code Review Agent" (not yet an explicit separate role from the QA Specialist in `AGENTS.md`) its own actionable checklist for reviewing a full PR before it's ready for human review. Unlike QA (2.5), which writes tests, this role *reads* the diff the way a senior human reviewer would.

## When to trigger
- Automatically when a PR is opened or updated (via a GitHub Action calling the API with the diff).
- Ideally using a different model/prompt than the one that generated the code, to avoid the reviewer being lenient toward its own reasoning patterns.

## Review checklist

### 1. Alignment with the issue
- Does the PR resolve exactly what the referenced issue (`Closes #<id>`) asks for? Flag scope creep (unrequested changes) or incomplete functionality.

### 2. Project-specific domain rules
- Does the PR respect the deterministic boundary (see `deterministic_boundary_audit_skill.md`)? Any BMR/TDEE/macro/MET calculation must be in pure Python.
- If the PR touches `supabase/migrations/`, does it pass the RLS audit (see `rls_migration_audit_skill.md`)?
- If the PR touches a LangGraph node, is the input/output contract still compatible with `03_node_contracts.md` (see `node_contract_compatibility_skill.md`)?

### 3. General code quality
- Clear naming, single-responsibility functions, no dead or commented-out code.
- Explicit error handling (no silent `except Exception: pass`).
- No hardcoded secrets or keys — everything via environment variables.

### 4. Tests
- Are there new tests covering the added functionality, not just the happy path?
- For endpoints with RLS: is there a test with two distinct users verifying isolation?
- For LangGraph nodes: is there at least one contract test on the output?

### 5. Consistency with the rest of the repo
- Does the PR reinvent a utility/function that already exists elsewhere? (more common between different agents working in parallel without full repo visibility)
- Does it follow the commit and branch naming conventions defined in section 3 of `AGENTS.md`?

### 6. PR size and atomicity
- If the PR touches more than ~400 lines or mixes unrelated components (backend + frontend + migrations at once without need), suggest splitting it into smaller PRs before approving the review.

## Expected output format from the reviewer agent
An automated PR comment with this structure:

```
## Change summary
[1-2 sentences on what the PR does]

## Blocking findings
- [ ] ...

## Non-blocking findings (suggestions)
- ...

## Project rules checklist
- [ ] Deterministic boundary respected
- [ ] RLS verified (if applicable)
- [ ] Node contracts compatible (if applicable)
- [ ] Tests cover the new case
```

## Important red flag
If the reviewer agent is the same model/config that generated the PR's code, treat its approval with extra skepticism — explicitly require a final human review before merging, even if the reviewer agent flagged no blockers.