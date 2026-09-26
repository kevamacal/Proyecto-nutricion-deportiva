/* API Client service consuming FastAPI Backend endpoints exclusively */

import type {
  AgentQueryResult,
  HydrationLogEntry,
  LoggedActivityEntry,
  LoggedMealEntry,
  PantryItem,
} from '../types';

const API_BASE_URL = '/api/v1';

/**
 * Centralized, secure API client wrapper for issuing HTTP requests.
 * Encapsulates URL resolution using native URL object and safe path normalization.
 */
async function apiClient<T>(
  path: string,
  options?: RequestInit,
  queryParams?: Record<string, string | number | undefined>
): Promise<{ ok: boolean; status: number; data: T }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, base);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  const response = await fetch(url.href, options);
  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (response.status !== 204 && contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  return { ok: response.ok, status: response.status, data };
}

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
  const res = await apiClient<any>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || '' }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed with status ${res.status}`);
  }
  return res.data;
}

export async function registerUser(email: string, name: string, password?: string, primarySport?: string) {
  const res = await apiClient<any>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password: password || '', primary_sport: primarySport || 'BASKETBALL' }),
  });
  if (!res.ok) {
    throw new Error(`Registration failed with status ${res.status}`);
  }
  return res.data;
}

export async function fetchUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
  const res = await apiClient<SupabaseUserProfile>(`/profile/${encodeURIComponent(userId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Error fetching profile: ${res.status}`);
  }
  return res.data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<SupabaseUserProfile>
): Promise<SupabaseUserProfile | null> {
  const res = await apiClient<SupabaseUserProfile>(`/profile/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error(`Error updating profile: ${res.status}`);
  }
  return res.data;
}

export async function saveUserProfile(profile: SupabaseUserProfile): Promise<SupabaseUserProfile> {
  return (await updateUserProfile(profile.user_id, profile)) || profile;
}

export async function ensureUserProfileExists(
  userId: string,
  email?: string,
  name?: string
): Promise<SupabaseUserProfile | null> {
  const res = await apiClient<SupabaseUserProfile>('/profile/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, email, name }),
  });
  if (!res.ok) {
    return null;
  }
  return res.data;
}

// ============================================================================
// 2. FOOD CATALOG
// ============================================================================

export async function fetchFoodCatalog(): Promise<CatalogFoodItem[]> {
  const res = await apiClient<CatalogFoodItem[]>('/foods');
  if (!res.ok) {
    throw new Error(`Error fetching food catalog: ${res.status}`);
  }
  return res.data;
}

export async function createCustomFoodItem(payload: CreateCustomFoodPayload): Promise<CatalogFoodItem> {
  const res = await apiClient<CatalogFoodItem>('/foods/custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error creating custom food: ${res.status}`);
  }
  return res.data;
}

// ============================================================================
// 3. PANTRY INVENTORY
// ============================================================================

export async function fetchPantryInventory(userId: string): Promise<PantryItem[]> {
  const res = await apiClient<PantryItem[]>(`/pantry/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error(`Error fetching pantry: ${res.status}`);
  }
  return res.data;
}

export async function addPantryItem(payload: AddPantryItemPayload): Promise<any> {
  const res = await apiClient<any>('/pantry/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error adding pantry item: ${res.status}`);
  }
  return res.data;
}

export async function addPantryItemsBatch(payloads: AddPantryItemPayload[]): Promise<any[]> {
  const res = await apiClient<any[]>('/pantry/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payloads }),
  });
  if (!res.ok) {
    throw new Error(`Error batch adding pantry items: ${res.status}`);
  }
  return res.data;
}

export async function deletePantryItem(itemId: string): Promise<void> {
  const res = await apiClient<void>(`/pantry/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Error deleting pantry item: ${res.status}`);
  }
}

// ============================================================================
// 4. MEALS & DAILY SUMMARY
// ============================================================================

