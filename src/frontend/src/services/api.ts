/* API Client service for FastAPI backend communication */

import type { AgentQueryResult } from '../types';

const API_BASE_URL = '/api/v1';

export async function sendAgentQuery(query: string, userId: string, date: string = '2026-09-15'): Promise<AgentQueryResult> {
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
