import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Plus,
  Utensils,
  Dumbbell,
  Bot,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import type { RemainingBalance, MacroBalance, PantryItem } from '../../types';

interface DashboardOverviewProps {
  remainingBalance: RemainingBalance;
  consumed: MacroBalance;
  dailyTargets: MacroBalance;
  hydrationDemandMl: number;
  pantryItems: PantryItem[];
  statusFlag: string;
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
  remainingBalance,
  consumed,
  dailyTargets,
  hydrationDemandMl,
  pantryItems,
  statusFlag,
  onOpenBasketball,
  onOpenStrength,
  onOpenMeal,
  onNavigateTab,
  onSendChatQuery,
}) => {
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

  const topPantryItems = pantryItems.slice(0, 4);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}
    >
      {/* 1. ATHLETIC HERO ACTION BANNER */}
      <motion.div
        variants={itemVariants}
        className="panel-card"
        style={{
          background: 'linear-gradient(135deg, rgba(193, 98, 43, 0.15) 0%, var(--surface-hardwood) 70%)',
          border: '1px solid var(--line-heavy)',
          borderTop: '3px solid var(--accent-ember)',
          padding: '1.75rem 2rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <span
              className="brand-badge"
              style={{
                backgroundColor: statusFlag === 'DÍA NO INICIADO' ? 'rgba(163, 157, 144, 0.2)' : 'rgba(193, 98, 43, 0.2)',
                color: statusFlag === 'DÍA NO INICIADO' ? 'var(--ink-muted)' : 'var(--accent-ember)',
                border: `1px solid ${statusFlag === 'DÍA NO INICIADO' ? 'var(--line-graphite)' : 'var(--accent-ember)'}`,
              }}
            >
              {statusFlag}
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--ink-chalk)',
              margin: '0 0 0.4rem 0',
              letterSpacing: '0.5px',
            }}
          >
            Estado Bioenergético de Hoy
          </h2>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenBasketball}
              className="btn-scoreboard"
            >
              🏀 Registrar Baloncesto
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenStrength}
              className="btn-scoreboard lake"
            >
              <Dumbbell className="w-4 h-4 text-[#FFF]" /> Registrar Gimnasio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenMeal}
              className="btn-scoreboard secondary"
            >
              <Utensils className="w-4 h-4" /> Registrar Ingesta
            </motion.button>
          </div>
        </div>

        {/* Quick Bioenergetics Mini Card */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--line-graphite)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-muted)', fontWeight: 700 }}>
              Balance Restante
            </span>
            <Flame className="w-4 h-4 text-[#C1622B]" />
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-ember)', lineHeight: 1 }}>
              {Math.round(remainingBalance.remaining_calories_kcal)}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--ink-muted)', fontWeight: 600 }}>kcal</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              De {dailyTargets.calories_kcal} kcal objetivo
            </div>
          </div>

          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--line-graphite)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Hidratación acumulada:</span>
            <strong style={{ color: 'var(--accent-lake)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              {Math.round(hydrationDemandMl)} ml
            </strong>
          </div>
        </div>
      </motion.div>

      {/* 2. MAIN GRID LEDGER CONTENT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.75rem' }}>
        {/* LEFT COLUMN: MACRONUTRIENT LEDGERS & DAILY PROGRESS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Detailed Macro Gauges Card */}
          <motion.div variants={itemVariants} className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <TrendingUp className="w-5 h-5 text-[#C1622B]" /> Medidor de Macronutrientes y Cobertura
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Periodización Diaria</span>
            </div>

            <div className="panel-body">
              {/* Protein Row */}
              <div style={{ background: 'var(--surface-card)', padding: '1rem', border: '1px solid var(--line-graphite)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-chalk)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--accent-ember)' }}></span>
                    Proteínas (Síntesis Muscular / MPS)
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-ember)', fontSize: '1.1rem' }}>
                    {eatenProt}g / {dailyTargets.protein_g}g ({protPct}%)
                  </span>
                </div>
                <div className="macro-bar-track" style={{ height: '10px' }}>
                  <motion.div
                    className="macro-bar-fill prot"
                    initial={{ width: 0 }}
                    animate={{ width: `${protPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <span>Restante: {Math.max(0, dailyTargets.protein_g - eatenProt)}g</span>
                  <span>Objetivo: 2.0g/kg peso corporal</span>
                </div>
              </div>

              {/* Carbs Row */}
              <div style={{ background: 'var(--surface-card)', padding: '1rem', border: '1px solid var(--line-graphite)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-chalk)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--accent-gold)' }}></span>
                    Carbohidratos (Carga Glucogénica)
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>
                    {eatenCarb}g / {dailyTargets.carbohydrates_g}g ({carbPct}%)
                  </span>
                </div>
                <div className="macro-bar-track" style={{ height: '10px' }}>
                  <motion.div
                    className="macro-bar-fill carb"
                    initial={{ width: 0 }}
                    animate={{ width: `${carbPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <span>Restante: {Math.max(0, dailyTargets.carbohydrates_g - eatenCarb)}g</span>
                  <span>Objetivo: Reposición MET alta</span>
                </div>
              </div>

              {/* Fats Row */}
              <div style={{ background: 'var(--surface-card)', padding: '1rem', border: '1px solid var(--line-graphite)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-chalk)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--accent-lake)' }}></span>
                    Grasas Saludables (Soporte Hormonal)
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-lake)', fontSize: '1.1rem' }}>
                    {eatenFat}g / {dailyTargets.fat_g}g ({fatPct}%)
                  </span>
                </div>
                <div className="macro-bar-track" style={{ height: '10px' }}>
                  <motion.div
                    className="macro-bar-fill fat"
                    initial={{ width: 0 }}
                    animate={{ width: `${fatPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <span>Restante: {Math.max(0, dailyTargets.fat_g - eatenFat)}g</span>
                  <span>Objetivo: Ácidos grasos esenciales</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick AI Advisor Recommendation Card */}
          <motion.div variants={itemVariants} className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <Bot className="w-5 h-5 text-[#3E6E64]" /> Recomendación Nutricional Inteligente
              </h3>
            </div>

            <div className="panel-body">
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Basado en tus {pantryItems.length} alimentos en despensa y tus requerimientos proteicos de hoy, el asistente puede recomendarte recetas optimizadas post-entrenamiento.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    onSendChatQuery(
                      '¿Qué puedo cenar de forma rápida aprovechando mi despensa para cumplir mis macros?'
                    )
                  }
                  className="btn-action-pill"
                >
                  🍳 Recomendar Cena con Despensa
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    onSendChatQuery(
                      '¿Cuánta agua e hidratos necesito recuperar tras mi sesión de baloncesto?'
                    )
                  }
                  className="btn-action-pill"
                >
                  💧 Plan de Recuperación Glucogénica
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: PANTRY PREVIEW & QUICK LAUNCHERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pantry Stock Snapshot */}
          <motion.div variants={itemVariants} className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <ShoppingBag className="w-5 h-5 text-[#C1622B]" /> Despensa ({pantryItems.length})
              </h3>
              <button
                onClick={() => onNavigateTab('PANTRY')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-ember)',
                  fontSize: '0.85rem',
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
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
                  Tu despensa está vacía. Añade alimentos para generar recetas con la IA.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topPantryItems.map((item) => (
                    <div
                      key={item.inventory_item_id}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--line-graphite)',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ink-chalk)', fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{item.category}</div>
                      </div>

                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-ember)', fontSize: '1.1rem' }}>
                        {item.available_quantity} <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onNavigateTab('PANTRY')}
                className="btn-action-pill"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus className="w-4 h-4" /> Añadir o Gestionar Stock
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
