import React from 'react';
import { Activity } from 'lucide-react';
import type { RemainingBalance } from '../types';

interface HeaderScoreboardProps {
  remainingBalance: RemainingBalance;
  hydrationDemandMl: number;
}

export const HeaderScoreboard: React.FC<HeaderScoreboardProps> = ({
  remainingBalance,
  hydrationDemandMl,
}) => {
  const targetProt = 160;
  const targetCarb = 390;
  const targetFat = 70;

  const protPct = Math.min(100, Math.round(((targetProt - remainingBalance.remaining_protein_g) / targetProt) * 100));
  const carbPct = Math.min(100, Math.round(((targetCarb - remainingBalance.remaining_carbs_g) / targetCarb) * 100));
  const fatPct = Math.min(100, Math.round(((targetFat - remainingBalance.remaining_fat_g) / targetFat) * 100));

  return (
    <header className="app-header">
      <div className="brand-bar">
        <h1 className="brand-title">
          <Activity className="w-7 h-7 text-[#C1622B]" />
          Sports Nutrition & Recovery Engine
        </h1>
        <span className="brand-badge">React + Vite PWA • Multi-Agent</span>
      </div>

      <div className="scoreboard-ledger">
        <div className="score-stat">
          <span className="score-label">Calorías Restantes</span>
          <div className="score-value">
            {remainingBalance.remaining_calories_kcal.toLocaleString()}
            <span className="score-unit">kcal</span>
          </div>
        </div>

        <div className="score-stat">
          <span className="score-label">Desglose de Macros (Fuel Gauge)</span>
          <div className="macro-gauge-container">
            <div className="macro-row">
              <div className="macro-info">
                <span>Proteínas</span>
                <span>{Math.max(0, targetProt - remainingBalance.remaining_protein_g)}g / {targetProt}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill prot" style={{ width: `${protPct}%` }}></div>
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Carbohidratos</span>
                <span>{Math.max(0, targetCarb - remainingBalance.remaining_carbs_g)}g / {targetCarb}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill carb" style={{ width: `${carbPct}%` }}></div>
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Grasas</span>
                <span>{Math.max(0, targetFat - remainingBalance.remaining_fat_g)}g / {targetFat}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill fat" style={{ width: `${fatPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="score-stat">
          <span className="score-label">Hidratación Recomendada</span>
          <div className="score-value lake">
            {hydrationDemandMl.toLocaleString()}
            <span className="score-unit">ml</span>
          </div>
        </div>
      </div>
    </header>
  );
};
