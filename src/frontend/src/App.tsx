import React, { useState } from 'react';
import { HeaderScoreboard } from './components/HeaderScoreboard';
import { AgentChatPanel } from './components/AgentChatPanel';
import { PantryManager } from './components/PantryManager';
import type { RemainingBalance, PantryItem, AgentQueryResult } from './types';

const defaultRemaining: RemainingBalance = {
  remaining_calories_kcal: 1300,
  remaining_protein_g: 45,
  remaining_carbs_g: 180,
  remaining_fat_g: 20,
};

const defaultPantry: PantryItem[] = [
  {
    inventory_item_id: '8f3e2d1c-0b9a-8f7e-6d5c-4b3a2f1e0d9c',
    food_item_id: 'c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
    name: 'Pechuga de Pollo',
    category: 'Aves',
    available_quantity: 400,
    unit: 'g',
    expiration_date: '2026-09-18',
    days_until_expiration: 3,
    status: 'AVAILABLE',
    density_class: 'PROTEIN_DENSE',
  },
  {
    inventory_item_id: '7a6b5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d',
    food_item_id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    name: 'Arroz Blanco',
    category: 'Granos',
    available_quantity: 1000,
    unit: 'g',
    expiration_date: null,
    days_until_expiration: null,
    status: 'AVAILABLE',
    density_class: 'CARB_DENSE',
  },
  {
    inventory_item_id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    food_item_id: 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c',
    name: 'Huevos Frescos',
    category: 'Proteínas',
    available_quantity: 12,
    unit: 'uds',
    expiration_date: '2026-09-25',
    days_until_expiration: 10,
    status: 'AVAILABLE',
    density_class: 'PROTEIN_DENSE',
  },
  {
    inventory_item_id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
    food_item_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Plátanos Maduros',
    category: 'Frutas',
    available_quantity: 6,
    unit: 'uds',
    expiration_date: '2026-09-19',
    days_until_expiration: 4,
    status: 'AVAILABLE',
    density_class: 'CARB_DENSE',
  },
];

export const App: React.FC = () => {
  const [remainingBalance, setRemainingBalance] = useState<RemainingBalance>(defaultRemaining);
  const [hydrationDemandMl, setHydrationDemandMl] = useState<number>(1125);
  const [pantryItems] = useState<PantryItem[]>(defaultPantry);

  const handleQueryResult = (result: AgentQueryResult) => {
    if (result.sports_output?.hydration_demand_ml) {
      setHydrationDemandMl(result.sports_output.hydration_demand_ml);
    }

    if (result.nutrition_output?.remaining_balance) {
      setRemainingBalance(result.nutrition_output.remaining_balance);
    }
  };

  const triggerBasketballQuery = () => {
    // Handled inside AgentChatPanel
  };

  const triggerGymQuery = () => {
    // Handled inside AgentChatPanel
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderScoreboard
        remainingBalance={remainingBalance}
        hydrationDemandMl={hydrationDemandMl}
      />

      <main className="app-container">
        <PantryManager
          items={pantryItems}
          onQuickBasketball={triggerBasketballQuery}
          onQuickGym={triggerGymQuery}
        />

        <AgentChatPanel
          onQueryResult={handleQueryResult}
          onQuickQuery={() => {}}
        />
      </main>
    </div>
  );
};

export default App;
