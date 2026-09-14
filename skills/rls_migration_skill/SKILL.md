# Skill: RLS Migration Audit

## Purpose
Ensure that no new table under `supabase/migrations/` is left accessible without Row Level Security, and that the policies actually isolate one user's data from another's (not just that they "exist"). Directly related to the "Database Migrations and RLS Policies" issue.

## When to trigger
- On any PR that adds or modifies a file under `supabase/migrations/`.
- Before closing the migrations/RLS issue.
- As part of the CI quality gate.

## Audit checklist

1. **Every new table has RLS enabled.**
   - For every `CREATE TABLE` in the migration, there must be an `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` in the same file (or immediately after it).
   - No exceptions, even for tables "only read by the backend with service role" — missing RLS is the single most common cause of data leaks on Supabase.

2. **The 4 minimum policies exist for tables holding user data.**
   - `SELECT`, `INSERT`, `UPDATE`, `DELETE` — each with an explicit condition (typically `auth.uid() = user_id` or an equivalent via `owner_id`/`athlete_id`).
   - If a table is publicly read-only (e.g. a base food/recipe catalog), explicitly document why it doesn't need a write policy for regular users.

3. **Policies reference the correct ownership column.**
   - Verify that the column referenced in the policy (`user_id`, `athlete_id`, etc.) is the same one the rest of the domain uses to identify the record's owner — a common bug is a policy pointing to the wrong column that "works" only because manual testing used a single user.

4. **Related tables (foreign keys) don't leave gaps.**
   - If `meal_log` has RLS by `user_id` but `meal_log_items` (child of `meal_log`) has no policy of its own and only relies on the join, verify it actually inherits isolation (Postgres RLS is not automatic via FK — each table needs its own policy or one that references the parent table).

5. **Automated policy tests (mandatory, not optional).**
   - For each table with RLS: a test that creates two distinct users (via a Supabase test client with different JWTs, not the service role) and verifies:
     - User A cannot `SELECT` rows belonging to user B.
     - User A cannot `UPDATE`/`DELETE` rows belonging to user B.
     - User A can `SELECT`/`UPDATE`/`DELETE` their own rows.
   - These tests must run against a real (or local) Postgres instance with RLS active, not mocks — RLS is database logic, not application logic.

6. **The service role is not the default in the backend.**
   - Verify that FastAPI routes serving end users use the Supabase client with the user's JWT (so RLS applies), and not the `service_role_key`, which bypasses RLS entirely. The service role should be reserved for admin tasks/migrations, never for serving user requests.

## Red flags
- A migration with `CREATE TABLE` but no `ENABLE ROW LEVEL SECURITY` in the same PR.
- Policies with `USING (true)` on tables containing user data (equivalent to having no RLS at all).
- FastAPI endpoints instantiating the Supabase client with the service role key for normal user operations.
- RLS tests that only check "the policy exists" (via `pg_policies` introspection) without testing actual behavior with two distinct users.

## Suggested automation (CI)
A script that parses each new migration and fails if it detects a `CREATE TABLE` without a matching `ENABLE ROW LEVEL SECURITY` for the same table in the PR diff.