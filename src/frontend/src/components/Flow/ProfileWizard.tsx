import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfileStateData } from '../../types/flow';
import { ArrowLeft, ArrowRight, Check, Activity } from 'lucide-react';

interface ProfileWizardProps {
  onComplete: (data: Required<UserProfileStateData>) => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.65, 0, 0.35, 1] as const,
    },
  }),
};

export const ProfileWizard: React.FC<ProfileWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<Partial<UserProfileStateData>>({
    user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  });

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return typeof formData.age === 'number' && formData.age > 0;
      case 2:
        return !!formData.gender;
      case 3:
        return typeof formData.weight_kg === 'number' && formData.weight_kg > 0;
      case 4:
        return typeof formData.height_cm === 'number' && formData.height_cm > 0;
      case 5:
        return !!formData.activity_level;
      case 6:
        return !!(formData.body_composition_goal);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    if (step < totalSteps) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      onComplete(formData as Required<UserProfileStateData>);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const progressPct = (step / totalSteps) * 100;

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Ledger Progress Rule */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'var(--line-graphite)',
          zIndex: 100,
        }}
      >
        <motion.div
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'var(--accent-ember)',
            boxShadow: '0 0 12px var(--accent-ember-glow)',
          }}
        />
      </div>

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}
      >
        <Activity className="w-8 h-8 text-[#C1622B]" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sports Bioenergetics <span style={{ color: 'var(--accent-ember)' }}>Engine</span>
        </h1>
      </motion.div>

      {/* Card Container */}
      <div
        className="panel-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2.5rem',
          borderRadius: 0,
          border: '1px solid var(--line-heavy)',
          borderTop: '3px solid var(--accent-ember)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <span className="brand-badge">
            Paso 0{step} de 0{totalSteps}
          </span>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <ArrowLeft size={16} /> Atrás
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* STEP 1: Edad */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cuál es tu edad?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Calcula determinísticamente la tasa metabólica basal (BMR) con la ecuación de Mifflin-St Jeor.
                </p>
                <input
                  type="number"
                  min="14"
                  max="99"
                  value={formData.age ?? ''}
                  placeholder="Ej: 25"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFormData({ ...formData, age: isNaN(val) ? undefined : val });
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--accent-ember)',
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                />
              </div>
            )}

            {/* STEP 2: Sexo */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  Sexo biológico
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Constante fisiológica para la tasa metabólica en reposo.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`btn-action-pill ${formData.gender === 'male' ? 'primary' : ''}`}
                    style={{ padding: '1.5rem', justifyContent: 'center', fontSize: '1.1rem' }}
                  >
                    ♂ Masculino
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    className={`btn-action-pill ${formData.gender === 'female' ? 'primary' : ''}`}
                    style={{ padding: '1.5rem', justifyContent: 'center', fontSize: '1.1rem' }}
                  >
                    ♀ Femenino
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Peso */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cuánto pesas (kg)?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Base para la distribución de macronutrientes g/kg de masa corporal.
                </p>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg ?? ''}
                  placeholder="Ej: 75.0"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({ ...formData, weight_kg: isNaN(val) ? undefined : val });
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--accent-ember)',
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                />
              </div>
            )}

            {/* STEP 4: Altura */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cuál es tu estatura (cm)?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Completa la estimación de gasto energético basal.
                </p>
                <input
                  type="number"
                  step="0.5"
                  value={formData.height_cm ?? ''}
                  placeholder="Ej: 180"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFormData({ ...formData, height_cm: isNaN(val) ? undefined : val });
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    background: 'var(--bg-court)',
                    border: '1px solid var(--line-heavy)',
                    color: 'var(--accent-ember)',
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                />
              </div>
            )}

            {/* STEP 5: Nivel de Actividad */}
            {step === 5 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  Actividad Diaria Estilo de Vida
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Multiplicador PAL de rutina diaria sin incluir sesiones deportivas específicas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'SEDENTARY', label: 'Sedentario (Oficina / Trabajo sentado)' },
                    { key: 'MODERATE', label: 'Moderado (Caminatas / Trabajo activo)' },
                    { key: 'ACTIVE', label: 'Activo (Gran movimiento en el día)' },
                    { key: 'VERY_ACTIVE', label: 'Muy Activo (Trabajo físico pesado)' },
                  ].map((act) => (
                    <button
                      key={act.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, activity_level: act.key })}
                      className={`btn-action-pill ${formData.activity_level === act.key ? 'primary' : ''}`}
                      style={{ padding: '1rem 1.25rem', justifyContent: 'flex-start', fontSize: '0.95rem' }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Objetivo */}
            {step === 6 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  Objetivo Nutricional
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Determina la periodización nutricional y superávit/déficit calórico.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'BULK', label: 'Ganancia Muscular / Volumen (Bulk)' },
                    { key: 'CUT', label: 'Pérdida de Grasa / Definición (Cut)' },
                    { key: 'RECOMP', label: 'Recomposición Corporal' },
                    { key: 'MAINTAIN', label: 'Mantenimiento & Rendimiento Deportivo' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, body_composition_goal: g.key })}
                      className={`btn-action-pill ${(formData.body_composition_goal) === g.key ? 'primary' : ''}`}
                      style={{ padding: '1rem 1.25rem', justifyContent: 'flex-start', fontSize: '0.95rem' }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleNext}
          disabled={!isStepValid()}
          className="btn-scoreboard"
          style={{
            marginTop: '2rem',
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            opacity: isStepValid() ? 1 : 0.5,
            cursor: isStepValid() ? 'pointer' : 'not-allowed',
          }}
        >
          {step === totalSteps ? (
            <>
              Calcular Metas Fisiológicas <Check size={20} />
            </>
          ) : (
            <>
              Siguiente Paso <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
