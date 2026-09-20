import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { calculateTargets } from '../../services/api';

export const ProfileOnboarding: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { user, isDemoMode, logout, updateProfile, setTargets } = useAuth();

  const [weightKg, setWeightKg] = useState<number>(user.weight_kg);
  const [heightCm, setHeightCm] = useState<number>(user.height_cm);
  const [age, setAge] = useState<number>(user.age);
  const [gender, setSex] = useState<'male' | 'female'>(user.gender);
  const [activityLevel, setActivityLevel] = useState<string>(user.activity_level);
  const [bodyCompositionGoal, setBodyCompositionGoal] = useState<string>(user.body_composition_goal || 'BULK');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Error calculando metas en el motor backend. Revisa los campos.');
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
          borderRadius: '4px',
          padding: '1.5rem',
          color: 'var(--ink-chalk, #F2EFE6)',
        }}
      >
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
          Perfil & Objetivos Fisiológicos
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#B3B0A6', marginBottom: '1.5rem' }}>
          Configura tu biometría. El motor determinista calculará tu BMR, TDEE y distribución macronutricional exacta.
        </p>

        {error && (
          <div style={{ background: '#B23A48', color: '#fff', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCalculateAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Altura (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Edad (años)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
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
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
                Sexo Biológico
              </label>
              <select
                value={gender}
                onChange={(e) => setSex(e.target.value as 'male' | 'female')}
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
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
              Nivel de Actividad General
            </label>
            <select
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
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#B3B0A6' }}>
              Objetivo Corporal / Deporte
            </label>
            <select
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
            {loading ? 'Calculando con Motor Backend...' : 'Calcular Metas Fisiológicas'}
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
              Resultados de tu Perfil (Backend Output)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>BMR (Metabolismo Basal): <strong>{user.targets.bmr_kcal} kcal</strong></div>
              <div>TDEE Estimado: <strong>{user.targets.base_tdee_kcal} kcal</strong></div>
              <div>Calorías Objetivo: <strong style={{ color: 'var(--accent-ember, #C1622B)' }}>{user.targets.calories_target_kcal} kcal</strong></div>
              <div>Proteína Target: <strong>{user.targets.protein_target_g} g</strong></div>
              <div>Carbohidratos Target: <strong>{user.targets.carbs_target_g} g</strong></div>
              <div>Grasas Target: <strong>{user.targets.fat_target_g} g</strong></div>
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
              {isDemoMode ? 'Modo Demo Activo' : `ID: ${user.id}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid rgba(255, 51, 102, 0.4)',
              color: '#FF3366',
              borderRadius: '2px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cerrar Sesión de Usuario
          </button>
        </div>
      </div>
    </div>
  );
};
