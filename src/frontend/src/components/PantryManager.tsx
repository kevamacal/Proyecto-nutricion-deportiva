import React from 'react';
import { Package, Dumbbell, Trophy } from 'lucide-react';
import type { PantryItem } from '../types';

interface PantryManagerProps {
  items: PantryItem[];
  onQuickBasketball: () => void;
  onQuickGym: () => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  items,
  onQuickBasketball,
  onQuickGym,
}) => {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h2 className="panel-title">
          <Package className="w-5 h-5 text-[#C1622B]" />
          Despensa e Inventario Disponible
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          {items.length} Alimentos Registrados
        </span>
      </div>

      <div className="panel-body">
        <div className="pantry-grid">
          {items.map((item) => (
            <div key={item.inventory_item_id} className="pantry-card">
              <div>
                <div className="pantry-name">{item.name}</div>
                <span className={`pantry-tag ${item.density_class}`}>
                  {item.density_class}
                </span>
              </div>
              <div className="pantry-quantity">
                {item.available_quantity} {item.unit}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--line-graphite)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <h3 className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>
            ⚡ Registro Rápido de Sesiones Deportivas
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-scoreboard" onClick={onQuickBasketball}>
              <Trophy className="w-4 h-4" />
              🏀 Partidazo (90 min)
            </button>
            <button className="btn-scoreboard lake" onClick={onQuickGym}>
              <Dumbbell className="w-4 h-4" />
              🏋️ Entreno Pesas (60 min)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
