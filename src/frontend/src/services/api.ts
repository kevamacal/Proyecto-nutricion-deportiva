/* API Client service for FastAPI backend pure computation layer */

import type { AgentQueryResult } from '../types';

const API_BASE_URL = '/api/v1';

export interface TargetCalculationRequest {
  user_id: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: string;
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

/**
 * Calculate BMR, TDEE, and macronutrient targets deterministically in Python backend.
 */
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

/**
 * Log athletic session and calculate MET-based energy expenditure.
 */
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

/**
 * Send natural language query to LangGraph Multi-Agent Orchestrator.
 */
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
