import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HeaderScoreboard } from './components/HeaderScoreboard';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { AgentChatPanel } from './components/AgentChatPanel';
import { PantryManager } from './components/PantryManager';
import { ProfileOnboarding } from './components/Profile/ProfileOnboarding';
import { ProfileWizard } from './components/Flow/ProfileWizard';
import { TargetsConfirmation } from './components/Flow/TargetsConfirmation';
import { GuidedPantrySetup } from './components/Flow/GuidedPantrySetup';
import { AuthScreen } from './components/Auth/AuthScreen';
import { WorkoutLoggingModal } from './components/Sports/WorkoutLoggingModal';
import { MealLoggingModal } from './components/Meals/MealLoggingModal';
import type { RemainingBalance, PantryItem, AgentQueryResult, MacroBalance, LoggedActivityEntry } from './types';
import type { CanonicalAppState, CalculatedTargetsData } from './types/flow';
import { calculateTargets } from './services/api';
import {
  fetchDailySummary,
  fetchPantryInventory,
  deletePantryItem,
  fetchLoggedActivitiesForDate,
  deleteActivitySession,
} from './services/supabaseApi';
import { User, Bot, ShoppingBag, Trophy, Activity } from 'lucide-react';

const TODAY_DATE = new Date().toISOString().split('T')[0];

const MainSPAContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateProfile, setTargets } = useAuth();

  // Canonical State Machine State
  const [appState, setAppState] = useState<CanonicalAppState>('ONBOARDING_PROFILE');
  const [pendingTargets, setPendingTargets] = useState<CalculatedTargetsData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'SCOREBOARD' | 'PANTRY' | 'PROFILE' | 'CHAT'>('SCOREBOARD');

  // Modals state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedWorkoutToEdit, setSelectedWorkoutToEdit] = useState<LoggedActivityEntry | null>(null);
  const [isMealOpen, setIsMealOpen] = useState(false);
  const [loggedActivities, setLoggedActivities] = useState<LoggedActivityEntry[]>([]);

  // Targets from Auth Context or fallback
  const dailyTargets: MacroBalance = user?.targets
    ? {
      calories_kcal: user.targets.calories_target_kcal,
      protein_g: user.targets.protein_target_g,
      carbohydrates_g: user.targets.carbs_target_g,
      fat_g: user.targets.fat_target_g,
    }
    : {
      calories_kcal: 2500,
      protein_g: 160,
      carbohydrates_g: 280,
      fat_g: 70,
    };

  const [consumed, setConsumed] = useState<MacroBalance>({
    calories_kcal: 0,
    protein_g: 0,
    carbohydrates_g: 0,
    fat_g: 0,
  });

  const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>({
    remaining_calories_kcal: dailyTargets.calories_kcal,
    remaining_protein_g: dailyTargets.protein_g,
    remaining_carbs_g: dailyTargets.carbohydrates_g,
    remaining_fat_g: dailyTargets.fat_g,
  });

  const [hydrationDemandMl, setHydrationDemandMl] = useState<number>(0);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [triggerQuery, setTriggerQuery] = useState<string | null>(null);

  // Evaluate state machine based on real data
  const evaluateAppState = async () => {
    if (!user) {
      setIsEvaluating(false);
      return;
    }
    setIsEvaluating(true);
    try {
      // Check profile metrics
      if (!user.weight_kg || !user.height_cm || !user.age) {
        setAppState('ONBOARDING_PROFILE');
        return;
      }

      if (!user.targets) {
        // Calculate targets deterministically via backend
        const calc = await calculateTargets({
          user_id: user.id,
          weight_kg: user.weight_kg,
          height_cm: user.height_cm,
          age: user.age,
          gender: user.gender || 'male',
          activity_level: user.activity_level || 'ACTIVE',
          body_composition_goal: user.body_composition_goal || 'BULK',
        });
        setPendingTargets(calc);
        setAppState('ONBOARDING_TARGETS');
        return;
      }

      // Check pantry inventory directly from Supabase
      const items = await fetchPantryInventory(user.id);
      setPantryItems(items);

      // Check logged activities for today
      const activities = await fetchLoggedActivitiesForDate(user.id, TODAY_DATE);
      setLoggedActivities(activities);

      const activeKcalBurned = activities.reduce((acc, a) => acc + (a.estimated_expenditure_kcal || 0), 0);
      const totalHydrationDemand = activities.reduce((acc, a) => acc + (a.basketball_details?.hydration_demand_ml || 0), 0);
      setHydrationDemandMl(totalHydrationDemand);

      if (items.length === 0) {
        setAppState('PANTRY_EMPTY_GUIDED');
        return;
      }

      // Check daily logs directly from Supabase
      const summary = await fetchDailySummary(user.id, TODAY_DATE);
      setConsumed({
        calories_kcal: summary.consumed_calories_kcal,
        protein_g: summary.consumed_protein_g,
        carbohydrates_g: summary.consumed_carbohydrates_g,
        fat_g: summary.consumed_fat_g,
      });

      const adjustedCaloriesTarget = dailyTargets.calories_kcal + activeKcalBurned;
      const remCal = Math.max(0, adjustedCaloriesTarget - summary.consumed_calories_kcal);
      const remProt = Math.max(0, dailyTargets.protein_g - summary.consumed_protein_g);
      const remCarb = Math.max(0, dailyTargets.carbohydrates_g - summary.consumed_carbohydrates_g);
      const remFat = Math.max(0, dailyTargets.fat_g - summary.consumed_fat_g);

      setRemainingBalance({
        remaining_calories_kcal: remCal,
        remaining_protein_g: remProt,
        remaining_carbs_g: remCarb,
        remaining_fat_g: remFat,
      });

      if (summary.meals_logged_count === 0 && summary.consumed_calories_kcal === 0 && activities.length === 0) {
        setAppState('ACTIVE_NO_LOGS_TODAY');
      } else {
        setAppState('ACTIVE_IN_PROGRESS');
      }
    } catch (err) {
      console.error('Error evaluating app state:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      evaluateAppState();
    }
  }, [isAuthenticated, user?.id, user?.weight_kg, user?.targets]);

  const handleProfileWizardComplete = async (profileData: any) => {
    updateProfile(profileData);
    const calc = await calculateTargets(profileData);
    setPendingTargets(calc);
    setAppState('ONBOARDING_TARGETS');
  };

  const handleConfirmTargets = () => {
    if (pendingTargets) {
      setTargets(pendingTargets);
    }
    evaluateAppState();
  };

  const handleQueryResult = (result: AgentQueryResult) => {
    if (result.sports_output?.hydration_demand_ml) {
      setHydrationDemandMl(result.sports_output.hydration_demand_ml);
    }

    if (result.nutrition_output) {
      setRemainingBalance(result.nutrition_output.remaining_balance);
      setConsumed(result.nutrition_output.consumed);
    }

    if (result.inventory_output?.inventory_items) {
      setPantryItems(result.inventory_output.inventory_items);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deletePantryItem(itemId);
      await evaluateAppState();
    } catch (err) {
      console.error('Error deleting item from pantry:', err);
    }
  };

  const handleSendChatQuery = (queryText: string) => {
    setTriggerQuery(queryText);
    setActiveTab('CHAT');
  };

  const handleOpenWorkoutModal = (activityToEdit?: LoggedActivityEntry | null) => {
    setSelectedWorkoutToEdit(activityToEdit || null);
    setIsWorkoutModalOpen(true);
  };

  const handleDeleteActivitySession = async (activityId: string) => {
    try {
      await deleteActivitySession(activityId);
      await evaluateAppState();
    } catch (err) {
      console.error('Error deleting activity session:', err);
    }
  };

  // Loading screen while AuthContext initializes or state machine evaluates profile/inventory
  if (isLoading || (isAuthenticated && isEvaluating)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-court)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-chalk)',
          padding: '2rem',
        }}
      >
        <motion.div
          animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
        >
          <Activity size={52} style={{ color: 'var(--accent-ember)' }} />
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '0.4rem',
              }}
            >
              Cargando tus Datos
            </h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', maxWidth: '360px' }}>
              Preparando tus objetivos nutricionales y tu despensa...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // If unauthenticated or no user, render AuthScreen
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // State Machine Screen Renderers for Onboarding Flows
  if (appState === 'ONBOARDING_PROFILE') {
    return <ProfileWizard onComplete={handleProfileWizardComplete} />;
  }

  if (appState === 'ONBOARDING_TARGETS' && pendingTargets) {
    return (
      <TargetsConfirmation
        targets={pendingTargets}
        onConfirm={handleConfirmTargets}
      />
    );
  }

  if (appState === 'PANTRY_EMPTY_GUIDED') {
    return (
      <GuidedPantrySetup
        userId={user.id}
        onItemAdded={evaluateAppState}
      />
    );
  }

  // Active Main SPA View (Mobile-First Layout)
  return (
    <div className="app-main-wrapper">
      <HeaderScoreboard />

      {/* Main Content Area */}
      <main className="app-container">
        <AnimatePresence mode="wait">
          {activeTab === 'SCOREBOARD' && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              <DashboardOverview
                userId={user.id}
                remainingBalance={remainingBalance}
                consumed={consumed}
                dailyTargets={dailyTargets}
                hydrationDemandMl={hydrationDemandMl}
                pantryItems={pantryItems}
                loggedActivities={loggedActivities}
                onOpenWorkoutModal={() => handleOpenWorkoutModal(null)}
                onOpenMeal={() => setIsMealOpen(true)}
                onEditActivity={(activity) => handleOpenWorkoutModal(activity)}
                onDeleteActivity={handleDeleteActivitySession}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onSendChatQuery={handleSendChatQuery}
              />
            </motion.div>
          )}

          {activeTab === 'PANTRY' && (
            <motion.div
              key="pantry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              <PantryManager
                items={pantryItems}
                userId={user.id}
                onRefresh={evaluateAppState}
                onQuickWorkout={() => handleOpenWorkoutModal(null)}
                onDeleteItem={handleDeleteItem}
                onMealLogged={evaluateAppState}
              />
            </motion.div>
          )}

          {activeTab === 'CHAT' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              <AgentChatPanel
                onQueryResult={handleQueryResult}
                triggerQuery={triggerQuery}
                onClearTrigger={() => setTriggerQuery(null)}
              />
            </motion.div>
          )}

          {activeTab === 'PROFILE' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              <ProfileOnboarding onComplete={evaluateAppState} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Unified Workout & Meal Logging Modals */}
      <WorkoutLoggingModal
        isOpen={isWorkoutModalOpen}
        initialActivity={selectedWorkoutToEdit}
        onClose={() => {
          setIsWorkoutModalOpen(false);
          setSelectedWorkoutToEdit(null);
        }}
        onSuccess={() => {
          evaluateAppState();
          setTriggerQuery('Acabo de registrar una sesión de entrenamiento. ¿Qué me recomiendas cenar con mi inventario?');
          setActiveTab('CHAT');
        }}
      />

      <MealLoggingModal
        isOpen={isMealOpen}
        onClose={() => setIsMealOpen(false)}
        onSuccess={evaluateAppState}
      />


      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('SCOREBOARD')}
          className={`nav-item ${activeTab === 'SCOREBOARD' ? 'active' : ''}`}
        >
          <Trophy size={20} />
          <span className="nav-label">Tablero</span>
        </button>
        <button
          onClick={() => setActiveTab('PANTRY')}
          className={`nav-item ${activeTab === 'PANTRY' ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span className="nav-label">Despensa</span>
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`nav-item ${activeTab === 'CHAT' ? 'active' : ''}`}
        >
          <Bot size={20} />
          <span className="nav-label">Asistente</span>
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
        >
          <User size={20} />
          <span className="nav-label">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainSPAContent />
    </AuthProvider>
  );
};

export default App;
