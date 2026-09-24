/**
 * Direct Supabase API Client Service.
 * Handles all database CRUD operations (Profiles, Food Catalog, Pantry Inventory, Meal Logs)
 * directly from the frontend using the Singleton Supabase client.
 */

import { supabase } from '../lib/supabase';
import type { PantryItem, LoggedMealEntry, LoggedActivityEntry, HydrationLogEntry } from '../types';
import { mapMealRowToLoggedMealEntry, resolveServingSize } from '../utils/nutritionUtils';

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

export interface CreateCustomFoodPayload {
  user_id?: string;
  name: string;
  category: string;
  default_unit: string;
  serving_size: number;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
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
  name?: string;
  image_url?: string;
  total_calories_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string;
  items?: Array<{
    food_item_id?: string | null;
    name?: string;
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
        gender: profile.gender || 'male',
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
  const existing = await fetchUserProfile(userId);

  if (!existing) {
    // If no row exists yet in Supabase for this user, create complete initial profile with defaults + updates
    return await saveUserProfile({
      user_id: userId,
      weight_kg: updates.weight_kg || 70,
      height_cm: updates.height_cm || 175,
      age: updates.age || 25,
      gender: updates.gender || 'MALE',
      activity_level: updates.activity_level || 'ACTIVE',
      body_composition_goal: updates.body_composition_goal || 'BULK',
      nutritional_goal: updates.nutritional_goal || 'PERFORMANCE',
      daily_calories_target: updates.daily_calories_target ?? 2500,
      daily_protein_g_target: updates.daily_protein_g_target ?? 160,
      daily_carbs_g_target: updates.daily_carbs_g_target ?? 280,
      daily_fat_g_target: updates.daily_fat_g_target ?? 70,
    });
  }

  // Row exists: perform clean, lightweight UPDATE
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

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
      gender: 'male',
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
        serving_size: resolveServingSize(nutr?.serving_size, item.default_unit),
        calories_kcal: nutr?.calories_kcal || 0,
        protein_g: nutr?.protein_g || 0,
        carbohydrates_g: nutr?.carbohydrates_g || 0,
        fat_g: nutr?.fat_g || 0,
      },
    };
  });
}

/**
  * Create a new custom food item and insert its nutritional information into Supabase.
  */
export async function createCustomFoodItem(payload: CreateCustomFoodPayload): Promise<CatalogFoodItem> {
  const { data: food, error: foodErr } = await supabase
    .from('food_items')
    .insert([
      {
        name: payload.name,
        category: payload.category,
        default_unit: payload.default_unit || 'g',
        is_custom: true,
        created_by_user_id: payload.user_id || null,
      },
    ])
    .select()
    .single();

  if (foodErr) {
    console.error('Error creating custom food_item in Supabase:', foodErr.message);
    throw foodErr;
  }

  const { data: nutr, error: nutrErr } = await supabase
    .from('nutritional_information')
    .insert([
      {
        food_item_id: food.id,
        serving_size: payload.serving_size || 100,
        serving_unit: payload.default_unit || 'g',
        calories_kcal: payload.calories_kcal || 0,
        protein_g: payload.protein_g || 0,
        carbohydrates_g: payload.carbohydrates_g || 0,
        fat_g: payload.fat_g || 0,
      },
    ])
    .select()
    .single();

  if (nutrErr) {
    console.error('Error creating nutritional_information in Supabase:', nutrErr.message);
    throw nutrErr;
  }

  return {
    id: food.id,
    food_item_id: food.id,
    name: food.name,
    category: food.category,
    default_unit: food.default_unit || 'g',
    is_custom: true,
    nutrition: {
      serving_size: nutr.serving_size || 100,
      calories_kcal: nutr.calories_kcal || 0,
      protein_g: nutr.protein_g || 0,
      carbohydrates_g: nutr.carbohydrates_g || 0,
      fat_g: nutr.fat_g || 0,
    },
  };
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
    const fat = nutr?.fat_g || 0;
    let densityClass: PantryItem['density_class'] = 'BALANCED';
    if (protein > 15) densityClass = 'PROTEIN_DENSE';
    else if (carbs > 20) densityClass = 'CARB_DENSE';
    else if (fat > 12) densityClass = 'FAT_DENSE';

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
          serving_size: resolveServingSize(nutr.serving_size, food?.default_unit || row.unit),
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
  // Check if an entry with the same food_item_id and unit already exists in the user's available pantry stock
  const { data: existing } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', payload.user_id)
    .eq('food_item_id', payload.food_item_id)
    .eq('unit', payload.unit)
    .eq('status', 'AVAILABLE')
    .maybeSingle();

  if (existing) {
    const newQuantity = Number(existing.quantity) + Number(payload.quantity);
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating existing pantry item quantity in Supabase:', error.message);
      throw error;
    }
    return data;
  }

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
 * Add multiple items to the user's pantry inventory in a single batch operation in Supabase.
 * Automatically sums quantity for existing food items with the same unit.
 */
