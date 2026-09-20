/**
 * Direct Supabase API Client Service.
 * Handles all database CRUD operations (Profiles, Food Catalog, Pantry Inventory, Meal Logs)
 * directly from the frontend using the Singleton Supabase client.
 */

import { supabase } from '../lib/supabase';
import type { PantryItem } from '../types';

export interface CatalogFoodItem {
  id?: string;
  food_item_id: string;
  name: string;
  category: string;
  default_unit: string;
  is_custom: boolean;
  nutrition?: {
    serving_size: number;
    calories_kcal: number;
    protein_g: number;
    carbohydrates_g: number;
    fat_g: number;
  };
}

export interface SupabaseUserProfile {
  id?: string;
  user_id: string;
  email?: string;
  name?: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender?: string;
  activity_level?: string;
  body_composition_goal?: string;
  nutritional_goal?: string;
  daily_calories_target: number;
  daily_protein_g_target: number;
  daily_carbs_g_target: number;
  daily_fat_g_target: number;
  bmr_kcal?: number;
  base_tdee_kcal?: number;
  updated_at?: string;
}

export interface AddPantryItemPayload {
  user_id: string;
  food_item_id: string;
  quantity: number;
  unit: string;
  expiration_date?: string | null;
}

export interface LogMealPayload {
  user_id: string;
  meal_type: string;
  total_calories_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string;
  items?: Array<{
    food_item_id: string;
    quantity: number;
    unit: string;
    calories_kcal: number;
    protein_g: number;
    carbohydrates_g: number;
    fat_g: number;
  }>;
}

// ============================================================================
// 1. NUTRITIONAL PROFILES (User Profile & Targets)
// ============================================================================

/**
 * Fetch a user's nutritional profile and targets from Supabase.
 */
export async function fetchUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
  const { data, error } = await supabase
    .from('nutritional_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile from Supabase:', error.message);
    throw error;
  }
  return data;
}

/**
 * Save or update a user's nutritional profile and targets in Supabase.
 */
export async function saveUserProfile(profile: SupabaseUserProfile): Promise<SupabaseUserProfile> {
  const { data, error } = await supabase
    .from('nutritional_profiles')
    .upsert(
      {
        user_id: profile.user_id,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        age: profile.age,
        activity_level: profile.activity_level || 'ACTIVE',
        body_composition_goal: profile.body_composition_goal || 'BULK',
        nutritional_goal: profile.nutritional_goal || 'PERFORMANCE',
        daily_calories_target: profile.daily_calories_target,
        daily_protein_g_target: profile.daily_protein_g_target,
        daily_carbs_g_target: profile.daily_carbs_g_target,
        daily_fat_g_target: profile.daily_fat_g_target,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving user profile to Supabase:', error.message);
    throw error;
  }
  return data;
}

/**
 * Update partial fields of a user's nutritional profile in Supabase.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<SupabaseUserProfile>
): Promise<SupabaseUserProfile | null> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Only copy defined values
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'user_id' && key !== 'id') {
      payload[key] = value;
    }
  });

  const { data, error } = await supabase
    .from('nutritional_profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user profile in Supabase:', error.message);
    throw error;
  }
  return data;
}


/**
 * Ensures a user's nutritional profile row exists in Supabase.
 * Creates an initial default profile if none exists yet.
 */
export async function ensureUserProfileExists(
  userId: string,
  _email?: string,
  _name?: string
): Promise<SupabaseUserProfile | null> {
  try {
    const existing = await fetchUserProfile(userId);
    if (existing) return existing;

    // Create default initial profile for new auth user
    return await saveUserProfile({
      user_id: userId,
      weight_kg: 70,
      height_cm: 175,
      age: 25,
      activity_level: 'ACTIVE',
      body_composition_goal: 'BULK',
      nutritional_goal: 'PERFORMANCE',
      daily_calories_target: 2500,
      daily_protein_g_target: 160,
      daily_carbs_g_target: 280,
      daily_fat_g_target: 70,
    });
  } catch (err) {
    console.warn('Could not ensure user profile exists in Supabase:', err);
    return null;
  }
}


// ============================================================================
// 2. FOOD CATALOG & NUTRITIONAL INFO
// ============================================================================

/**
 * Fetch global food catalog with nutritional information per serving.
 */
export async function fetchFoodCatalog(): Promise<CatalogFoodItem[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, nutritional_information(*)');

  if (error) {
    console.error('Error fetching food catalog from Supabase:', error.message);
    throw error;
  }

  return (data || []).map((item: any) => {
    const nutr = Array.isArray(item.nutritional_information)
      ? item.nutritional_information[0]
      : item.nutritional_information;

    return {
      id: item.id,
      food_item_id: item.id,
      name: item.name,
      category: item.category,
      default_unit: item.default_unit || 'g',
      is_custom: item.is_custom || false,
      nutrition: {
        serving_size: nutr?.serving_size || 100,
        calories_kcal: nutr?.calories_kcal || 0,
        protein_g: nutr?.protein_g || 0,
        carbohydrates_g: nutr?.carbohydrates_g || 0,
        fat_g: nutr?.fat_g || 0,
      },
    };
  });
}

// ============================================================================
// 3. PANTRY INVENTORY MANAGEMENT
// ============================================================================

/**
 * Fetch a user's current pantry stock with nested food item details.
 */
export async function fetchPantryInventory(userId: string): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, food_items(*, nutritional_information(*))')
    .eq('user_id', userId)
    .eq('status', 'AVAILABLE');

  if (error) {
    console.error('Error fetching pantry inventory from Supabase:', error.message);
    throw error;
  }

  return (data || []).map((row: any) => {
    const food = row.food_items;
    const nutr = Array.isArray(food?.nutritional_information)
      ? food.nutritional_information[0]
      : food?.nutritional_information;

    const protein = nutr?.protein_g || 0;
    const carbs = nutr?.carbohydrates_g || 0;
    let densityClass: PantryItem['density_class'] = 'BALANCED';
    if (protein > 15) densityClass = 'PROTEIN_DENSE';
    else if (carbs > 20) densityClass = 'CARB_DENSE';

    return {
      inventory_item_id: row.id,
      food_item_id: row.food_item_id,
      name: food?.name || 'Alimento',
      category: food?.category || 'General',
      available_quantity: row.quantity,
      unit: row.unit || 'g',
      expiration_date: row.expiration_date || null,
      days_until_expiration: null,
      status: row.status || 'AVAILABLE',
      density_class: densityClass,
      nutrition: nutr
        ? {
          serving_size: nutr.serving_size || 100,
          calories_kcal: nutr.calories_kcal || 0,
          protein_g: nutr.protein_g || 0,
          carbohydrates_g: nutr.carbohydrates_g || 0,
          fat_g: nutr.fat_g || 0,
        }
        : undefined,
    };
  });
}

