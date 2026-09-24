import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Dumbbell, Clock, Flame, Droplet, Trash2, Edit3 } from 'lucide-react';
import type { LoggedActivityEntry } from '../../types';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';

interface LoggedWorkoutCardProps {
  activity: LoggedActivityEntry;
  onEdit?: (activity: LoggedActivityEntry) => void;
  onDelete?: (activityId: string) => Promise<void>;
}

export const LoggedWorkoutCard: React.FC<LoggedWorkoutCardProps> = ({
  activity,
  onEdit,
  onDelete,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isBasketball = activity.sport === 'BASKETBALL';
  const sportLabel = isBasketball ? 'Baloncesto' : 'Gimnasio / Fuerza';
  const sportColor = isBasketball ? 'var(--accent-ember)' : 'var(--accent-lake)';

  const formattedTime = new Date(activity.date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    await onDelete(activity.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--line-graphite)',
          borderLeft: `4px solid ${sportColor}`,
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isBasketball ? (
              <Trophy size={18} style={{ color: sportColor }} />
            ) : (
              <Dumbbell size={18} style={{ color: sportColor }} />
            )}
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--ink-chalk)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {activity.session_type || sportLabel}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--ink-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.15rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {formattedTime}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(activity)}
                title="Editar sesión"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Edit3 size={15} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                title="Eliminar sesión"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF6B7A',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} style={{ color: 'var(--ink-muted)' }} />
            <span>{activity.duration_minutes} min</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-ember)', fontWeight: 700 }}>
            <Flame size={14} />
            <span>+{Math.round(activity.estimated_expenditure_kcal)} kcal activas</span>
          </div>

          {isBasketball && activity.basketball_details && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-lake)', fontWeight: 700 }}>
              <Droplet size={14} />
              <span>+{Math.round(activity.basketball_details.hydration_demand_ml)} ml agua</span>
            </div>
          )}

          {!isBasketball && activity.strength_details && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
              <Dumbbell size={14} />
              <span>+{Math.round(activity.strength_details.protein_demand_g)}g proteína demandada</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showConfirmModal}
        title="Eliminar Sesión de Entrenamiento"
        itemName={`${activity.session_type || sportLabel} (${activity.duration_minutes} min)`}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

