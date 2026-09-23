import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus } from 'lucide-react';
import type { LoggedActivityEntry } from '../../types';
import { LoggedWorkoutCard } from './LoggedWorkoutCard';

interface LoggedWorkoutsTimelineProps {
  activities: LoggedActivityEntry[];
  onOpenModal: () => void;
  onEditActivity?: (activity: LoggedActivityEntry) => void;
  onDeleteActivity?: (activityId: string) => Promise<void>;
}

export const LoggedWorkoutsTimeline: React.FC<LoggedWorkoutsTimelineProps> = ({
  activities,
  onOpenModal,
  onEditActivity,
  onDeleteActivity,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-card"
      style={{ borderTop: '3px solid var(--accent-ember)' }}
    >
      <div className="panel-header">
        <h3 className="panel-title">
          <Activity size={20} style={{ color: 'var(--accent-ember)' }} /> Sesiones de Entrenamiento ({activities.length})
        </h3>
        <button
          type="button"
          onClick={onOpenModal}
          style={{
            background: 'rgba(193, 98, 43, 0.15)',
            border: '1px solid var(--accent-ember)',
            color: 'var(--accent-ember)',
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
          <Plus size={14} /> Registrar Entreno
        </button>
      </div>

      <div className="panel-body">
        {activities.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
              color: 'var(--ink-muted)',
              background: 'rgba(18, 22, 32, 0.4)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Activity
              size={32}
              style={{ color: 'var(--ink-muted)', margin: '0 auto 0.5rem auto', opacity: 0.5 }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-chalk)' }}>
              No has registrado entrenamientos hoy
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Registra tu partido de baloncesto o sesión de gimnasio para calcular tus calorías activas y reajustar tu marcador.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <AnimatePresence mode="popLayout">
              {activities.map((activity) => (
                <LoggedWorkoutCard
                  key={activity.id}
                  activity={activity}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
