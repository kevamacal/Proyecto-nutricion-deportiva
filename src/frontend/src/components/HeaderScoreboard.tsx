import React from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "Hoy · martes 30 de septiembre". A scoreboard always states which day it is. */
function formatToday(now: Date): string {
  const label = `${WEEKDAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  return `Hoy · ${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

interface HeaderScoreboardProps {
  /** Extra content rendered on the right, e.g. the desktop segmented nav. */
  children?: React.ReactNode;
}

export const HeaderScoreboard: React.FC<HeaderScoreboardProps> = ({ children }) => {
  const { user } = useAuth();
  const today = formatToday(new Date());

  return (
    <header className="app-header">
      <div className="brand-bar">
        <div className="brand-identity">
          <Activity size={22} style={{ color: 'var(--accent-ember)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 className="brand-title">Sports Bioenergetics</h1>
            <p className="brand-context">
              {user?.name || user?.email || 'Atleta'}
              <span className="brand-context-divider" aria-hidden="true" />
              {today}
            </p>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
};
