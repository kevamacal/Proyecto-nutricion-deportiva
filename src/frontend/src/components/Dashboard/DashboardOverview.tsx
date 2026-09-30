import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  Activity,
  ShoppingBag,
  ChevronRight,
  Droplet,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { RemainingBalance, MacroBalance, PantryItem, LoggedMealEntry, LoggedActivityEntry } from '../../types';
import { fetchLoggedMealsForDate } from '../../services/supabaseApi';
import { LoggedMealCard } from '../Meals/LoggedMealCard';
import { LoggedWorkoutsTimeline } from '../Sports/LoggedWorkoutsTimeline';
import { WaterIntakeCard } from '../Common/WaterIntakeCard';

interface DashboardOverviewProps {
  userId?: string;
  remainingBalance: RemainingBalance;
  consumed: MacroBalance;
  dailyTargets: MacroBalance;
  hydrationDemandMl: number;
  workoutHydrationMl?: number;
  pantryItems: PantryItem[];
  loggedActivities: LoggedActivityEntry[];
  onOpenWorkoutModal: () => void;
  onOpenMeal: () => void;
  onEditActivity: (activity: LoggedActivityEntry) => void;
  onDeleteActivity: (activityId: string) => Promise<void>;
  onNavigateTab: (tab: 'SCOREBOARD' | 'PANTRY' | 'PROFILE' | 'CHAT') => void;
  onSendChatQuery: (query: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userId,
  remainingBalance,
  consumed,
  dailyTargets,
  hydrationDemandMl,
  workoutHydrationMl,
  pantryItems,
  loggedActivities,
  onOpenWorkoutModal,
  onOpenMeal,
  onEditActivity,
  onDeleteActivity,
  onNavigateTab,
  onSendChatQuery,
}) => {
  const [loggedMeals, setLoggedMeals] = useState<LoggedMealEntry[]>([]);

  useEffect(() => {
    if (userId) {
      const todayStr = new Date().toISOString().split('T')[0];
      fetchLoggedMealsForDate(userId, todayStr)
        .then((meals) => setLoggedMeals(meals))
        .catch((err) => console.error('Error fetching today logged meals:', err));
    }
  }, [userId, consumed.calories_kcal]);

  const eatenProt = Math.min(
    dailyTargets.protein_g,
    Math.round(consumed.protein_g)
  );
  const eatenCarb = Math.min(
    dailyTargets.carbohydrates_g,
    Math.round(consumed.carbohydrates_g)
  );
  const eatenFat = Math.min(
    dailyTargets.fat_g,
    Math.round(consumed.fat_g)
  );

  const protPct = Math.min(
    100,
    Math.round((eatenProt / (dailyTargets.protein_g || 1)) * 100)
  );
  const carbPct = Math.min(
    100,
    Math.round((eatenCarb / (dailyTargets.carbohydrates_g || 1)) * 100)
  );
  const fatPct = Math.min(
    100,
    Math.round((eatenFat / (dailyTargets.fat_g || 1)) * 100)
  );

  const topPantryItems = pantryItems.slice(0, 3);

  /** Shared left edge so the three progressions are comparable by eye. */
  const gauges = [
    { key: 'prot', label: 'Proteína', value: eatenProt, target: Math.round(dailyTargets.protein_g), pct: protPct, color: 'var(--accent-ember)' },
    { key: 'carb', label: 'Carbohidratos', value: eatenCarb, target: Math.round(dailyTargets.carbohydrates_g), pct: carbPct, color: 'var(--accent-gold)' },
    { key: 'fat', label: 'Grasas', value: eatenFat, target: Math.round(dailyTargets.fat_g), pct: fatPct, color: 'var(--accent-lake)' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="scoreboard-grid"
    >
      {/* ============ MAIN COLUMN ============ */}
      <div className="scoreboard-column">
        {/* BALANCE: the only panel carrying the thick rule and the loud number.
            The gauges live inside it, split by rules rather than card edges, so
            the balance reads as one scoreboard instead of four equal tiles. */}
        <motion.div variants={itemVariants} className="panel-card panel-scoreboard">
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <span className="panel-eyebrow">Balance de hoy</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-lake)', fontSize: '0.8rem', fontWeight: 700 }}>
                <Droplet size={14} /> {Math.round(hydrationDemandMl)} ml
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '3.6rem',
                  fontWeight: 800,
                  color: 'var(--accent-ember)',
                  lineHeight: 0.95,
                }}
              >
                {Math.round(remainingBalance.remaining_calories_kcal)}
                <span style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', fontWeight: 600, marginLeft: '0.4rem' }}>
                  kcal disponibles
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.4rem' }}>
                {Math.round(consumed.calories_kcal)} kcal de {dailyTargets.calories_kcal} kcal objetivo
              </div>
            </div>

            <hr className="panel-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {gauges.map((g) => (
                <div key={g.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>{g.label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: g.color, fontWeight: 800 }}>
                      {g.value}g <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>/ {g.target}g</span>
                    </span>
                  </div>
                  <div className="macro-bar-track" style={{ height: '8px' }}>
                    <motion.div
                      className={`macro-bar-fill ${g.key}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.pct}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <hr className="panel-divider" />

            {/* One primary action per view. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onOpenMeal}
                className="btn-scoreboard"
                style={{ padding: '0.9rem', justifyContent: 'center', fontSize: '0.9rem', gap: '0.4rem' }}
              >
                <Utensils size={18} /> Registrar comida
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onOpenWorkoutModal}
                className="btn-scoreboard secondary"
                style={{ padding: '0.9rem', justifyContent: 'center', fontSize: '0.9rem', gap: '0.4rem' }}
              >
                <Activity size={18} /> Registrar entrenamiento
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* TODAY'S MEALS */}
        <motion.div variants={itemVariants} className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">Ingesta</span>
              <h3 className="panel-title">
                <Utensils size={18} style={{ color: 'var(--accent-moss)' }} />
                Tus comidas de hoy ({loggedMeals.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenMeal}
              style={{
                background: 'none',
                border: '1px solid var(--line-heavy)',
                color: 'var(--ink-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Plus size={14} /> Añadir
            </button>
          </div>

          <div className="panel-body">
            {loggedMeals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--ink-muted)', background: 'var(--surface-card)', border: '1px dashed var(--line-heavy)', borderRadius: 'var(--radius-md)' }}>
                <Utensils size={32} style={{ color: 'var(--ink-muted)', margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-chalk)' }}>Todavía no has registrado nada hoy</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: '0.2rem auto 0.85rem', maxWidth: '340px' }}>
                  Registra lo que comas y verás al instante cuánto te queda para completar tus objetivos.
                </div>
                <button
                  type="button"
                  onClick={onOpenMeal}
                  className="btn-action-pill"
                  style={{ justifyContent: 'center' }}
                >
                  <Plus size={16} /> Registrar mi primera comida
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {loggedMeals.map((meal) => (
                  <LoggedMealCard key={meal.id} meal={meal} showTime={true} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ============ SIDE COLUMN ============ */}
      <div className="scoreboard-column">
        <motion.div variants={itemVariants}>
          <WaterIntakeCard
            userId={userId || ''}
            targetHydrationMl={hydrationDemandMl}
            workoutHydrationMl={workoutHydrationMl}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <LoggedWorkoutsTimeline
            activities={loggedActivities}
            onOpenModal={onOpenWorkoutModal}
            onEditActivity={onEditActivity}
            onDeleteActivity={onDeleteActivity}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="panel-card">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">Despensa</span>
              <h3 className="panel-title">
                <ShoppingBag size={18} style={{ color: 'var(--accent-ember)' }} />
                {pantryItems.length} {pantryItems.length === 1 ? 'alimento' : 'alimentos'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('PANTRY')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-ember)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              Ver toda <ChevronRight size={16} />
            </button>
          </div>

          <div className="panel-body">
            {topPantryItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                Tu despensa está vacía. Añade alimentos y te proponemos recetas con lo que tienes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topPantryItems.map((item) => (
                  <div
                    key={item.inventory_item_id}
                    style={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--line-graphite)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink-chalk)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{item.category}</div>
                    </div>

                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-ember)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                      {item.available_quantity} <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() =>
                onSendChatQuery(
                  '¿Qué puedo cenar rápido aprovechando los alimentos de mi despensa?'
                )
              }
              className="btn-action-pill"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <Sparkles size={16} /> Ver recetas con lo que tengo
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
