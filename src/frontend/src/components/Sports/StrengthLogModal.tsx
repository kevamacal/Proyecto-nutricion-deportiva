import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, X, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../services/api';

interface StrengthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StrengthLogModal: React.FC<StrengthLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [trainingType, setTrainingType] = useState<'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID'>('HYPERTROPHY');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [intensity, setIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'>('HIGH');
  const [muscles, setMuscles] = useState<string>('Pecho, Tríceps, Hombro');
  const [sets, setSets] = useState<number>(16);
  const [reps, setReps] = useState<number>(160);
  const [volumeKg, setVolumeKg] = useState<number>(4500);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const estProteinDemand = Math.round(sets * 1.5 + (trainingType === 'HYPERTROPHY' ? 10 : 5));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await logActivity({
        user_id: user?.id || 'demo-user-id',
        sport_type: 'STRENGTH_TRAINING',
        duration_minutes: durationMinutes,
        weight_kg: user?.weight_kg || 75.0,
        intensity: intensity.toLowerCase(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log strength training:', err);
      setError('Error registrando sesión de fuerza');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <h3 className="panel-title" style={{ fontSize: '1.2rem' }}>
                <Dumbbell className="w-5 h-5 text-[#3E6E64]" />
                Registrar Entrenamiento de Fuerza / Gimnasio
              </h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="panel-body">
              {error && (
                <div style={{ background: 'rgba(178, 58, 72, 0.15)', border: '1px solid var(--accent-flag)', color: '#FF6B7A', padding: '0.75rem', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                  Enfoque del Entrenamiento:
                </label>
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.85rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="HYPERTROPHY">Hipertrofia (Crecimiento Muscular / Rango 8-12 reps)</option>
                  <option value="STRENGTH">Fuerza Máxima (Cargas Pesadas / Rango 1-5 reps)</option>
                  <option value="POWER">Potencia & Explosividad (Velocidad de ejecución)</option>
                  <option value="HYBRID">Híbrido / Funcional / Cross-training</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                    Duración (minutos):
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.85rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                    Intensidad (RPE):
                  </label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.85rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <option value="LOW">Baja (Recuperación / Movilidad)</option>
                    <option value="MEDIUM">Media (Moderada)</option>
                    <option value="HIGH">Alta (Exigente)</option>
                    <option value="VERY_HIGH">Muy Alta (Fallo Muscular / RPE 9-10)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
                  Grupos Musculares Trabajados:
                </label>
                <input
                  type="text"
                  value={muscles}
                  onChange={(e) => setMuscles(e.target.value)}
                  placeholder="Ej: Pecho, Tríceps, Deltoides"
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.85rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.25rem' }}>Series</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.5rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.25rem' }}>Reps Totales</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.5rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.25rem' }}>Volumen (kg)</label>
                  <input
                    type="number"
                    value={volumeKg}
                    onChange={(e) => setVolumeKg(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.5rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* Live Preview Badge */}
              <div style={{ background: 'var(--surface-card)', border: '1px solid var(--line-graphite)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Flame className="w-4 h-4 text-[#C1622B]" /> Estimación Demanda Proteica:
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-ember)' }}>
                  +{estProteinDemand}g proteína
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-scoreboard secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn-scoreboard lake" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar Sesión Gimnasio'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
