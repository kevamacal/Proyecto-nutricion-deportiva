import React from 'react';
import { Activity } from 'lucide-react';

export const HeaderScoreboard: React.FC = () => {
  return (
    <header className="app-header">
      <div className="brand-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={24} style={{ color: 'var(--accent-ember)' }} />
          <h1 className="brand-title">
            Sports Bioenergetics
          </h1>
        </div>
      </div>
    </header>
  );
};

