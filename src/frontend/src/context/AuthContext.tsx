import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type TargetCalculationResponse } from '../services/api';
import { fetchUserProfile, ensureUserProfileExists, updateUserProfile } from '../services/supabaseApi';

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

  // Función auxiliar para construir el perfil unificado en 1 solo paso de red
  const loadFullProfile = async (sbUser: any): Promise<UserProfile> => {
    const userId = sbUser.id;
    const email = sbUser.email || '';
    const name = sbUser.user_metadata?.name || email.split('@')[0] || 'Atleta';
    const primarySport = sbUser.user_metadata?.primary_sport || 'BASKETBALL';

    let remoteProfile = null;
    try {
      remoteProfile = await fetchUserProfile(userId);
    } catch (err) {
      console.warn('Could not sync profile from Supabase:', err);
    }

    const goalVal = remoteProfile?.body_composition_goal || 'BULK';
    const genderVal: 'male' | 'female' = remoteProfile?.gender === 'female' ? 'female' : 'male';

    return {
      id: userId,
      email,
      name,
      primary_sport: primarySport,
      weight_kg: remoteProfile?.weight_kg || 0,
      height_cm: remoteProfile?.height_cm || 0,
      age: remoteProfile?.age || 0,
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
    let isMounted = true;

    // Inicializar sesión única de Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && isMounted) {
        const fullUser = await loadFullProfile(session.user);
        setUser(fullUser);
        setIsDemoMode(false);
      }
      if (isMounted) setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // Suscripción a cambios de auth en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const fullUser = await loadFullProfile(session.user);
        setUser(fullUser);
        setIsDemoMode(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsDemoMode(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
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
        }).catch((err) => console.error('Error updating profile in Supabase:', err));
      }

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
        }).catch((err) => console.error('Error saving targets to Supabase:', err));
      }

      return nextUser;
    });
  };

  const login = async (email: string, password?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      const fullUser = await loadFullProfile(data.user);
      setUser(fullUser);
      setIsDemoMode(false);
    }
  };

  const register = async (email: string, name: string, password?: string, primarySport?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || '',
      options: { data: { name, primary_sport: primarySport || 'BASKETBALL' } },
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      await ensureUserProfileExists(data.user.id, email, name);
      const fullUser = await loadFullProfile(data.user);
      setUser(fullUser);
      setIsDemoMode(false);
    }
  };

  const loginDemo = (email = 'deportista.elite@bioenergetics.app', name = 'Alex Rivera') => {
    setUser({
      id: 'demo-user-id',
      email,
      name,
      weight_kg: 75,
      height_cm: 180,
      age: 25,
      gender: 'male',
      activity_level: 'ACTIVE',
      body_composition_goal: 'BULK',
      primary_sport: 'BASKETBALL',
    });
    setIsDemoMode(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out of Supabase:', err);
    } finally {
      setIsDemoMode(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
