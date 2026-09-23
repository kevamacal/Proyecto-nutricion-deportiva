import React from 'react';
import { Clock } from 'lucide-react';
import type { LoggedMealEntry } from '../../types';
import { FoodCategoryBadge } from '../Common/FoodCategoryBadge';
import { formatEnumLabel, MEAL_TYPE_LABELS } from '../../utils/enumMappers';

interface LoggedMealCardProps {
  meal: LoggedMealEntry;
  showTime?: boolean;
  showIngredientsList?: boolean;
  actionButton?: React.ReactNode;
  style?: React.CSSProperties;
}

export const LoggedMealCard: React.FC<LoggedMealCardProps> = ({
  meal,
  showTime = false,
  showIngredientsList = false,
  actionButton,
  style,
}) => {
  const slotTitle = formatEnumLabel(meal.meal_type, MEAL_TYPE_LABELS);
  const displayName = meal.name || slotTitle;
  const mealTime = meal.logged_at
    ? new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--line-graphite)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem',
        ...style,
      }}
    >
      <FoodCategoryBadge foodName={displayName} category={meal.meal_type} size="md" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink-chalk)' }}>
            {displayName}
          </span>
          <span
            style={{
              background: 'rgba(0, 230, 118, 0.15)',
              color: '#00E676',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
            }}
          >
            {slotTitle.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--ink-muted)',
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {showTime && (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={12} /> {mealTime}
              </span>
              <span>•</span>
            </>
          )}
          <span style={{ color: 'var(--accent-ember)', fontWeight: 700 }}>
            +{meal.total_calories_kcal} kcal
          </span>
          <span>•</span>
          <span style={{ color: '#00E676', fontWeight: 700 }}>+{meal.total_protein_g}g prot</span>
          <span>•</span>
          <span style={{ color: '#FF6B35', fontWeight: 700 }}>+{meal.total_carbs_g}g carb</span>
          <span>•</span>
          <span style={{ color: '#A855F7', fontWeight: 700 }}>+{meal.total_fat_g}g grasa</span>
        </div>

        {showIngredientsList && meal.items && meal.items.length > 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '0.35rem' }}>
            Ingredientes: {meal.items.map((it) => `${it.name} (${it.quantity}${it.unit})`).join(', ')}
          </div>
        )}
      </div>

      {actionButton}
    </div>
  );
};