export async function fetchDailySummary(userId: string, dateStr: string) {
  const res = await apiClient<any>('/summary/daily', undefined, { user_id: userId, date: dateStr });
  if (!res.ok) {
    throw new Error(`Error fetching daily summary: ${res.status}`);
  }
  return res.data;
}

export async function fetchLoggedMealsForDate(userId: string, dateStr: string): Promise<LoggedMealEntry[]> {
  const res = await apiClient<LoggedMealEntry[]>('/meals', undefined, { user_id: userId, date: dateStr });
  if (!res.ok) {
    return [];
  }
  return res.data;
}

export async function fetchRecentUserMeals(userId: string): Promise<LoggedMealEntry[]> {
  const res = await apiClient<LoggedMealEntry[]>(`/meals/recent/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    return [];
  }
  return res.data;
}

export async function logMeal(payload: LogMealPayload): Promise<any> {
  const res = await apiClient<any>('/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error logging meal: ${res.status}`);
  }
  return res.data;
}

// ============================================================================
// 5. ACTIVITIES & ATHLETIC SESSIONS
// ============================================================================

export async function fetchLoggedActivitiesForDate(
  userId: string,
  dateStr: string
): Promise<LoggedActivityEntry[]> {
  const res = await apiClient<LoggedActivityEntry[]>('/activities', undefined, { user_id: userId, date: dateStr });
  if (!res.ok) {
    return [];
  }
  return res.data;
}

export async function logActivitySession(payload: LogActivitySessionPayload): Promise<any> {
  const res = await apiClient<any>('/activities/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error logging activity session: ${res.status}`);
  }
  return res.data;
}

export async function updateActivitySession(
  activityId: string,
  payload: LogActivitySessionPayload
): Promise<any> {
  const res = await apiClient<any>(`/activities/session/${encodeURIComponent(activityId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error updating activity session: ${res.status}`);
  }
  return res.data;
}

export async function deleteActivitySession(activityId: string): Promise<void> {
  const res = await apiClient<void>(`/activities/session/${encodeURIComponent(activityId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Error deleting activity session: ${res.status}`);
  }
}

// ============================================================================
// 6. HYDRATION INTAKE LOGS
// ============================================================================

export async function fetchDailyHydrationLogs(userId: string, dateStr: string): Promise<HydrationLogEntry[]> {
  const res = await apiClient<HydrationLogEntry[]>('/hydration', undefined, { user_id: userId, date: dateStr });
  if (!res.ok) {
    return [];
  }
  return res.data;
}

export async function logWaterIntake(userId: string, amountMl: number): Promise<HydrationLogEntry> {
  const res = await apiClient<HydrationLogEntry>('/hydration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, amount_ml: amountMl }),
  });
  if (!res.ok) {
    throw new Error(`Error logging water intake: ${res.status}`);
  }
  return res.data;
}

export async function deleteHydrationLog(logId: string): Promise<void> {
  const res = await apiClient<void>(`/hydration/${encodeURIComponent(logId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Error deleting hydration log: ${res.status}`);
  }
}

// ============================================================================
// 7. DETERMINISTIC COMPUTATION & AGENT ORCHESTRATION
// ============================================================================

export async function calculateTargets(
  payload: TargetCalculationRequest
): Promise<TargetCalculationResponse> {
  const res = await apiClient<TargetCalculationResponse>('/nutrition/calculate_targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error calculating targets: ${res.status}`);
  }
  return res.data;
}

export async function logActivity(payload: ActivityLogPayload): Promise<any> {
  const res = await apiClient<any>('/activities/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Error logging activity: ${res.status}`);
  }
  return res.data;
}

export async function sendAgentQuery(
  query: string,
  userId: string,
  date: string = '2026-09-15'
): Promise<AgentQueryResult> {
  const res = await apiClient<AgentQueryResult>('/agent/orchestrator/query', {
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

  if (!res.ok) {
    throw new Error(`API error HTTP ${res.status}`);
  }

  return res.data;
}
