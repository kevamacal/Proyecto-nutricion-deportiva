/* TypeScript interface definitions for Sports Nutrition Platform */

export interface MacroBalance {
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
}

export interface RemainingBalance {
  remaining_calories_kcal: number;
  remaining_protein_g: number;
  remaining_carbs_g: number;
  remaining_fat_g: number;
}

export interface SportsOutput {
  sport: string;
  session_category?: string;
  training_type?: string;
  duration_minutes: number;
  estimated_expenditure_kcal: number;
  met_value_used?: number;
  carb_demand_g?: number;
  protein_demand_g?: number;
  hydration_demand_ml?: number;
  recovery_priority: string;
}

export interface NutritionOutput {
  user_id: string;
  date: string;
  daily_targets: MacroBalance;
  consumed: MacroBalance & { logged_meals_count: number };
  activity_expenditure: {
    total_expenditure_kcal: number;
    additional_carbs_demand_g: number;
    logged_activities_count: number;
  };
  adjusted_targets: MacroBalance;
  remaining_balance: RemainingBalance;
  nutritional_status_flag: 'SURPLUS' | 'DEFICIT' | 'BALANCED';
}

export interface PantryItem {
  inventory_item_id: string;
  food_item_id: string;
  name: string;
  category: string;
  available_quantity: number;
  unit: string;
  expiration_date: string | null;
  days_until_expiration: number | null;
  status: string;
  density_class: 'PROTEIN_DENSE' | 'CARB_DENSE' | 'FAT_DENSE' | 'BALANCED';
  nutrition?: {
    serving_size: number;
    calories_kcal: number;
    protein_g: number;
    carbohydrates_g: number;
    fat_g: number;
  };
}

export interface RecipeIngredient {
  food_item_id: string | null;
  name: string;
  quantity_used: number;
  unit: string;
  is_from_inventory: boolean;
}

export interface RecipeStep {
  step_number: number;
  instruction: string;
}

export interface RecipeOutput {
  recipe_name: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  servings: number;
  ingredients_used: RecipeIngredient[];
  preparation_steps: RecipeStep[];
  estimated_nutritional_summary: MacroBalance;
  nutritional_fit_score: number;
  explanation: string;
}

export interface AgentQueryResult {
  query: string;
  user_id: string;
  intent: string;
  execution_path: string[];
  final_response: string;
  sports_output?: SportsOutput | null;
  nutrition_output?: NutritionOutput | null;
  inventory_output?: { user_id: string; total_items_found: number; inventory_items: PantryItem[] } | null;
  recipe_output?: RecipeOutput | null;
}

export interface LoggedMealItem {
  id?: string;
  meal_id?: string;
  food_item_id?: string;
  name?: string;
  quantity: number;
  unit: string;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
}

export interface LoggedMealEntry {
  id: string;
  user_id: string;
  meal_type: string;
  name?: string;
  logged_at: string;
  total_calories_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string;
  items?: LoggedMealItem[];
}

export interface StrengthExerciseSet {
  id: string;
  exercise_name: string;
  reps: number;
  weight_kg: number;
  rpe?: number;
  rest_seconds?: number;
}

export interface BasketballLogPayload {
  duration_minutes: number;
  session_category: 'TRAINING' | 'MATCH';
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  notes?: string;
}

export interface StrengthLogPayload {
  duration_minutes: number;
  training_type: 'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE';
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  muscle_groups: string[];
  sets: StrengthExerciseSet[];
  total_volume_kg: number;
  total_sets: number;
  total_reps: number;
  notes?: string;
}

export interface LoggedActivityEntry {
  id: string;
  user_id: string;
  sport: 'BASKETBALL' | 'STRENGTH_TRAINING';
  session_type: string;
  duration_minutes: number;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  date: string;
  estimated_expenditure_kcal: number;
  basketball_details?: {
    id?: string;
    session_category: 'TRAINING' | 'MATCH';
    carb_demand_g: number;
    hydration_demand_ml: number;
    recovery_priority: string;
  };
  strength_details?: {
    id?: string;
    training_type: 'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE';
    protein_demand_g: number;
    targeted_muscle_groups?: string[];
    total_volume_kg?: number;
    total_sets?: number;
    total_reps?: number;
  };
}


