import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfileStateData } from '../../types/flow';
import { ArrowLeft, ArrowRight, Check, Activity } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<Partial<UserProfileStateData>>({
    user_id: user?.id || 'demo-user-id',
  });

  /** Live validation message for the current step, or null when it can advance. */
  const stepIssue: string | null = (() => {
    switch (step) {
      case 1:
        if (formData.age === undefined) return null;
        if (formData.age < 14 || formData.age > 99) return 'La edad debe estar entre 14 y 99 años.';
        return null;
      case 3:
        if (formData.weight_kg === undefined) return null;
        if (formData.weight_kg < 30 || formData.weight_kg > 250) {
          return 'El peso debe estar entre 30 y 250 kg.';
        }
        return null;
      case 4:
        if (formData.height_cm === undefined) return null;
        if (formData.height_cm < 120 || formData.height_cm > 230) {
          return 'La estatura debe estar entre 120 y 230 cm.';
        }
        return null;
      default:
        return null;
    }
  })();

  const isStepValid = (): boolean => {
    if (stepIssue) return false;
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
                  Con la edad podemos estimar cuánto energía quemas en reposo. Necesitamos 6 datos en total.
                </p>
                <div className="metric-input">
                  <input
                    id="wizard-age-input"
                    type="number"
                    min="14"
                    max="99"
                    inputMode="numeric"
                    value={formData.age ?? ''}
                    placeholder="25"
                    aria-label="Edad en años"
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10);
                      setFormData({ ...formData, age: Number.isNaN(val) ? undefined : val });
                    }}
                  />
                  <span className="metric-input-unit">años</span>
                </div>
              </div>
            )}

            {/* STEP 2: Sexo */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  Sexo biológico
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Nos sirve para ajustar el cálculo de energía en reposo.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    aria-pressed={formData.gender === 'male'}
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    className={`btn-action-pill ${formData.gender === 'male' ? 'primary' : ''}`}
                    style={{ padding: '1.5rem', justifyContent: 'center', fontSize: '1.1rem' }}
                  >
                    ♂ Masculino
                  </button>
                  <button
                    type="button"
                    aria-pressed={formData.gender === 'female'}
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
                  ¿Cuánto pesas?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Fijamos la distribución de proteína, carbohidratos y grasas por kilo de masa muscular.
                </p>
                <div className="metric-input">
                  <input
                    id="wizard-weight-input"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={formData.weight_kg ?? ''}
                    placeholder="75"
                    aria-label="Peso en kilogramos"
                    onChange={(e) => {
                      const val = Number.parseFloat(e.target.value);
                      setFormData({ ...formData, weight_kg: Number.isNaN(val) ? undefined : val });
                    }}
                  />
                  <span className="metric-input-unit">kg</span>
                </div>
              </div>
            )}

            {/* STEP 4: Altura */}
            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cuál es tu estatura?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Con estatura, edad y peso completamos tu gasto energético basal.
                </p>
                <div className="metric-input">
                  <input
                    id="wizard-height-input"
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={formData.height_cm ?? ''}
                    placeholder="180"
                    aria-label="Estatura en centímetros"
                    onChange={(e) => {
                      const val = Number.parseFloat(e.target.value);
                      setFormData({ ...formData, height_cm: Number.isNaN(val) ? undefined : val });
                    }}
                  />
                  <span className="metric-input-unit">cm</span>
                </div>
              </div>
            )}

            {/* STEP 5: Nivel de Actividad */}
            {step === 5 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cómo es tu día a día?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Tu rutina normal, sin contar los entrenamientos que registrarás aparte.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'SEDENTARY', label: 'Sedentario', hint: 'Trabajo de oficina, apenas movimiento' },
                    { key: 'MODERATE', label: 'Moderado', hint: 'Caminatas frecuentes o trabajo activo' },
                    { key: 'ACTIVE', label: 'Activo', hint: 'Mucho movimiento durante el día' },
                    { key: 'VERY_ACTIVE', label: 'Muy activo', hint: 'Trabajo físico pesado' },
                  ].map((act) => (
                    <button
                      key={act.key}
                      type="button"
                      aria-pressed={formData.activity_level === act.key}
                      onClick={() => setFormData({ ...formData, activity_level: act.key })}
                      className={`btn-action-pill ${formData.activity_level === act.key ? 'primary' : ''}`}
                      style={{ padding: '0.9rem 1.25rem', justifyContent: 'flex-start', fontSize: '0.95rem', textTransform: 'none', letterSpacing: 0 }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
                        <span>{act.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0, opacity: 0.75 }}>
                          {act.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Objetivo */}
            {step === 6 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                  ¿Cuál es tu objetivo?
                </h2>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Marca si quieres mantener tu peso, subirlo o definirlo. Es el último paso.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'BULK', label: 'Ganancia muscular', hint: 'Subir peso y masa muscular' },
                    { key: 'CUT', label: 'Pérdida de grasa', hint: 'Definición manteniendo músculo' },
                    { key: 'RECOMP', label: 'Recomposición corporal', hint: 'Grasa abajo y músculo arriba' },
                    { key: 'MAINTAIN', label: 'Mantenimiento', hint: 'Sostener peso y rendimiento' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      aria-pressed={formData.body_composition_goal === g.key}
                      onClick={() => setFormData({ ...formData, body_composition_goal: g.key })}
                      className={`btn-action-pill ${formData.body_composition_goal === g.key ? 'primary' : ''}`}
                      style={{ padding: '0.9rem 1.25rem', justifyContent: 'flex-start', fontSize: '0.95rem', textTransform: 'none', letterSpacing: 0 }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.1rem' }}>
                        <span>{g.label}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0, opacity: 0.75 }}>
                          {g.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {stepIssue && (
          <p
            role="alert"
            style={{
              marginTop: '1.25rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(178, 58, 72, 0.18)',
              border: '1px solid var(--accent-crimson)',
              color: '#FF8A95',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {stepIssue}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleNext}
          type="button"
          disabled={!isStepValid()}
          className="btn-scoreboard"
          style={{
            marginTop: '1.75rem',
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
          }}
        >
          {step === totalSteps ? (
            <>
              Ver mis objetivos <Check size={20} />
            </>
          ) : (
            <>
              Siguiente <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
