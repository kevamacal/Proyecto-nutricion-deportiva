import React from 'react';
import { motion } from 'framer-motion';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="brand-badge">React + Vite PWA • Multi-Agent</span>
          <motion.span
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              backgroundColor: statusFlag === 'DEFICIT' ? 'rgba(193, 98, 43, 0.2)' : 'rgba(87, 184, 148, 0.2)',
              color: statusFlag === 'DEFICIT' ? '#E88D53' : '#57B894',
              border: `1px solid ${statusFlag === 'DEFICIT' ? 'var(--accent-ember)' : 'var(--accent-moss)'}`,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {statusFlag === 'DEFICIT' ? '⚡ Requisito Nutricional Pendiente' : '✓ Nutrición Balanceada'}
          </motion.span>
        </div>
      </div>

      <div className="scoreboard-ledger">
        <div className="score-stat">
          <span className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame className="w-4 h-4 text-[#C1622B]" /> Calorías Restantes
          </span>
          <motion.div
            key={remainingBalance.remaining_calories_kcal}
            initial={{ opacity: 0.7, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="score-value"
          >
            {Math.round(remainingBalance.remaining_calories_kcal).toLocaleString()}
            <span className="score-unit">kcal</span>
          </motion.div>
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
                <motion.div
                  className="macro-bar-fill prot"
                  initial={{ width: 0 }}
                  animate={{ width: `${protPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
                />
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Carbohidratos</span>
                <span>{eatenCarb}g / {targetCarb}g</span>
              </div>
              <div className="macro-bar-track">
                <motion.div
                  className="macro-bar-fill carb"
                  initial={{ width: 0 }}
                  animate={{ width: `${carbPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
                />
              </div>
            </div>

            <div className="macro-row">
              <div className="macro-info">
                <span>Grasas</span>
                <span>{eatenFat}g / {targetFat}g</span>
              </div>
              <div className="macro-bar-track">
                <motion.div
                  className="macro-bar-fill fat"
                  initial={{ width: 0 }}
                  animate={{ width: `${fatPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="score-stat">
          <span className="score-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Droplet className="w-4 h-4 text-[#3E6E64]" /> Hidratación Recomendada
          </span>
          <motion.div
            key={hydrationDemandMl}
            initial={{ opacity: 0.7, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="score-value lake"
          >
            {Math.round(hydrationDemandMl).toLocaleString()}
            <span className="score-unit">ml</span>
          </motion.div>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Basado en sudoración & METs
          </span>
        </div>
      </div>
    </header>
  );
};
