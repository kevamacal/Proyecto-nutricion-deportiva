import React from 'react';
import { Activity, Flame, Droplet, ShieldCheck } from 'lucide-react';
import type { RemainingBalance, MacroBalance } from '../types';

interface HeaderScoreboardProps {
  remainingBalance: RemainingBalance;
  hydrationDemandMl: number;
  dailyTargets?: MacroBalance;
  consumed?: MacroBalance;
  statusFlag?: string;
}

export const HeaderScoreboard: React.FC<HeaderScoreboardProps> = ({
  remainingBalance,
  hydrationDemandMl,
  dailyTargets = { calories_kcal: 2200, protein_g: 150, carbohydrates_g: 250, fat_g: 65 },
  consumed = { calories_kcal: 0, protein_g: 0, carbohydrates_g: 0, fat_g: 0 },
  statusFlag = 'DEFICIT',
}) => {
  const targetProt = dailyTargets.protein_g || 150;
  const targetCarb = dailyTargets.carbohydrates_g || 250;
  const targetFat = dailyTargets.fat_g || 65;

  const eatenProt = Math.min(targetProt, Math.round(consumed.protein_g || Math.max(0, targetProt - remainingBalance.remaining_protein_g)));
  const eatenCarb = Math.min(targetCarb, Math.round(consumed.carbohydrates_g || Math.max(0, targetCarb - remainingBalance.remaining_carbs_g)));
  const eatenFat = Math.min(targetFat, Math.round(consumed.fat_g || Math.max(0, targetFat - remainingBalance.remaining_fat_g)));

  const protPct = Math.min(100, Math.round((eatenProt / targetProt) * 100));
  const carbPct = Math.min(100, Math.round((eatenCarb / targetCarb) * 100));
  const fatPct = Math.min(100, Math.round((eatenFat / targetFat) * 100));

  return (
    <header className="app-header">
      <div className="brand-bar">
        <h1 className="brand-title">
          <Activity className="w-7 h-7 text-[#C1622B]" />
          Sports Nutrition & Recovery Engine
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="brand-badge">React + Vite PWA • Multi-Agent</span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: statusFlag === 'DEFICIT' ? 'rgba(193, 98, 43, 0.2)' : 'rgba(46, 117, 89, 0.2)',
              color: statusFlag === 'DEFICIT' ? '#E88D53' : '#57B894',
              border: `1px solid ${statusFlag === 'DEFICIT' ? 'var(--accent-ember)' : 'var(--accent-moss)'}`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {statusFlag === 'DEFICIT' ? '⚡ Requisito Nutricional Pendiente' : '✓ Nutrición Balanceada'}
          </span>
        </div>
      </div>

      <div className="scoreboard-ledger">
        <div className="score-stat">
          <span className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Flame className="w-4 h-4 text-[#C1622B]" /> Calorías Restantes
          </span>
          <div className="score-value">
            {Math.round(remainingBalance.remaining_calories_kcal).toLocaleString()}
            <span className="score-unit">kcal</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Consumidas: {Math.round(consumed.calories_kcal)} / Meta: {Math.round(dailyTargets.calories_kcal)} kcal
          </span>
        </div>

        <div className="score-stat">
          <span className="score-label">Desglose de Macros (Fuel Gauge)</span>
          <div className="macro-gauge-container">
            <div className="macro-row">
              <div className="macro-info">
                <span>Proteínas</span>
                <span>{eatenProt}g / {targetProt}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill prot" style={{ width: `${protPct}%` }}></div>
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Carbohidratos</span>
                <span>{eatenCarb}g / {targetCarb}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill carb" style={{ width: `${carbPct}%` }}></div>
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Grasas</span>
                <span>{eatenFat}g / {targetFat}g</span>
              </div>
              <div className="macro-bar-track">
                <div className="macro-bar-fill fat" style={{ width: `${fatPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="score-stat">
          <span className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Droplet className="w-4 h-4 text-[#4A7C9D]" /> Hidratación Recomendada
          </span>
          <div className="score-value lake">
            {Math.round(hydrationDemandMl).toLocaleString()}
            <span className="score-unit">ml</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Basado en sudoración & METs
          </span>
        </div>
      </div>
    </header>
  );
};
