/* API Client service consuming FastAPI Backend endpoints exclusively */

import type {
  AgentQueryResult,
  HydrationLogEntry,
  LoggedActivityEntry,
  LoggedMealEntry,
  PantryItem,
} from '../types';

const API_BASE_URL = '/api/v1';

export interface TargetCalculationRequest {
  user_id: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  activity_level: string;
  body_composition_goal: string;
}

export interface TargetCalculationResponse {
  user_id: string;
  bmr_kcal: number;
  base_tdee_kcal: number;
  calories_target_kcal: number;
  protein_target_g: number;
  fat_target_g: number;
  carbs_target_g: number;
}

export interface ActivityLogPayload {
  user_id: string;
  sport_type: string;
  duration_minutes: number;
  weight_kg: number;
  intensity?: string;
  rpe?: number;
}

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

// ============================================================================
// 1. AUTHENTICATION & PROFILES
// ============================================================================

export async function loginUser(email: string, password?: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || '' }),
  });
  if (!response.ok) {
    throw new Error(`Auth failed with status ${response.status}`);
  }
  return response.json();
}

export async function registerUser(email: string, name: string, password?: string, primarySport?: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password: password || '', primary_sport: primarySport || 'BASKETBALL' }),
  });
  if (!response.ok) {
    throw new Error(`Registration failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Error fetching profile: ${response.status}`);
  }
  return response.json();
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<SupabaseUserProfile>
): Promise<SupabaseUserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Error updating profile: ${response.status}`);
  }
  return response.json();
}

export async function saveUserProfile(profile: SupabaseUserProfile): Promise<SupabaseUserProfile> {
  return (await updateUserProfile(profile.user_id, profile)) || profile;
}

export async function ensureUserProfileExists(
  userId: string,
  email?: string,
  name?: string
): Promise<SupabaseUserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/profile/ensure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, email, name }),
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

// ============================================================================
// 2. FOOD CATALOG
// ============================================================================

export async function fetchFoodCatalog(): Promise<CatalogFoodItem[]> {
  const response = await fetch(`${API_BASE_URL}/foods`);
  if (!response.ok) {
    throw new Error(`Error fetching food catalog: ${response.status}`);
  }
  return response.json();
}

export async function createCustomFoodItem(payload: CreateCustomFoodPayload): Promise<CatalogFoodItem> {
  const response = await fetch(`${API_BASE_URL}/foods/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error creating custom food: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// 3. PANTRY INVENTORY
// ============================================================================

export async function fetchPantryInventory(userId: string): Promise<PantryItem[]> {
  const response = await fetch(`${API_BASE_URL}/pantry/${userId}`);
  if (!response.ok) {
    throw new Error(`Error fetching pantry: ${response.status}`);
  }
  return response.json();
}

export async function addPantryItem(payload: AddPantryItemPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/pantry/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error adding pantry item: ${response.status}`);
  }
  return response.json();
}

export async function addPantryItemsBatch(payloads: AddPantryItemPayload[]): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/pantry/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payloads }),
  });
  if (!response.ok) {
    throw new Error(`Error batch adding pantry items: ${response.status}`);
  }
  return response.json();
}

export async function deletePantryItem(itemId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/pantry/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Error deleting pantry item: ${response.status}`);
  }
}

// ============================================================================
// 4. MEALS & DAILY SUMMARY
// ============================================================================

export async function fetchDailySummary(userId: string, dateStr: string) {
  const response = await fetch(`${API_BASE_URL}/summary/daily?user_id=${userId}&date=${dateStr}`);
  if (!response.ok) {
    throw new Error(`Error fetching daily summary: ${response.status}`);
  }
  return response.json();
}

export async function fetchLoggedMealsForDate(userId: string, dateStr: string): Promise<LoggedMealEntry[]> {
  const response = await fetch(`${API_BASE_URL}/meals?user_id=${userId}&date=${dateStr}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function fetchRecentUserMeals(userId: string): Promise<LoggedMealEntry[]> {
  const response = await fetch(`${API_BASE_URL}/meals/recent/${userId}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function logMeal(payload: LogMealPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error logging meal: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// 5. ACTIVITIES & ATHLETIC SESSIONS
// ============================================================================

export async function fetchLoggedActivitiesForDate(
  userId: string,
  dateStr: string
): Promise<LoggedActivityEntry[]> {
  const response = await fetch(`${API_BASE_URL}/activities?user_id=${userId}&date=${dateStr}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function logActivitySession(payload: LogActivitySessionPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/activities/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error logging activity session: ${response.status}`);
  }
  return response.json();
}

export async function updateActivitySession(
  activityId: string,
  payload: LogActivitySessionPayload
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/activities/session/${activityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error updating activity session: ${response.status}`);
  }
  return response.json();
}

export async function deleteActivitySession(activityId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/activities/session/${activityId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Error deleting activity session: ${response.status}`);
  }
}

// ============================================================================
// 6. HYDRATION INTAKE LOGS
// ============================================================================

export async function fetchDailyHydrationLogs(userId: string, dateStr: string): Promise<HydrationLogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/hydration?user_id=${userId}&date=${dateStr}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function logWaterIntake(userId: string, amountMl: number): Promise<HydrationLogEntry> {
  const response = await fetch(`${API_BASE_URL}/hydration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, amount_ml: amountMl }),
  });
  if (!response.ok) {
    throw new Error(`Error logging water intake: ${response.status}`);
  }
  return response.json();
}

export async function deleteHydrationLog(logId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/hydration/${logId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Error deleting hydration log: ${response.status}`);
  }
}

// ============================================================================
// 7. DETERMINISTIC COMPUTATION & AGENT ORCHESTRATION
// ============================================================================

export async function calculateTargets(
  payload: TargetCalculationRequest
): Promise<TargetCalculationResponse> {
  const response = await fetch(`${API_BASE_URL}/nutrition/calculate_targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error calculating targets: ${response.status}`);
  }
  return response.json();
}

export async function logActivity(payload: ActivityLogPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/activities/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error logging activity: ${response.status}`);
  }
  return response.json();
}

export async function sendAgentQuery(
  query: string,
  userId: string,
  date: string = '2026-09-15'
): Promise<AgentQueryResult> {
  const response = await fetch(`${API_BASE_URL}/agent/orchestrator/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      user_id: userId,
      date,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error HTTP ${response.status}`);
  }

  return response.json();
}
