import React from 'react';
import { motion } from 'framer-motion';
import type { CalculatedTargetsData } from '../../types/flow';
import { ArrowRight, Flame } from 'lucide-react';

interface TargetsConfirmationProps {
  targets: CalculatedTargetsData;
  onConfirm: () => void;
}

export const TargetsConfirmation: React.FC<TargetsConfirmationProps> = ({ targets, onConfirm }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-court)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        color: 'var(--ink-chalk)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="panel-card"
        style={{
          maxWidth: '580px',
          width: '100%',
          padding: '2.5rem',
          border: '1px solid var(--line-heavy)',
          borderTop: '3px solid var(--accent-ember)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
          Tus objetivos diarios
        </h2>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Los hemos calculado a partir de tu edad, estatura, peso, actividad y objetivo. Estos son los
          números con los que vas a trabajar a partir de ahora.
        </p>

        {/* Nutrition Target Summary Ledger */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--line-graphite)',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--line-graphite)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Energía en reposo</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--ink-chalk)' }}>{targets.bmr_kcal} kcal</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--line-graphite)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Gasto diario estimado</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--ink-chalk)' }}>{targets.base_tdee_kcal} kcal</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid var(--line-graphite)' }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-ember)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              <Flame className="w-4 h-4" /> Calorías objetivo
            </span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-ember)' }}>
              {targets.calories_target_kcal} <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>kcal</span>
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', paddingTop: '1.1rem' }}>
            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: 'rgba(193, 98, 43, 0.1)', border: '1px solid var(--accent-ember)', padding: '0.75rem', textAlign: 'center' }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-ember)', fontWeight: 700, display: 'block', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>PROTEÍNAS</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink-chalk)', fontWeight: 800 }}>{targets.protein_target_g}g</strong>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: 'rgba(217, 160, 91, 0.1)', border: '1px solid var(--accent-gold)', padding: '0.75rem', textAlign: 'center' }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700, display: 'block', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>CARBOHIDRATOS</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink-chalk)', fontWeight: 800 }}>{targets.carbs_target_g}g</strong>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: 'rgba(62, 110, 100, 0.1)', border: '1px solid var(--accent-lake)', padding: '0.75rem', textAlign: 'center' }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-lake)', fontWeight: 700, display: 'block', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>GRASAS</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink-chalk)', fontWeight: 800 }}>{targets.fat_target_g}g</strong>
            </motion.div>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onConfirm}
          className="btn-scoreboard"
          style={{
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}
        >
          Confirmar y montar mi despensa <ArrowRight size={20} />
        </motion.button>
      </motion.div>
    </div>
  );
};
