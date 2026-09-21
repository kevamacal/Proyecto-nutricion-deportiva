import React, { useState } from 'react';
import { Trophy, Droplet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../services/api';
import { BaseModal } from '../Common/BaseModal';

interface BasketballLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hydrationMl: number) => void;
}

export const BasketballLogModal: React.FC<BasketballLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [sessionCategory, setSessionCategory] = useState<'TRAINING' | 'MATCH'>('TRAINING');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [intensity, setIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'>('HIGH');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const estHydration = Math.round(durationMinutes * 12.5 * (sessionCategory === 'MATCH' ? 1.2 : 1.0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await logActivity({
        user_id: user?.id || 'demo-user-id',
        sport_type: 'BASKETBALL',
        duration_minutes: durationMinutes,
        weight_kg: user?.weight_kg || 75.0,
        intensity: intensity.toLowerCase(),
      });

      const hydration = result.hydration_recommendation_ml || estHydration;
      onSuccess(hydration);
      onClose();
    } catch (err: any) {
      console.error('Failed to log basketball:', err);
      setError('Error registrando la sesión de Baloncesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Sesión de Baloncesto"
      icon={<Trophy className="w-5 h-5 text-[#C1622B]" />}
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div style={{ background: 'rgba(178, 58, 72, 0.15)', border: '1px solid var(--accent-flag)', color: '#FF6B7A', padding: '0.75rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
            Tipo de Sesión:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setSessionCategory('TRAINING')}
              className={`btn-action-pill ${sessionCategory === 'TRAINING' ? 'primary' : ''}`}
              style={{ justifyContent: 'center' }}
            >
              🏀 Entrenamiento / Tiros
            </button>
            <button
              type="button"
              onClick={() => setSessionCategory('MATCH')}
              className={`btn-action-pill ${sessionCategory === 'MATCH' ? 'primary' : ''}`}
              style={{ justifyContent: 'center' }}
            >
              🔥 Partido Oficial / Pachanga
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="bball-duration-range" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
            <span>Duración de la Sesión:</span>
            <span style={{ color: 'var(--accent-ember)', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800 }}>{durationMinutes} min</span>
          </label>
          <input
            id="bball-duration-range"
            type="range"
            min="15"
            max="180"
            step="5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number.parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: 'var(--accent-ember)' }}
          />
        </div>

        <div>
          <label htmlFor="bball-intensity-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.35rem' }}>
            Intensidad del Partido/Entreno:
          </label>
          <select
            id="bball-intensity-select"
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
            <option value="LOW">Baja (Tiros / Rodada suave)</option>
            <option value="MEDIUM">Media (Ritmo normal de práctica)</option>
            <option value="HIGH">Alta (Partido competitivo)</option>
            <option value="VERY_HIGH">Muy Alta (Torneo / Máximo Esfuerzo)</option>
          </select>
        </div>

        {/* Live Preview Card */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--line-graphite)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Droplet className="w-4 h-4 text-[#3E6E64]" /> Demanda de Hidratación:
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-lake)' }}>
            +{estHydration} ml
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn-scoreboard secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-scoreboard" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Sesión Baloncesto'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
