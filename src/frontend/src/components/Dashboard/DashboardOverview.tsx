import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  Dumbbell,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  Droplet,
  Sparkles,
  Clock,
  Plus,
} from 'lucide-react';
import type { RemainingBalance, MacroBalance, PantryItem, LoggedMealEntry } from '../../types';
import { fetchLoggedMealsForDate } from '../../services/supabaseApi';
import { FoodCategoryBadge } from '../Common/FoodCategoryBadge';
import { formatEnumLabel, MEAL_TYPE_LABELS } from '../../utils/enumMappers';

interface DashboardOverviewProps {
  userId?: string;
  remainingBalance: RemainingBalance;
  consumed: MacroBalance;
  dailyTargets: MacroBalance;
  hydrationDemandMl: number;
  pantryItems: PantryItem[];
  onOpenBasketball: () => void;
  onOpenStrength: () => void;
  onOpenMeal: () => void;
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
  pantryItems,
  onOpenBasketball,
  onOpenStrength,
  onOpenMeal,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}
    >
      {/* 1. HERO BIOENERGETICS CARD (ONBOARDING WIZARD STYLE) */}
      <motion.div
        variants={itemVariants}
        className="panel-card"
        style={{
          borderTop: '3px solid var(--accent-ember)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', letterSpacing: '0.5px' }}>
            Calorías Restantes Hoy
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-lake)', fontSize: '0.85rem', fontWeight: 700 }}>
            <Droplet size={16} /> {Math.round(hydrationDemandMl)} ml agua
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.2rem',
              fontWeight: 800,
              color: 'var(--accent-ember)',
              lineHeight: 1,
              marginTop: '0.2rem',
            }}
          >
            {Math.round(remainingBalance.remaining_calories_kcal)}{' '}
            <span style={{ fontSize: '1.2rem', color: 'var(--ink-muted)', fontWeight: 600 }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.35rem' }}>
            {Math.round(consumed.calories_kcal)} kcal consumidas de {dailyTargets.calories_kcal} kcal objetivo
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onOpenBasketball}
            className="btn-scoreboard"
            style={{ width: '100%', padding: '0.9rem', justifyContent: 'center' }}
          >
            🏀 Registrar Baloncesto
          </motion.button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onOpenStrength}
              className="btn-scoreboard lake"
              style={{ padding: '0.85rem', justifyContent: 'center', fontSize: '0.9rem' }}
            >
              <Dumbbell size={16} /> Gimnasio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onOpenMeal}
              className="btn-scoreboard secondary"
              style={{ padding: '0.85rem', justifyContent: 'center', fontSize: '0.9rem' }}
            >
              <Utensils size={16} /> Comida
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 2. MACRONUTRIENT FUEL GAUGE CARD */}
      <motion.div variants={itemVariants} className="panel-card" style={{ borderTop: '3px solid var(--accent-lake)' }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <TrendingUp size={20} style={{ color: 'var(--accent-lake)' }} /> Macronutrientes
          </h3>
        </div>

        <div className="panel-body" style={{ gap: '1rem' }}>
          {/* Protein */}
          <div style={{ background: 'var(--surface-card)', padding: '0.85rem', border: '1px solid var(--line-graphite)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700 }}>
              <span>Proteínas</span>
              <span style={{ color: 'var(--accent-ember)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                {eatenProt}g / {dailyTargets.protein_g}g ({protPct}%)
              </span>
            </div>
            <div className="macro-bar-track" style={{ height: '8px' }}>
              <motion.div
                className="macro-bar-fill prot"
                initial={{ width: 0 }}
                animate={{ width: `${protPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div style={{ background: 'var(--surface-card)', padding: '0.85rem', border: '1px solid var(--line-graphite)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700 }}>
              <span>Carbohidratos</span>
              <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                {eatenCarb}g / {dailyTargets.carbohydrates_g}g ({carbPct}%)
              </span>
            </div>
            <div className="macro-bar-track" style={{ height: '8px' }}>
              <motion.div
                className="macro-bar-fill carb"
                initial={{ width: 0 }}
                animate={{ width: `${carbPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Fats */}
          <div style={{ background: 'var(--surface-card)', padding: '0.85rem', border: '1px solid var(--line-graphite)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700 }}>
              <span>Grasas Saludables</span>
              <span style={{ color: 'var(--accent-lake)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                {eatenFat}g / {dailyTargets.fat_g}g ({fatPct}%)
              </span>
            </div>
            <div className="macro-bar-track" style={{ height: '8px' }}>
              <motion.div
                className="macro-bar-fill fat"
                initial={{ width: 0 }}
                animate={{ width: `${fatPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. DAILY CONSUMPTION TIMELINE CARD */}
      <motion.div variants={itemVariants} className="panel-card" style={{ borderTop: '3px solid #00E676' }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <Utensils size={20} style={{ color: '#00E676' }} /> Línea de Ingesta Diaria ({loggedMeals.length})
          </h3>
          <button
            type="button"
            onClick={onOpenMeal}
            style={{
              background: 'rgba(0, 230, 118, 0.15)',
              border: '1px solid #00E676',
              color: '#00E676',
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
            <Plus size={14} /> Registrar Comida
          </button>
        </div>

        <div className="panel-body">
          {loggedMeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--ink-muted)', background: 'rgba(18, 22, 32, 0.4)', borderRadius: 'var(--radius-md)' }}>
              <Utensils size={32} style={{ color: 'var(--ink-muted)', margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-chalk)' }}>No has registrado ingestas hoy</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                Construye o selecciona tu comida para registrar tus calorías y macronutrientes.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {loggedMeals.map((meal) => {
                const mealTime = meal.logged_at ? new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const slotTitle = formatEnumLabel(meal.meal_type, MEAL_TYPE_LABELS);
                const displayName = meal.name || slotTitle;

                return (
                  <div
                    key={meal.id}
                    style={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--line-graphite)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                    }}
                  >
                    <FoodCategoryBadge foodName={displayName} category={meal.meal_type} size="md" />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink-chalk)' }}>
                          {displayName}
                        </span>
                        <span style={{ background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {slotTitle.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--ink-muted)' }}>
                          <Clock size={12} /> {mealTime}
                        </span>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-ember)', fontWeight: 700 }}>+{meal.total_calories_kcal} kcal</span>
                        <span>•</span>
                        <span style={{ color: '#00E676', fontWeight: 700 }}>+{meal.total_protein_g}g prot</span>
                        <span>•</span>
                        <span style={{ color: '#FF6B35', fontWeight: 700 }}>+{meal.total_carbs_g}g carb</span>
                        <span>•</span>
                        <span style={{ color: '#A855F7', fontWeight: 700 }}>+{meal.total_fat_g}g grasa</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. QUICK RECIPE & PANTRY SNAPSHOT CARD */}
      <motion.div variants={itemVariants} className="panel-card" style={{ borderTop: '3px solid var(--line-heavy)' }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <ShoppingBag size={20} style={{ color: 'var(--accent-ember)' }} /> Despensa ({pantryItems.length})
          </h3>
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
              textTransform: 'uppercase',
            }}
          >
            Ver Todo <ChevronRight size={16} />
          </button>
        </div>

        <div className="panel-body">
          {topPantryItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
              Tu despensa está vacía. Añade alimentos para sugerir recetas.
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
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink-chalk)', fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{item.category}</div>
                  </div>

                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-ember)', fontSize: '1rem' }}>
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
            <Sparkles size={16} /> Recomendar Cena con Despensa
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

