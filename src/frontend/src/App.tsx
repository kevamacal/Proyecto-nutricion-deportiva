import React, { useState, useEffect } from 'react';
import { HeaderScoreboard } from './components/HeaderScoreboard';
import { AgentChatPanel } from './components/AgentChatPanel';
import { PantryManager } from './components/PantryManager';
import type { RemainingBalance, PantryItem, AgentQueryResult, MacroBalance } from './types';
import {
  fetchDailySummary,
  fetchPantryInventory,
  deletePantryItem,
  logActivity,
} from './services/api';

const DEFAULT_USER_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const TODAY_DATE = '2026-09-15';

export const App: React.FC = () => {
  const [userWeightKg] = useState<number>(75.0);
  const [dailyTargets] = useState<MacroBalance>({
    calories_kcal: 2200,
    protein_g: 150,
    carbohydrates_g: 250,
    fat_g: 65,
  });

  const [consumed, setConsumed] = useState<MacroBalance>({
    calories_kcal: 0,
    protein_g: 0,
    carbohydrates_g: 0,
    fat_g: 0,
  });

  const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>({
    remaining_calories_kcal: 2200,
    remaining_protein_g: 150,
    remaining_carbs_g: 250,
    remaining_fat_g: 65,
  });

  const [hydrationDemandMl, setHydrationDemandMl] = useState<number>(0);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [statusFlag, setStatusFlag] = useState<string>('DEFICIT');
  const [triggerQuery, setTriggerQuery] = useState<string | null>(null);

  // Load real user data on component mount
  const loadUserData = async () => {
    try {
      // 1. Fetch inventory
      const items = await fetchPantryInventory(DEFAULT_USER_ID);
      setPantryItems(items);

      // 2. Fetch daily intake summary
      const summary = await fetchDailySummary(DEFAULT_USER_ID, TODAY_DATE);
      setConsumed({
        calories_kcal: summary.consumed_calories_kcal,
        protein_g: summary.consumed_protein_g,
        carbohydrates_g: summary.consumed_carbohydrates_g,
        fat_g: summary.consumed_fat_g,
      });

      // Recalculate remaining
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
    } catch (err) {
      console.error('Error initializing user data:', err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

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

  const handleQuickBasketball = async () => {
    try {
      await logActivity({
        user_id: DEFAULT_USER_ID,
        sport_type: 'Basketball',
        duration_minutes: 90,
        weight_kg: userWeightKg,
        intensity: 'high',
      });
      setHydrationDemandMl(1125);
      await loadUserData();
      setTriggerQuery('Jugué 90 minutos de baloncesto, ¿qué cenar con mi despensa?');
    } catch (err) {
      console.error('Error logging basketball session:', err);
    }
  };

  const handleQuickGym = async () => {
    try {
      await logActivity({
        user_id: DEFAULT_USER_ID,
        sport_type: 'Strength Training',
        duration_minutes: 60,
        weight_kg: userWeightKg,
        intensity: 'high',
      });
      setHydrationDemandMl(750);
      await loadUserData();
      setTriggerQuery('Acabo de hacer 60 min de entrenamiento de fuerza/gimnasio. ¿Qué puedo comer post-entreno con mi despensa?');
    } catch (err) {
      console.error('Error logging gym session:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deletePantryItem(itemId);
      await loadUserData();
    } catch (err) {
      alert('Error eliminando ítem de la despensa');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderScoreboard
        remainingBalance={remainingBalance}
        hydrationDemandMl={hydrationDemandMl}
        dailyTargets={dailyTargets}
        consumed={consumed}
        statusFlag={statusFlag}
      />

      <main className="app-container">
        <PantryManager
          items={pantryItems}
          userId={DEFAULT_USER_ID}
          onRefresh={loadUserData}
          onQuickBasketball={handleQuickBasketball}
          onQuickGym={handleQuickGym}
          onDeleteItem={handleDeleteItem}
          onMealLogged={loadUserData}
        />

        <AgentChatPanel
          onQueryResult={handleQueryResult}
          triggerQuery={triggerQuery}
          onClearTrigger={() => setTriggerQuery(null)}
        />
      </main>
    </div>
  );
};

export default App;
