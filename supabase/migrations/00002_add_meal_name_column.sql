-- Migration: 00002_add_meal_name_column.sql
-- Description: Adds optional name column to meals table for custom meal titles.

ALTER TABLE meals ADD COLUMN IF NOT EXISTS name VARCHAR(255);
