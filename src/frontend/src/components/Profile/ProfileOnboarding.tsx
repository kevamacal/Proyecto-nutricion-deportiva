import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calculateTargets } from '../../services/api';

export const ProfileOnboarding: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user, isDemoMode, logout, updateProfile, setTargets } = useAuth();

  const [weightKg, setWeightKg] = useState<number>(user?.weight_kg || 70);
  const [heightCm, setHeightCm] = useState<number>(user?.height_cm || 175);
  const [age, setAge] = useState<number>(user?.age || 25);
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender === 'female' ? 'female' : 'male');
  const [activityLevel, setActivityLevel] = useState<string>(user?.activity_level || 'ACTIVE');
  const [bodyCompositionGoal, setBodyCompositionGoal] = useState<string>(user?.body_composition_goal || 'BULK');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleCalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call backend deterministic calculation engine
      const targets = await calculateTargets({
        user_id: user.id,
        weight_kg: weightKg,
        height_cm: heightCm,
        age,
        gender,
        activity_level: activityLevel,
        body_composition_goal: bodyCompositionGoal
      });

      updateProfile({
        weight_kg: weightKg,
        height_cm: heightCm,
        age,
        gender,
        activity_level: activityLevel,
        body_composition_goal: bodyCompositionGoal,
      });

      setTargets(targets);
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Failed to calculate targets:', err);
      setError('No hemos podido calcular tus objetivos. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
      <div
        style={{
          background: 'var(--surface-hardwood, #2A2118)',
          border: '1px solid var(--line-graphite, #4A473F)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          color: 'var(--ink-chalk, #F2EFE6)',
        }}
      >
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
          Tu perfil y objetivos
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#B3B0A6', marginBottom: '1.5rem' }}>
          Ajusta tus datos y recalculamos al instante tus calorías y macronutrientes diarios.
        </p>

        {error && (
          <div
            role="alert"
            style={{ background: 'rgba(178, 58, 72, 0.2)', border: '1px solid var(--accent-crimson)', color: '#FF8A95', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleCalculateAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="profile-weight-input" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Peso (kg)
              </label>
              <input
                id="profile-weight-input"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number.parseFloat(e.target.value) || 0)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#171511',
                  border: '1px solid #4A473F',
                  color: '#F2EFE6',
                  borderRadius: '2px',
                }}
              />
            </div>

            <div>
              <label htmlFor="profile-height-input" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Altura (cm)
              </label>
              <input
                id="profile-height-input"
                type="number"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(Number.parseFloat(e.target.value) || 0)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#171511',
                  border: '1px solid #4A473F',
                  color: '#F2EFE6',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="profile-age-input" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Edad (años)
              </label>
              <input
                id="profile-age-input"
                type="number"
                value={age}
                onChange={(e) => setAge(Number.parseInt(e.target.value, 10) || 0)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#171511',
                  border: '1px solid #4A473F',
                  color: '#F2EFE6',
                  borderRadius: '2px',
                }}
              />
            </div>

            <div>
              <label htmlFor="profile-gender-select" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Sexo Biológico
              </label>
              <select
                id="profile-gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#171511',
                  border: '1px solid #4A473F',
                  color: '#F2EFE6',
                  borderRadius: '2px',
                }}
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="profile-activity-select" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
              Nivel de Actividad General
            </label>
            <select
              id="profile-activity-select"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#171511',
                border: '1px solid #4A473F',
                color: '#F2EFE6',
                borderRadius: '2px',
              }}
            >
              <option value="SEDENTARY">Sedentario (Oficina / Poco movimiento)</option>
              <option value="MODERATE">Moderado (Entreno 2-3 días/semana)</option>
              <option value="ACTIVE">Activo (Entreno 4-5 días + Deporte)</option>
              <option value="VERY_ACTIVE">Muy Activo (Atleta Alto Rendimiento)</option>
            </select>
          </div>

          <div>
            <label htmlFor="profile-goal-select" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
              Objetivo Corporal / Deporte
            </label>
            <select
              id="profile-goal-select"
              value={bodyCompositionGoal}
              onChange={(e) => setBodyCompositionGoal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#171511',
                border: '1px solid #4A473F',
                color: '#F2EFE6',
                borderRadius: '2px',
              }}
            >
              <option value="BULK">Volumen / Ganancia Muscular (Bulk)</option>
              <option value="CUT">Definición / Pérdida Grasa (Cut)</option>

              <option value="RECOMP">Recomposición Corporal</option>
              <option value="MAINTAIN">Mantenimiento Rendimiento</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--accent-ember, #C1622B)',
              color: '#FFF',
              border: 'none',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
            }}
          >
            {loading ? 'Recalculando tus objetivos...' : 'Recalcular mis objetivos'}
          </button>
        </form>

        {user.targets && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px dashed #4A473F',
            }}
          >
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--accent-ember, #C1622B)', marginBottom: '0.5rem' }}>
              Tus objetivos actuales
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>Energía en reposo: <strong>{user.targets.bmr_kcal} kcal</strong></div>
              <div>Gasto diario estimado: <strong>{user.targets.base_tdee_kcal} kcal</strong></div>
              <div>Calorías objetivo: <strong style={{ color: 'var(--accent-ember, #C1622B)' }}>{user.targets.calories_target_kcal} kcal</strong></div>
              <div>Proteína: <strong>{user.targets.protein_target_g} g</strong></div>
              <div>Carbohidratos: <strong>{user.targets.carbs_target_g} g</strong></div>
              <div>Grasas: <strong>{user.targets.fat_target_g} g</strong></div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #4A473F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{user.name || user.email || 'Atleta'}</div>
            <div style={{ fontSize: '0.75rem', color: '#B3B0A6' }}>
              {isDemoMode ? 'Perfil de ejemplo' : user.email}
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(178, 58, 72, 0.15)',
              border: '1px solid var(--accent-crimson)',
              color: '#FF8A95',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
