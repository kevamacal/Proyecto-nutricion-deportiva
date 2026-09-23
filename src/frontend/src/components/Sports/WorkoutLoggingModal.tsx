import React, { useState, useEffect } from 'react';
import { Trophy, Dumbbell, Flame, Droplet, Plus, Trash2, Activity, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logActivitySession, updateActivitySession } from '../../services/supabaseApi';
import { BaseModal } from '../Common/BaseModal';
import type { LoggedActivityEntry, StrengthExerciseSet } from '../../types';

interface WorkoutLoggingModalProps {
  isOpen: boolean;
  initialActivity?: LoggedActivityEntry | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BASKETBALL_MET: Record<'TRAINING' | 'MATCH', Record<'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH', number>> = {
  TRAINING: { LOW: 5.0, MEDIUM: 6.5, HIGH: 8.0, VERY_HIGH: 9.0 },
  MATCH: { LOW: 6.5, MEDIUM: 8.0, HIGH: 9.0, VERY_HIGH: 10.0 },
};

const STRENGTH_MET: Record<
  'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE',
  Record<'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH', number>
> = {
  STRENGTH: { LOW: 4.0, MEDIUM: 5.0, HIGH: 6.0, VERY_HIGH: 7.0 },
  POWER: { LOW: 4.0, MEDIUM: 5.0, HIGH: 6.0, VERY_HIGH: 7.0 },
  HYPERTROPHY: { LOW: 4.5, MEDIUM: 6.0, HIGH: 7.0, VERY_HIGH: 8.0 },
  HYBRID: { LOW: 5.0, MEDIUM: 6.5, HIGH: 7.5, VERY_HIGH: 9.0 },
  ENDURANCE: { LOW: 5.0, MEDIUM: 6.5, HIGH: 7.5, VERY_HIGH: 9.0 },
};

export const WorkoutLoggingModal: React.FC<WorkoutLoggingModalProps> = ({
  isOpen,
  initialActivity,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const athleteWeightKg = user?.weight_kg || 75.0;

  // Active discipline tab
  const [sport, setSport] = useState<'BASKETBALL' | 'STRENGTH_TRAINING'>('BASKETBALL');

  // Shared state
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [intensity, setIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'>('HIGH');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Basketball specific state
  const [sessionCategory, setSessionCategory] = useState<'TRAINING' | 'MATCH'>('TRAINING');

  // Strength specific state
  const [trainingType, setTrainingType] = useState<'HYPERTROPHY' | 'STRENGTH' | 'POWER' | 'HYBRID' | 'ENDURANCE'>('HYPERTROPHY');
  const [muscleGroups, setMuscleGroups] = useState<string>('Pecho, Tríceps, Hombro');
  const [sets, setSets] = useState<StrengthExerciseSet[]>([
    { id: '1', exercise_name: 'Press de Banca con Barra', reps: 10, weight_kg: 70, rpe: 8, rest_seconds: 90 },
    { id: '2', exercise_name: 'Press Inclinado con Mancuernas', reps: 10, weight_kg: 24, rpe: 8, rest_seconds: 90 },
    { id: '3', exercise_name: 'Aperturas en Polea High-to-Low', reps: 12, weight_kg: 15, rpe: 9, rest_seconds: 60 },
  ]);

  // Reset or populate modal state when opened or initialActivity changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialActivity) {
        setSport(initialActivity.sport);
        setDurationMinutes(initialActivity.duration_minutes);
        setIntensity(initialActivity.intensity);
        if (initialActivity.basketball_details) {
          setSessionCategory(initialActivity.basketball_details.session_category);
        }
        if (initialActivity.strength_details) {
          setTrainingType(initialActivity.strength_details.training_type);
          setMuscleGroups(initialActivity.strength_details.targeted_muscle_groups?.join(', ') || 'Pecho, Tríceps');
        }
      } else {
        setSport('BASKETBALL');
        setDurationMinutes(60);
        setIntensity('HIGH');
        setSessionCategory('TRAINING');
        setTrainingType('HYPERTROPHY');
      }
    }
  }, [isOpen, initialActivity]);

  // Live Calculations (Deterministic MET boundary)
  const metValue =
    sport === 'BASKETBALL'
      ? BASKETBALL_MET[sessionCategory][intensity]
      : STRENGTH_MET[trainingType][intensity];

  const estActiveCalories = Math.round(metValue * athleteWeightKg * (durationMinutes / 60.0));
  const estHydrationMl = Math.round(durationMinutes * 12.5 * (sessionCategory === 'MATCH' ? 1.2 : 1.0));
  const estProteinDemandG = Math.round(Math.max(30.0, athleteWeightKg * 0.35));

  // Dynamic strength totals
  const totalVolumeKg = sets.reduce((acc, s) => acc + (s.reps || 0) * (s.weight_kg || 0), 0);
  const totalSetsCount = sets.length;
  const totalRepsCount = sets.reduce((acc, s) => acc + (s.reps || 0), 0);

  // Strength Set operations
  const handleAddSet = () => {
    const newSet: StrengthExerciseSet = {
      id: Date.now().toString(),
      exercise_name: sets.length > 0 ? sets[sets.length - 1].exercise_name : 'Nuevo Ejercicio',
      reps: 10,
      weight_kg: sets.length > 0 ? sets[sets.length - 1].weight_kg : 20,
      rpe: 8,
      rest_seconds: 90,
    };
    setSets([...sets, newSet]);
  };

  const handleUpdateSet = (id: string, field: keyof StrengthExerciseSet, value: any) => {
    setSets(sets.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleRemoveSet = (id: string) => {
    if (sets.length === 1) return;
    setSets(sets.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) {
      setError('La duración debe ser mayor a 0 minutos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionType =
        sport === 'BASKETBALL'
          ? sessionCategory === 'MATCH'
            ? 'Partido Oficial / Pachanga'
            : 'Entrenamiento / Tiros'
          : trainingType;

      const payload = {
        user_id: user?.id || 'demo-user-id',
        sport,
        session_type: sessionType,
        duration_minutes: durationMinutes,
        intensity,
        estimated_expenditure_kcal: estActiveCalories,
        basketball_details:
          sport === 'BASKETBALL'
            ? {
                session_category: sessionCategory,
                carb_demand_g: Math.round(athleteWeightKg * (sessionCategory === 'MATCH' ? 1.2 : 1.0)),
                hydration_demand_ml: estHydrationMl,
                recovery_priority: 'GLYCOGEN_REPLETON_AND_HYDRATION',
              }
            : undefined,
        strength_details:
          sport === 'STRENGTH_TRAINING'
            ? {
                training_type: trainingType,
                protein_demand_g: estProteinDemandG,
                targeted_muscle_groups: muscleGroups.split(',').map((m) => m.trim()).filter(Boolean),
                total_volume_kg: totalVolumeKg,
                total_sets: totalSetsCount,
                total_reps: totalRepsCount,
              }
            : undefined,
      };

      if (initialActivity) {
        await updateActivitySession(initialActivity.id, payload);
      } else {
        await logActivitySession(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to log workout session:', err);
      setError('Error al guardar la sesión de entrenamiento');
    } finally {
      setLoading(false);
    }
  };


  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialActivity ? 'Editar Sesión de Entrenamiento' : 'Registrar Entrenamiento'}
      icon={<Activity className="w-5 h-5 text-[#C1622B]" />}
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Discipline Switcher Tabs */}
        {!initialActivity && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line-heavy)',
            }}
          >
            <button
              type="button"
              onClick={() => setSport('BASKETBALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: sport === 'BASKETBALL' ? 'var(--accent-ember)' : 'transparent',
                color: sport === 'BASKETBALL' ? '#FFF' : 'var(--ink-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              <Trophy size={16} /> Baloncesto
            </button>
            <button
              type="button"
              onClick={() => setSport('STRENGTH_TRAINING')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: sport === 'STRENGTH_TRAINING' ? 'var(--accent-lake)' : 'transparent',
                color: sport === 'STRENGTH_TRAINING' ? '#FFF' : 'var(--ink-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              <Dumbbell size={16} /> Fuerza / Gimnasio
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(178, 58, 72, 0.15)',
                border: '1px solid var(--accent-flag)',
                color: '#FF6B7A',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          {/* 1. BASKETBALL FORM */}
          {sport === 'BASKETBALL' && (
            <>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Categoría de Sesión:
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="bball-dur-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Duración (minutos):
                  </label>
                  <input
                    id="bball-dur-input"
                    type="number"
                    min="15"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number.parseInt(e.target.value, 10) || 0)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.75rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="bball-int-select"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Intensidad:
                  </label>
                  <select
                    id="bball-int-select"
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.75rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <option value="LOW">Baja (Tiros suave)</option>
                    <option value="MEDIUM">Media (Ritmo entrenamiento)</option>
                    <option value="HIGH">Alta (Partido competitivo)</option>
                    <option value="VERY_HIGH">Muy Alta (Torneo / Máximo)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 2. STRENGTH TRAINING FORM */}
          {sport === 'STRENGTH_TRAINING' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="strength-focus-select"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Enfoque:
                  </label>
                  <select
                    id="strength-focus-select"
                    value={trainingType}
                    onChange={(e) => setTrainingType(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.75rem',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <option value="HYPERTROPHY">Hipertrofia (8-12 reps)</option>
                    <option value="STRENGTH">Fuerza Máxima (1-5 reps)</option>
                    <option value="POWER">Potencia & Explosividad</option>
                    <option value="HYBRID">Híbrido / Cross-training</option>
                    <option value="ENDURANCE">Resistencia Muscular</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="strength-dur-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Duración (min):
                  </label>
                  <input
                    id="strength-dur-input"
                    type="number"
                    min="15"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number.parseInt(e.target.value, 10) || 0)}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--bg-court)',
                      border: '1px solid var(--line-heavy)',
                      color: 'var(--ink-chalk)',
                      padding: '0.75rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="strength-muscles-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Grupos Musculares:
                </label>
                <input
                  id="strength-muscles-input"
                  type="text"
                  value={muscleGroups}
                  onChange={(e) => setMuscleGroups(e.target.value)}
                  placeholder="Ej: Pecho, Tríceps, Hombro"
                  style={{
                    width: '100%',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--ink-chalk)',
                    padding: '0.65rem 0.85rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              {/* Dynamic Exercise Sets Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    Series de Ejercicios ({sets.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSet}
                    style={{
                      background: 'rgba(62, 110, 100, 0.2)',
                      border: '1px solid var(--accent-lake)',
                      color: 'var(--accent-lake)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Plus size={13} /> Añadir Serie
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '0.2rem',
                  }}
                >
                  {sets.map((set, idx) => (
                    <div
                      key={set.id}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--line-graphite)',
                        padding: '0.5rem 0.75rem',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 24px',
                        gap: '0.5rem',
                        alignItems: 'center',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <input
                        type="text"
                        value={set.exercise_name}
                        onChange={(e) => handleUpdateSet(set.id, 'exercise_name', e.target.value)}
                        placeholder={`Ejercicio ${idx + 1}`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--ink-chalk)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(set.id, 'reps', Number.parseInt(e.target.value, 10) || 0)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-court)',
                            border: '1px solid var(--line-heavy)',
                            color: 'var(--ink-chalk)',
                            fontSize: '0.82rem',
                            padding: '0.2rem 0.35rem',
                            textAlign: 'center',
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>reps</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          value={set.weight_kg}
                          onChange={(e) => handleUpdateSet(set.id, 'weight_kg', Number.parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-court)',
                            border: '1px solid var(--line-heavy)',
                            color: 'var(--ink-chalk)',
                            fontSize: '0.82rem',
                            padding: '0.2rem 0.35rem',
                            textAlign: 'center',
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>kg</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(set.id)}
                        disabled={sets.length === 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: sets.length === 1 ? 'var(--line-heavy)' : '#FF6B7A',
                          cursor: sets.length === 1 ? 'not-allowed' : 'pointer',
                          padding: 0,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 3. DETERMINISTIC REAL-TIME PREVIEW CARD */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--line-graphite)',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.35rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Flame size={15} style={{ color: 'var(--accent-ember)' }} /> Gasto Estimado (MET {metValue}):
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--accent-ember)',
                }}
              >
                +{estActiveCalories} <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>kcal activas</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              {sport === 'BASKETBALL' ? (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    <Droplet size={12} style={{ display: 'inline', color: 'var(--accent-lake)' }} /> Hidratación
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-lake)' }}>
                    +{estHydrationMl} ml
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Demanda Proteica
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                    +{estProteinDemandG}g prot / {totalVolumeKg}kg ({totalSetsCount} series, {totalRepsCount} reps)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-scoreboard secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn-scoreboard ${sport === 'STRENGTH_TRAINING' ? 'lake' : ''}`}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {initialActivity ? 'Guardar Cambios' : 'Registrar Entrenamiento'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};
