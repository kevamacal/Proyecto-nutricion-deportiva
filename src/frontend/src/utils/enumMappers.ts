/**
 * Centralized Enum Mappers.
 * Maps PostgreSQL / Backend database Enum strings (strictly in English)
 * into friendly Spanish display labels for the UI.
 */

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo / Comida',
  DINNER: 'Cena',
  SNACK: 'Merienda / Snack',
  POST_WORKOUT: 'Post-Entrenamiento',
};

export const DENSITY_CLASS_LABELS: Record<string, string> = {
  PROTEIN_DENSE: 'ALTO EN PROTEÍNA',
  CARB_DENSE: 'ALTO EN CARBOHIDRATOS',
  FAT_DENSE: 'ALTO EN GRASAS',
  BALANCED: 'EQUILIBRADO',
};

export const ACTIVITY_SPORT_LABELS: Record<string, string> = {
  BASKETBALL: 'Baloncesto',
  STRENGTH_TRAINING: 'Entrenamiento de Fuerza',
};

export const ACTIVITY_INTENSITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  VERY_HIGH: 'Muy Alta',
};

export const BASKETBALL_SESSION_CATEGORY_LABELS: Record<string, string> = {
  TRAINING: 'Entrenamiento',
  MATCH: 'Partido / Competición',
};

export const STRENGTH_TRAINING_TYPE_LABELS: Record<string, string> = {
  HYPERTROPHY: 'Hipertrofia',
  STRENGTH: 'Fuerza Máxima',
  POWER: 'Potencia Explosiva',
  HYBRID: 'Híbrido',
  ENDURANCE: 'Resistencia Muscular',
};

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentario',
  MODERATE: 'Moderadamente Activo',
  ACTIVE: 'Activo',
  VERY_ACTIVE: 'Muy Activo',
};

export const BODY_COMPOSITION_GOAL_LABELS: Record<string, string> = {
  MAINTAIN: 'Mantenimiento',
  BULK: 'Ganancia Muscular (Volumen +12%)',
  CUT: 'Pérdida de Grasa (Definición -20%)',
  RECOMP: 'Recomposición Corporal',
};

export const NUTRITIONAL_GOAL_LABELS: Record<string, string> = {
  PERFORMANCE: 'Rendimiento Deportivo',
  HYPERTROPHY: 'Hipertrofia Muscular',
  HEALTH: 'Salud General',
  FAT_LOSS_FOCUS: 'Pérdida de Grasa',
};

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  LOW_STOCK: 'Stock Bajo',
  EXPIRED: 'Caducado',
  CONSUMED: 'Consumido',
};

/**
 * Format a DB enum value into Spanish. Falls back to original string if not found.
 */
export function formatEnumLabel(value: string | undefined | null, map: Record<string, string>): string {
  if (!value) return '';
  return map[value] || value;
}
