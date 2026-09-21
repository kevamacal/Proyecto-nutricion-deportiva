import React, { useState } from 'react';
import { Activity, Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register, loginDemo } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [primarySport, setPrimarySport] = useState<string>('BASKETBALL');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const translateAuthError = (errMessage: string): string => {
    const lower = errMessage.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
      return 'Correo electrónico o contraseña incorrectos.';
    }
    if (lower.includes('user already registered') || lower.includes('already_exists')) {
      return 'Ya existe una cuenta registrada con este correo electrónico.';
    }
    if (lower.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.';
    }
    return `Error de autenticación: ${errMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos requeridos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (mode === 'REGISTER' && !name.trim()) {
      setError('Introduce tu nombre completo para continuar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await register(email, name, password, primarySport);
      }
    } catch (err: any) {
      console.error('Authentication submit error:', err);
      setError(translateAuthError(err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      loginDemo('deportista.elite@bioenergetics.app', 'Alex Rivera');
      setLoading(false);
    }, 300);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 30%, rgba(255, 107, 53, 0.15) 0%, rgba(9, 11, 16, 0.98) 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        color: 'var(--ink-primary)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border-bright)',
          boxShadow: 'var(--shadow-glass)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Activity className="w-8 h-8 text-[#FF6B35]" />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              SPORTS BIOENERGETICS
            </span>
          </div>

          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', margin: 0 }}>
            Plataforma de Alto Rendimiento, Bioenergética y Nutrición Deportiva
          </p>
        </div>

        {/* Mode Selector Switch */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(10, 13, 20, 0.6)',
            borderRadius: 'var(--radius-pill)',
            padding: '0.3rem',
            border: '1px solid var(--glass-border)',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            style={{
              background: mode === 'LOGIN' ? 'var(--accent-ember)' : 'transparent',
              color: mode === 'LOGIN' ? '#FFF' : 'var(--ink-muted)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '0.6rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            style={{
              background: mode === 'REGISTER' ? 'var(--accent-ember)' : 'transparent',
              color: mode === 'REGISTER' ? '#FFF' : 'var(--ink-muted)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '0.6rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid var(--accent-crimson)',
              color: '#FF3366',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {mode === 'REGISTER' && (
            <div>
              <label htmlFor="auth-name-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
                Nombre Completo del Atleta:
              </label>
              <div style={{ position: 'relative' }}>
                <User className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input
                  id="auth-name-input"
                  type="text"
                  placeholder="ej. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#121620',
                    border: '1px solid var(--glass-border-bright)',
                    color: 'var(--ink-primary)',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
              Correo Electrónico:
            </label>
            <div style={{ position: 'relative' }}>
              <Mail className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
              <input
                id="auth-email-input"
                type="email"
                placeholder="atleta@deporte.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#121620',
                  border: '1px solid var(--glass-border-bright)',
                  color: 'var(--ink-primary)',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
              Contraseña de Acceso:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
              <input
                id="auth-password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  background: '#121620',
                  border: '1px solid var(--glass-border-bright)',
                  color: 'var(--ink-primary)',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label htmlFor="auth-sport-select" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
                Especialidad Deportiva Principal:
              </label>
              <select
                id="auth-sport-select"
                value={primarySport}
                onChange={(e) => setPrimarySport(e.target.value)}
                style={{
                  width: '100%',
                  background: '#121620',
                  border: '1px solid var(--glass-border-bright)',
                  color: 'var(--ink-primary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="BASKETBALL">🏀 Baloncesto Competitivo</option>
                <option value="STRENGTH">🏋️ Fuerza e Hipertrofia</option>
                <option value="HYBRID">⚡ Rendimiento Híbrido</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-action-pill primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              justifyContent: 'center',
              marginTop: '0.5rem',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Conectando a Supabase Auth...' : mode === 'LOGIN' ? 'Entrar a la Plataforma' : 'Crear mi Cuenta de Atleta'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Fast Access Button */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', display: 'block', marginBottom: '0.75rem' }}>
            ¿Quieres probar la plataforma sin registrarte?
          </span>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn-action-pill"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'rgba(0, 230, 118, 0.08)',
              border: '1px solid rgba(0, 230, 118, 0.25)',
              color: '#00E676',
              fontSize: '0.85rem',
            }}
          >
            <Sparkles className="w-4 h-4" /> Entrar como Atleta Demo
          </button>
        </div>
      </div>
    </div>
  );
};
