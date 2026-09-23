/**
 * Nutrition & Unit Calculation Utilities.
 * Centralizes unit classification, serving size resolutions, and database row mapping
 * to eliminate code duplication across API services and UI components.
 */

import type { LoggedMealEntry } from '../types';

export const UNIT_BASED_KEYWORDS = [
  'unit',
  'unidad',
  'unidades',
  'porción',
  'porcion',
  'porcion',
  'pieza',
  'piezas',
  'lata',
  'latas',
  'envase',
];

/**
 * Determines whether a given unit string represents a discrete unit/portion rather than weight or volume.
 */
export function isUnitBased(unitName?: string): boolean {
  if (!unitName) return false;
  return UNIT_BASED_KEYWORDS.includes(unitName.trim().toLowerCase());
}

/**
 * Resolves base serving size for an item, defaulting to 1 for unit-based items and 100 for weight/volume.
 */
export function resolveServingSize(
  servingSize?: number | null,
  unitName?: string
): number {
  if (servingSize && servingSize > 0) {
    return servingSize;
  }
  return isUnitBased(unitName) ? 1 : 100;
}

/**
 * Maps a raw Supabase database row from 'meals' with nested 'meal_items' into a typed LoggedMealEntry entity.
 */
export function mapMealRowToLoggedMealEntry(row: any): LoggedMealEntry {
  return {
    id: row.id,
    user_id: row.user_id,
    meal_type: row.meal_type,
    name: row.name || undefined,
    logged_at: row.logged_at,
    total_calories_kcal: row.total_calories_kcal,
    total_protein_g: row.total_protein_g,
    total_carbs_g: row.total_carbs_g,
    total_fat_g: row.total_fat_g,
    notes: row.notes || undefined,
    items: (row.meal_items || []).map((mi: any) => ({
      id: mi.id,
      meal_id: mi.meal_id,
      food_item_id: mi.food_item_id,
      name: mi.food_items?.name || 'Ingrediente',
      quantity: mi.quantity,
      unit: mi.unit,
      calories_kcal: mi.calories_kcal,
      protein_g: mi.protein_g,
      carbohydrates_g: mi.carbohydrates_g,
      fat_g: mi.fat_g,
    })),
  };
}
