export type CanonicalAppState =
  | 'ONBOARDING_PROFILE'
  | 'ONBOARDING_TARGETS'
  | 'PANTRY_EMPTY_GUIDED'
  | 'ACTIVE_NO_LOGS_TODAY'
  | 'ACTIVE_IN_PROGRESS';

export interface UserProfileStateData {
  user_id: string;
  age?: number;
  gender?: 'male' | 'female';
  weight_kg?: number;
  height_cm?: number;
  activity_level?: string;
  body_composition_goal?: string;
}

export interface CalculatedTargetsData {
  user_id: string;
  bmr_kcal: number;
  base_tdee_kcal: number;
  calories_target_kcal: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}