export async function addPantryItemsBatch(payloads: AddPantryItemPayload[]): Promise<any[]> {
  if (!payloads || payloads.length === 0) return [];

  const userId = payloads[0].user_id;

  // Fetch all current available items for this user to check for existing stock
  const { data: existingItems } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'AVAILABLE');

  const existingMap = new Map<string, any>();
  (existingItems || []).forEach((item: any) => {
    const key = `${item.food_item_id}_${item.unit}`;
    existingMap.set(key, item);
  });

  const itemsToUpdate: Array<{ id: string; quantity: number }> = [];
  const itemsToInsert: AddPantryItemPayload[] = [];

  for (const payload of payloads) {
    const key = `${payload.food_item_id}_${payload.unit}`;
    const existing = existingMap.get(key);

    if (existing) {
      const newQty = Number(existing.quantity) + Number(payload.quantity);
      existing.quantity = newQty; // update local map in case duplicates are within the payload batch itself
      itemsToUpdate.push({ id: existing.id, quantity: newQty });
    } else {
      itemsToInsert.push(payload);
    }
  }

  const results: any[] = [];

  // 1. Update existing items with summed quantities
  for (const item of itemsToUpdate) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({ quantity: item.quantity })
      .eq('id', item.id)
      .select()
      .maybeSingle();

    if (!error && data) results.push(data);
  }

  // 2. Insert new items for items not currently in pantry
  if (itemsToInsert.length > 0) {
    const rows = itemsToInsert.map((payload) => ({
      user_id: payload.user_id,
      food_item_id: payload.food_item_id,
      quantity: payload.quantity,
      unit: payload.unit,
      expiration_date: payload.expiration_date || null,
      status: 'AVAILABLE',
    }));

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(rows)
      .select();

    if (error) {
      console.error('Error batch adding pantry items to Supabase:', error.message);
      throw error;
    }
    if (data) results.push(...data);
  }

  return results;
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
 * Fetch detailed logged meals with items for a specific user and date.
 */
export async function fetchLoggedMealsForDate(userId: string, dateStr: string): Promise<LoggedMealEntry[]> {
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*, food_items(name, category))')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: true });

  if (error) {
    console.error('Error fetching logged meals for date from Supabase:', error.message);
    return [];
  }

  return (data || []).map(mapMealRowToLoggedMealEntry);
}

/**
 * Fetch recent logged meals for a user to allow 1-click repetition.
 */
export async function fetchRecentUserMeals(userId: string): Promise<LoggedMealEntry[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_items(*, food_items(name, category))')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent user meals from Supabase:', error.message);
    return [];
  }

  return (data || []).map(mapMealRowToLoggedMealEntry);
}

/**
 * Deduct consumed food quantities from the user's available pantry inventory in Supabase.
 * If remaining quantity reaches 0, updates status to 'CONSUMED'.
 */
export async function deductPantryInventory(
  userId: string,
  consumedItems: Array<{ food_item_id?: string | null; quantity: number }>
): Promise<void> {
  if (!userId || !consumedItems || consumedItems.length === 0) return;

  try {
    const { data: availableStock, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'AVAILABLE');

    if (error || !availableStock) {
      console.warn('Could not fetch inventory stock for deduction:', error?.message);
      return;
    }

    for (const item of consumedItems) {
      if (!item.food_item_id || item.quantity <= 0) continue;

      const row = availableStock.find((r) => r.food_item_id === item.food_item_id);
      if (row) {
        const currentQty = Number(row.quantity) || 0;
        const newQty = Math.max(0, currentQty - Number(item.quantity));
        const newStatus = newQty === 0 ? 'CONSUMED' : 'AVAILABLE';

        await supabase
          .from('inventory_items')
          .update({
            quantity: newQty,
            status: newStatus,
          })
          .eq('id', row.id);
      }
    }
  } catch (err) {
    console.error('Error deducting pantry inventory:', err);
  }
}

/**
 * Log a new meal entry in Supabase and automatically deduct consumed stock from pantry inventory.
 */
