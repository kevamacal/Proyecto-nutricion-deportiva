import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, Plus, Trash2 } from 'lucide-react';
import type { HydrationLogEntry } from '../../types';
import {
  fetchDailyHydrationLogs,
  logWaterIntake,
  deleteHydrationLog,
} from '../../services/api';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface WaterIntakeCardProps {
  userId: string;
  targetHydrationMl: number;
  workoutHydrationMl?: number;
  onIntakeUpdated?: () => void;
}

export const WaterIntakeCard: React.FC<WaterIntakeCardProps> = ({
  userId,
  targetHydrationMl,
  workoutHydrationMl = 0,
  onIntakeUpdated,
}) => {
  const [logs, setLogs] = useState<HydrationLogEntry[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState(300);
  const [isLogging, setIsLogging] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HydrationLogEntry | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultTarget = targetHydrationMl > 0 ? targetHydrationMl : 2500;
  const baseTarget = Math.max(0, defaultTarget - workoutHydrationMl);

  const loadLogs = async () => {
    if (!userId) return;
    try {
      const data = await fetchDailyHydrationLogs(userId, todayStr);
      setLogs(data);
    } catch (err) {
      console.error('Error loading daily hydration logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId, targetHydrationMl]);

  const totalConsumedMl = logs.reduce((acc, log) => acc + (log.amount_ml || 0), 0);
  const progressPct = Math.min(100, Math.round((totalConsumedMl / defaultTarget) * 100));

  const handleAddWater = async (amount: number) => {
    if (amount <= 0 || !userId) return;
    setIsLogging(true);
    try {
      await logWaterIntake(userId, amount);
      setShowCustomInput(false);
      await loadLogs();
      if (onIntakeUpdated) onIntakeUpdated();
    } catch (err) {
      console.error('Error logging water intake:', err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!itemToDelete) return;
    try {
      await deleteHydrationLog(itemToDelete.id);
      await loadLogs();
      if (onIntakeUpdated) onIntakeUpdated();
    } catch (err) {
      console.error('Error deleting hydration log:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-card"
      style={{ borderTop: '3px solid var(--accent-lake)' }}
    >
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Droplet size={20} style={{ color: 'var(--accent-lake)' }} /> Registro de Hidratación
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--accent-lake)',
          }}
        >
          {totalConsumedMl} <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>/ {defaultTarget} ml</span>
        </span>
      </div>

      <div className="panel-body" style={{ gap: '0.85rem' }}>
        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
            <span>
              Meta recomendada hoy{' '}
              {workoutHydrationMl > 0 ? (
                <span style={{ color: 'var(--accent-lake)', fontWeight: 600 }}>
                  ({baseTarget} ml base + {workoutHydrationMl} ml entreno)
                </span>
              ) : (
                <span style={{ color: 'var(--ink-muted)' }}>(base diaria)</span>
              )}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--accent-lake)' }}>{progressPct}% alcanzado</span>
          </div>
          <div className="macro-bar-track" style={{ height: '8px' }}>
            <motion.div
              className="macro-bar-fill fat"
              style={{ background: 'var(--accent-lake)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Quick Add Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={isLogging}
            onClick={() => handleAddWater(250)}
            className="btn-action-pill"
            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.3rem' }}
          >
            💧 +250 ml
          </button>
          <button
            type="button"
            disabled={isLogging}
            onClick={() => handleAddWater(500)}
            className="btn-action-pill"
            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.3rem' }}
          >
            🧴 +500 ml
          </button>
          <button
            type="button"
            disabled={isLogging}
            onClick={() => handleAddWater(750)}
            className="btn-action-pill"
            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.3rem' }}
          >
            🏋️ +750 ml
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="btn-action-pill primary"
            style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.3rem' }}
          >
            ➕ Otro
          </button>
        </div>

        {/* Custom ml Input */}
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--surface-card)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-graphite)' }}>
                <input
                  type="number"
                  min="50"
                  max="3000"
                  step="50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number.parseInt(e.target.value, 10) || 0)}
                  placeholder="ml"
                  style={{
                    flex: 1,
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.4rem 0.6rem',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                />
                <button
                  type="button"
                  disabled={isLogging || customAmount <= 0}
                  onClick={() => handleAddWater(customAmount)}
                  className="btn-scoreboard lake"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today Logs list */}
        {logs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Registros de agua de hoy ({logs.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--line-graphite)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.78rem',
                    color: 'var(--ink-chalk)',
                  }}
                >
                  <Droplet size={12} style={{ color: 'var(--accent-lake)' }} />
                  <span>{log.amount_ml} ml</span>
                  <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem' }}>
                    ({new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(log)}
                    style={{ background: 'none', border: 'none', color: '#FF6B7A', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title="Eliminar registro de agua"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Water Log */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        title="Eliminar Registro de Agua"
        itemName={itemToDelete ? `${itemToDelete.amount_ml} ml de agua` : ''}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteLog}
      />
    </motion.div>
  );
};
