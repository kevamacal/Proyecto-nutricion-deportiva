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
import { BasketballLogModal } from './components/Sports/BasketballLogModal';
import { StrengthLogModal } from './components/Sports/StrengthLogModal';
import { MealLoggingModal } from './components/Meals/MealLoggingModal';
import type { RemainingBalance, PantryItem, AgentQueryResult, MacroBalance } from './types';
import type { CanonicalAppState, CalculatedTargetsData } from './types/flow';
import { calculateTargets } from './services/api';
import {
  fetchDailySummary,
  fetchPantryInventory,
  deletePantryItem,
} from './services/supabaseApi';
import { User, Bot, ShoppingBag, Trophy, LogOut } from 'lucide-react';

const TODAY_DATE = '2026-09-15';

const MainSPAContent: React.FC = () => {
  const { user, isAuthenticated, isDemoMode, logout, updateProfile, setTargets } = useAuth();

  // If unauthenticated or no user, render AuthScreen
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Canonical State Machine State
  const [appState, setAppState] = useState<CanonicalAppState>('ONBOARDING_PROFILE');
  const [pendingTargets, setPendingTargets] = useState<CalculatedTargetsData | null>(null);

  const [activeTab, setActiveTab] = useState<'SCOREBOARD' | 'PANTRY' | 'PROFILE' | 'CHAT'>('SCOREBOARD');

  // Modals state
  const [isBasketballOpen, setIsBasketballOpen] = useState(false);
  const [isStrengthOpen, setIsStrengthOpen] = useState(false);
  const [isMealOpen, setIsMealOpen] = useState(false);

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
  const [statusFlag, setStatusFlag] = useState<string>('DEFICIT');
  const [triggerQuery, setTriggerQuery] = useState<string | null>(null);

  // Evaluate state machine based on real data
  const evaluateAppState = async () => {
    if (!user) return;
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
          sex: user.sex || 'male',
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

      const remCal = Math.max(0, dailyTargets.calories_kcal - summary.consumed_calories_kcal);
      const remProt = Math.max(0, dailyTargets.protein_g - summary.consumed_protein_g);
      const remCarb = Math.max(0, dailyTargets.carbohydrates_g - summary.consumed_carbohydrates_g);
      const remFat = Math.max(0, dailyTargets.fat_g - summary.consumed_fat_g);

      setRemainingBalance({
        remaining_calories_kcal: remCal,
        remaining_protein_g: remProt,
        remaining_carbs_g: remCarb,
        remaining_fat_g: remFat,
      });

      if (summary.meals_logged_count === 0 && summary.consumed_calories_kcal === 0) {
        setAppState('ACTIVE_NO_LOGS_TODAY');
      } else {
        setAppState('ACTIVE_IN_PROGRESS');
      }
    } catch (err) {
      console.error('Error evaluating app state:', err);
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
      setStatusFlag(result.nutrition_output.nutritional_status_flag);
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

  // State Machine Screen Renderers for Onboarding Flows (Clean, dedicated views without zeroed header above)
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

  // Active Main SPA View (Dashboard, Pantry, Chat, Profile)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderScoreboard
        remainingBalance={remainingBalance}
        hydrationDemandMl={hydrationDemandMl}
        dailyTargets={dailyTargets}
        consumed={consumed}
        statusFlag={statusFlag}
      />

      {/* Navigation Tab Bar */}
      <nav
        style={{
          backgroundColor: 'var(--surface-hardwood)',
          borderBottom: '1px solid var(--line-heavy)',
          padding: '0.75rem 2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setActiveTab('SCOREBOARD')}
          className={`btn-action-pill ${activeTab === 'SCOREBOARD' ? 'primary' : ''}`}
          style={{ gap: '0.5rem' }}
        >
          <Trophy size={16} /> Tablero Principal
        </button>
        <button
          onClick={() => setActiveTab('PANTRY')}
          className={`btn-action-pill ${activeTab === 'PANTRY' ? 'primary' : ''}`}
          style={{ gap: '0.5rem' }}
        >
          <ShoppingBag size={16} /> Despensa ({pantryItems.length})
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`btn-action-pill ${activeTab === 'CHAT' ? 'primary' : ''}`}
          style={{ gap: '0.5rem' }}
        >
          <Bot size={16} /> Asistente IA
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`btn-action-pill ${activeTab === 'PROFILE' ? 'primary' : ''}`}
          style={{ gap: '0.5rem' }}
        >
          <User size={16} /> Mi Perfil Antropométrico
        </button>

        {/* User Identity & Logout Button */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              fontSize: '0.78rem',
              lineHeight: 1.2,
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
              {user.name || user.email || 'Atleta Autenticado'}
            </span>
            <span style={{ fontSize: '0.7rem', color: isDemoMode ? '#00E676' : 'var(--ink-muted)' }}>
              {isDemoMode ? '⚡ Modo Demo' : user.email || 'Supabase Auth'}
            </span>
          </div>
          <button
            onClick={() => logout()}
            title="Cerrar Sesión"
            className="btn-action-pill"
            style={{
              padding: '0.45rem 0.75rem',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              color: '#FF3366',
              gap: '0.35rem',
              fontSize: '0.8rem',
            }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </nav>

      <main className="app-container" style={{ flex: 1, padding: '2rem' }}>
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
                remainingBalance={remainingBalance}
                consumed={consumed}
                dailyTargets={dailyTargets}
                hydrationDemandMl={hydrationDemandMl}
                pantryItems={pantryItems}
                statusFlag={statusFlag}
                onOpenBasketball={() => setIsBasketballOpen(true)}
                onOpenStrength={() => setIsStrengthOpen(true)}
                onOpenMeal={() => setIsMealOpen(true)}
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
                onQuickBasketball={() => setIsBasketballOpen(true)}
                onQuickGym={() => setIsStrengthOpen(true)}
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

      {/* Sports & Meal Logging Modals */}
      <BasketballLogModal
        isOpen={isBasketballOpen}
        onClose={() => setIsBasketballOpen(false)}
        onSuccess={(hydration) => {
          setHydrationDemandMl(hydration);
          evaluateAppState();
          setTriggerQuery('Acabo de jugar al baloncesto. ¿Qué puedo cenar con mi despensa para recuperarme?');
          setActiveTab('CHAT');
        }}
      />

      <StrengthLogModal
        isOpen={isStrengthOpen}
        onClose={() => setIsStrengthOpen(false)}
        onSuccess={() => {
          evaluateAppState();
          setTriggerQuery('Terminé mi entrenamiento de fuerza. ¿Qué comida post-entreno me recomiendas según mi inventario?');
          setActiveTab('CHAT');
        }}
      />

      <MealLoggingModal
        isOpen={isMealOpen}
        onClose={() => setIsMealOpen(false)}
        onSuccess={evaluateAppState}
      />
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