export async function logMeal(payload: LogMealPayload): Promise<any> {
  const insertPayload: Record<string, any> = {
    user_id: payload.user_id,
    meal_type: payload.meal_type || 'POST_WORKOUT',
    total_calories_kcal: payload.total_calories_kcal,
    total_protein_g: payload.total_protein_g,
    total_carbs_g: payload.total_carbs_g,
    total_fat_g: payload.total_fat_g,
    notes: payload.notes || null,
  };

  if (payload.name) insertPayload.name = payload.name;

  const { data: meal, error: mealErr } = await supabase
    .from('meals')
    .insert([insertPayload])
    .select()
    .single();

  if (mealErr) {
    console.error('Error logging meal to Supabase:', mealErr.message);
    throw mealErr;
  }

  if (payload.items && payload.items.length > 0) {
    // Filter items to ensure food_item_id is valid UUID if provided
    const mealItems = payload.items
      .filter((item) => item.food_item_id)
      .map((item) => ({
        meal_id: meal.id,
        food_item_id: item.food_item_id,
        quantity: item.quantity,
        unit: item.unit,
        calories_kcal: item.calories_kcal,
        protein_g: item.protein_g,
        carbohydrates_g: item.carbohydrates_g,
        fat_g: item.fat_g,
      }));

    if (mealItems.length > 0) {
      const { error: itemsErr } = await supabase.from('meal_items').insert(mealItems);
      if (itemsErr) {
        console.error('Error logging meal items to Supabase:', itemsErr.message);
      }
    }

    // Deduct consumed stock from user's available pantry inventory
    await deductPantryInventory(payload.user_id, payload.items);
  }

  return meal;
}

// ============================================================================
// 5. ATHLETIC ACTIVITIES & TRAINING SESSIONS
// ============================================================================

/**
 * Fetch detailed logged activities with basketball & strength specialization rows for a specific user and date.
 */
export async function fetchLoggedActivitiesForDate(
  userId: string,
  dateStr: string
): Promise<LoggedActivityEntry[]> {
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('activities')
    .select('*, basketball_activities(*), strength_training_activities(*)')
    .eq('user_id', userId)
    .gte('date', startOfDay)
    .lte('date', endOfDay)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching logged activities for date from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row: any) => {
    const bball = Array.isArray(row.basketball_activities)
      ? row.basketball_activities[0]
      : row.basketball_activities;
    const strength = Array.isArray(row.strength_training_activities)
      ? row.strength_training_activities[0]
      : row.strength_training_activities;

    return {
      id: row.id,
      user_id: row.user_id,
      sport: row.sport,
      session_type: row.session_type,
      duration_minutes: row.duration_minutes,
      intensity: row.intensity,
      date: row.date,
      estimated_expenditure_kcal: row.estimated_expenditure_kcal || 0,
      basketball_details: bball
        ? {
            id: bball.id,
            session_category: bball.session_category,
            carb_demand_g: bball.carb_demand_g || 0,
            hydration_demand_ml: bball.hydration_demand_ml || 0,
            recovery_priority: bball.recovery_priority || 'RECOVERY',
          }
        : undefined,
      strength_details: strength
        ? {
            id: strength.id,
            training_type: strength.training_type,
            protein_demand_g: strength.protein_demand_g || 0,
            targeted_muscle_groups: strength.targeted_muscle_groups || [],
            total_volume_kg: strength.total_volume_kg || 0,
            total_sets: strength.total_sets || 0,
            total_reps: strength.total_reps || 0,
          }
        : undefined,
    };
  });
}

/**
 * Delete an activity log session from Supabase (cascades specialization rows automatically).
 */
export async function deleteActivitySession(activityId: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', activityId);

  if (error) {
    console.error('Error deleting activity session from Supabase:', error.message);
    throw error;
  }
}

export interface LogActivitySessionPayload {
  user_id: string;
  sport: 'BASKETBALL' | 'STRENGTH_TRAINING';
  session_type: string;
  duration_minutes: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  estimated_expenditure_kcal: number;
  basketball_details?: {
    session_category: 'TRAINING' | 'MATCH';
    carb_demand_g: number;
    hydration_demand_ml: number;
    recovery_priority: string;
  };
  strength_details?: {
    training_type: 'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE';
    protein_demand_g: number;
    targeted_muscle_groups: string[];
    total_volume_kg: number;
    total_sets: number;
    total_reps: number;
  };
}

/**
 * Log a new activity session directly into Supabase (activities + specialization table).
 */
