/* API Client service for FastAPI backend communication */

import type { AgentQueryResult, PantryItem } from '../types';

const API_BASE_URL = '/api/v1';

export interface DailySummaryData {
  consumed_calories_kcal: number;
  consumed_protein_g: number;
  consumed_carbohydrates_g: number;
  consumed_fat_g: number;
  meals_logged_count: number;
}

export interface CatalogFoodItem {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  nutrition?: {
    calories_kcal: number;
    protein_g: number;
    carbohydrates_g: number;
    fat_g: number;
  };
}

export interface TargetCalculationRequest {
  user_id: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: string;
  activity_level: string;
  goal: string;
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

export interface BasketballLogPayload {
  user_id: string;
  session_category: 'TRAINING' | 'MATCH';
  duration_minutes: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  weight_kg: number;
}

export interface StrengthLogPayload {
  user_id: string;
  training_type: 'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE';
  duration_minutes: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  weight_kg: number;
  targeted_muscles: string[];
  total_sets?: number;
  total_reps?: number;
  total_volume_kg?: number;
}

export async function calculateTargets(
  payload: TargetCalculationRequest
): Promise<TargetCalculationResponse> {
  const response = await fetch(`${API_BASE_URL}/nutrition/calculate-targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error calculating targets: ${response.status}`);
  }
  return response.json();
}

export async function fetchDailySummary(
  userId: string,
  date: string = '2026-09-15'
): Promise<DailySummaryData> {
  const response = await fetch(
    `${API_BASE_URL}/nutrition/daily-summary?user_id=${userId}&date=${date}`
  );
  if (!response.ok) {
    throw new Error(`Error fetching daily summary: ${response.status}`);
  }
  return response.json();
}

export async function fetchPantryInventory(userId: string): Promise<PantryItem[]> {
  const response = await fetch(`${API_BASE_URL}/inventory?user_id=${userId}`);
  if (!response.ok) {
    throw new Error(`Error fetching inventory: ${response.status}`);
  }
  const rawItems = await response.json();
  
  return rawItems.map((item: any) => {
    const foodName = item.food_item?.name || 'Alimento';
    const category = item.food_item?.category || 'General';
    const protein = item.food_item?.nutrition?.protein_g || 0;
    const carbs = item.food_item?.nutrition?.carbohydrates_g || 0;
    let densityClass: PantryItem['density_class'] = 'BALANCED';
    if (protein > 15) densityClass = 'PROTEIN_DENSE';
    else if (carbs > 20) densityClass = 'CARB_DENSE';

    return {
      inventory_item_id: item.id,
      food_item_id: item.food_item_id,
      name: foodName,
      category: category,
      available_quantity: item.quantity,
      unit: item.unit,
      expiration_date: item.expiration_date,
      days_until_expiration: item.expiration_date ? 5 : null,
      status: item.status || 'AVAILABLE',
      density_class: densityClass,
    };
  });
}

export async function fetchFoodCatalog(): Promise<CatalogFoodItem[]> {
  const response = await fetch(`${API_BASE_URL}/food`);
  if (!response.ok) {
    throw new Error(`Error fetching catalog: ${response.status}`);
  }
  return response.json();
}

export async function addPantryItem(payload: {
  user_id: string;
  food_item_id: string;
  quantity: number;
  unit: string;
  expiration_date?: string | null;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error adding pantry item: ${response.status}`);
  }
  return response.json();
}

export async function deletePantryItem(itemId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Error deleting pantry item: ${response.status}`);
  }
}

export async function logBasketballActivity(payload: BasketballLogPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/activities/basketball`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error logging basketball activity: ${response.status}`);
  }
  return response.json();
}

export async function logStrengthActivity(payload: StrengthLogPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/activities/strength`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Error logging strength activity: ${response.status}`);
  }
  return response.json();
}

export async function logActivity(payload: {
  user_id: string;
  sport_type: string;
  duration_minutes: number;
  weight_kg: number;
  intensity?: string;
}): Promise<any> {
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

export async function logMeal(payload: {
  user_id: string;
  meal_type: string;
  items: Array<{ food_item_id: string; quantity: number; unit: string }>;
}): Promise<any> {
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

