import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  type TargetCalculationResponse,
  loginUser,
  registerUser,
  fetchUserProfile,
  ensureUserProfileExists,
  updateUserProfile,
} from '../services/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  body_composition_goal: string;
  primary_sport?: string;
  targets?: TargetCalculationResponse;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setTargets: (targets: TargetCalculationResponse) => void;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, password?: string, primarySport?: string) => Promise<void>;
  loginDemo: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFullProfile = async (authRes: any): Promise<UserProfile> => {
    const userId = authRes.user_id;
    const email = authRes.email || '';
    const name = authRes.name || email.split('@')[0] || 'Atleta';
    const primarySport = authRes.primary_sport || 'BASKETBALL';

    let remoteProfile = null;
    try {
      remoteProfile = await fetchUserProfile(userId);
    } catch (err) {
      console.warn('Could not sync profile from FastAPI:', err);
    }

    const goalVal = remoteProfile?.body_composition_goal || 'BULK';
    const genderVal: 'male' | 'female' = remoteProfile?.gender === 'female' ? 'female' : 'male';

    return {
      id: userId,
      email,
      name,
      primary_sport: primarySport,
      weight_kg: remoteProfile?.weight_kg || 70,
      height_cm: remoteProfile?.height_cm || 175,
      age: remoteProfile?.age || 25,
      gender: genderVal,
      activity_level: remoteProfile?.activity_level || 'ACTIVE',
      body_composition_goal: goalVal,
      targets: remoteProfile?.daily_calories_target
        ? {
            user_id: userId,
            bmr_kcal: 0,
            base_tdee_kcal: 0,
            calories_target_kcal: remoteProfile.daily_calories_target,
            protein_target_g: remoteProfile.daily_protein_g_target,
            carbs_target_g: remoteProfile.daily_carbs_g_target,
            fat_target_g: remoteProfile.daily_fat_g_target,
          }
        : undefined,
    };
  };

  useEffect(() => {
    // Read cached session if available in localStorage
    const savedUser = localStorage.getItem('sports_app_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sports_app_user');
      }
    }
    setIsLoading(false);
  }, []);

  const updateProfile = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const targetGoal = updatedFields.body_composition_goal || prev.body_composition_goal;
      const nextUser = { ...prev, ...updatedFields, body_composition_goal: targetGoal };

      if (!isDemoMode && nextUser.id) {
        updateUserProfile(nextUser.id, {
          weight_kg: updatedFields.weight_kg,
          height_cm: updatedFields.height_cm,
          age: updatedFields.age,
          gender: updatedFields.gender,
          activity_level: updatedFields.activity_level,
          body_composition_goal: targetGoal,
        }).catch((err) => console.error('Error updating profile in FastAPI:', err));
      }

      localStorage.setItem('sports_app_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const setTargets = (targets: TargetCalculationResponse) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, targets };

      if (!isDemoMode && nextUser.id) {
        updateUserProfile(nextUser.id, {
          daily_calories_target: targets.calories_target_kcal,
          daily_protein_g_target: targets.protein_target_g,
          daily_carbs_g_target: targets.carbs_target_g,
          daily_fat_g_target: targets.fat_target_g,
        }).catch((err) => console.error('Error saving targets to FastAPI:', err));
      }

      localStorage.setItem('sports_app_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const login = async (email: string, password?: string) => {
    const authRes = await loginUser(email, password);
    if (authRes.user_id) {
      const fullUser = await loadFullProfile(authRes);
      setUser(fullUser);
      setIsDemoMode(false);
      localStorage.setItem('sports_app_user', JSON.stringify(fullUser));
    }
  };

  const register = async (email: string, name: string, password?: string, primarySport?: string) => {
    const authRes = await registerUser(email, name, password, primarySport);
    if (authRes.user_id) {
      await ensureUserProfileExists(authRes.user_id, email, name);
      const fullUser = await loadFullProfile(authRes);
      setUser(fullUser);
      setIsDemoMode(false);
      localStorage.setItem('sports_app_user', JSON.stringify(fullUser));
    }
  };

  const loginDemo = (email = 'deportista.elite@bioenergetics.app', name = 'Alex Rivera') => {
    const demoUser: UserProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email,
      name,
      weight_kg: 75,
      height_cm: 180,
      age: 25,
      gender: 'male',
      activity_level: 'ACTIVE',
      body_composition_goal: 'BULK',
      primary_sport: 'BASKETBALL',
    };
    setUser(demoUser);
    setIsDemoMode(true);
    localStorage.setItem('sports_app_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    setIsDemoMode(false);
    setUser(null);
    localStorage.removeItem('sports_app_user');
  };

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isDemoMode,
      isLoading,
      updateProfile,
      setTargets,
      login,
      register,
      loginDemo,
      logout,
    }),
    [user, isDemoMode, isLoading, updateProfile, setTargets]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