export async function logActivitySession(payload: LogActivitySessionPayload): Promise<any> {
  const { data: activity, error: actErr } = await supabase
    .from('activities')
    .insert([
      {
        user_id: payload.user_id,
        sport: payload.sport,
        session_type: payload.session_type,
        duration_minutes: payload.duration_minutes,
        intensity: payload.intensity,
        estimated_expenditure_kcal: payload.estimated_expenditure_kcal,
      },
    ])
    .select()
    .single();

  if (actErr) {
    console.error('Error inserting activity to Supabase:', actErr.message);
    throw actErr;
  }

  if (payload.sport === 'BASKETBALL' && payload.basketball_details) {
    const { error: bballErr } = await supabase.from('basketball_activities').insert([
      {
        activity_id: activity.id,
        session_category: payload.basketball_details.session_category,
        carb_demand_g: payload.basketball_details.carb_demand_g,
        hydration_demand_ml: payload.basketball_details.hydration_demand_ml,
        recovery_priority: payload.basketball_details.recovery_priority,
      },
    ]);
    if (bballErr) {
      console.error('Error inserting basketball_activity details to Supabase:', bballErr.message);
    }
  } else if (payload.sport === 'STRENGTH_TRAINING' && payload.strength_details) {
    const { error: strErr } = await supabase.from('strength_training_activities').insert([
      {
        activity_id: activity.id,
        training_type: payload.strength_details.training_type,
        protein_demand_g: payload.strength_details.protein_demand_g,
        targeted_muscle_groups: payload.strength_details.targeted_muscle_groups,
        total_volume_kg: payload.strength_details.total_volume_kg,
        total_sets: payload.strength_details.total_sets,
        total_reps: payload.strength_details.total_reps,
      },
    ]);
    if (strErr) {
      console.error('Error inserting strength_training_activity details to Supabase:', strErr.message);
    }
  }

  return activity;
}

/**
 * Update an existing activity session in Supabase.
 */
export async function updateActivitySession(
  activityId: string,
  payload: LogActivitySessionPayload
): Promise<any> {
  const { data: activity, error: actErr } = await supabase
    .from('activities')
    .update({
      sport: payload.sport,
      session_type: payload.session_type,
      duration_minutes: payload.duration_minutes,
      intensity: payload.intensity,
      estimated_expenditure_kcal: payload.estimated_expenditure_kcal,
    })
    .eq('id', activityId)
    .select()
    .single();

  if (actErr) {
    console.error('Error updating activity in Supabase:', actErr.message);
    throw actErr;
  }

  if (payload.sport === 'BASKETBALL' && payload.basketball_details) {
    await supabase
      .from('basketball_activities')
      .update({
        session_category: payload.basketball_details.session_category,
        carb_demand_g: payload.basketball_details.carb_demand_g,
        hydration_demand_ml: payload.basketball_details.hydration_demand_ml,
        recovery_priority: payload.basketball_details.recovery_priority,
      })
      .eq('activity_id', activityId);
  } else if (payload.sport === 'STRENGTH_TRAINING' && payload.strength_details) {
    await supabase
      .from('strength_training_activities')
      .update({
        training_type: payload.strength_details.training_type,
        protein_demand_g: payload.strength_details.protein_demand_g,
        targeted_muscle_groups: payload.strength_details.targeted_muscle_groups,
        total_volume_kg: payload.strength_details.total_volume_kg,
        total_sets: payload.strength_details.total_sets,
        total_reps: payload.strength_details.total_reps,
      })
      .eq('activity_id', activityId);
  }

  return activity;
}

// ============================================================================
// 6. HYDRATION INTAKE LOGS
// ============================================================================

/**
 * Fetch today's logged water intake entries for a user.
 */
export async function fetchDailyHydrationLogs(
  userId: string,
  dateStr: string
): Promise<HydrationLogEntry[]> {
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: false });

  if (error) {
    console.error('Error fetching hydration logs from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    amount_ml: row.amount_ml,
    logged_at: row.logged_at,
  }));
}

/**
 * Log a new water intake entry in Supabase.
 */
export async function logWaterIntake(userId: string, amountMl: number): Promise<HydrationLogEntry> {
  const { data, error } = await supabase
    .from('hydration_logs')
    .insert([
      {
        user_id: userId,
        amount_ml: amountMl,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error logging water intake to Supabase:', error.message);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    amount_ml: data.amount_ml,
    logged_at: data.logged_at,
  };
}

/**
 * Delete a water intake log entry from Supabase.
 */
export async function deleteHydrationLog(logId: string): Promise<void> {
  const { error } = await supabase.from('hydration_logs').delete().eq('id', logId);

  if (error) {
    console.error('Error deleting hydration log from Supabase:', error.message);
    throw error;
  }
}




