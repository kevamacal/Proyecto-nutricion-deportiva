-- Migration: 00003_create_hydration_logs_table.sql
-- Description: Table for tracking daily water intake logs with Row Level Security (RLS) policies.

CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Users can read own hydration logs"
    ON hydration_logs FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own hydration logs"
    ON hydration_logs FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own hydration logs"
    ON hydration_logs FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own hydration logs"
    ON hydration_logs FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON hydration_logs(user_id, logged_at DESC);