/**
 * Add a new item to the user's pantry inventory in Supabase.
 */
export async function addPantryItem(payload: AddPantryItemPayload): Promise<any> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([
      {
        user_id: payload.user_id,
        food_item_id: payload.food_item_id,
        quantity: payload.quantity,
        unit: payload.unit,
        expiration_date: payload.expiration_date || null,
        status: 'AVAILABLE',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding pantry item to Supabase:', error.message);
    throw error;
  }
  return data;
}

/**
 * Delete an item from the user's pantry inventory in Supabase.
 */
export async function deletePantryItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting pantry item from Supabase:', error.message);
    throw error;
  }
}

// ============================================================================
// 4. MEAL LOGS & DAILY SUMMARY
// ============================================================================

/**
 * Fetch accumulated macro totals logged by a user for a given date.
 */
export async function fetchDailySummary(userId: string, dateStr: string) {
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay);

  if (error) {
    console.error('Error fetching daily summary from Supabase:', error.message);
    throw error;
  }

  const meals = data || [];
  const consumed_calories_kcal = meals.reduce((acc, m) => acc + (m.total_calories_kcal || 0), 0);
  const consumed_protein_g = meals.reduce((acc, m) => acc + (m.total_protein_g || 0), 0);
  const consumed_carbohydrates_g = meals.reduce((acc, m) => acc + (m.total_carbs_g || 0), 0);
  const consumed_fat_g = meals.reduce((acc, m) => acc + (m.total_fat_g || 0), 0);

  return {
    consumed_calories_kcal,
    consumed_protein_g,
    consumed_carbohydrates_g,
    consumed_fat_g,
    meals_logged_count: meals.length,
  };
}

/**
 * Log a new meal entry in Supabase.
 */
export async function logMeal(payload: LogMealPayload): Promise<any> {
  const { data: meal, error: mealErr } = await supabase
    .from('meals')
    .insert([
      {
        user_id: payload.user_id,
        meal_type: payload.meal_type || 'POST_WORKOUT',
        total_calories_kcal: payload.total_calories_kcal,
        total_protein_g: payload.total_protein_g,
        total_carbs_g: payload.total_carbs_g,
        total_fat_g: payload.total_fat_g,
        notes: payload.notes || null,
      },
    ])
    .select()
    .single();

  if (mealErr) {
    console.error('Error logging meal to Supabase:', mealErr.message);
    throw mealErr;
  }

  if (payload.items && payload.items.length > 0) {
    const mealItems = payload.items.map((item) => ({
      meal_id: meal.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
      unit: item.unit,
      calories_kcal: item.calories_kcal,
      protein_g: item.protein_g,
      carbohydrates_g: item.carbohydrates_g,
      fat_g: item.fat_g,
    }));

    const { error: itemsErr } = await supabase.from('meal_items').insert(mealItems);
    if (itemsErr) {
      console.error('Error logging meal items to Supabase:', itemsErr.message);
    }
  }

  return meal;
}
