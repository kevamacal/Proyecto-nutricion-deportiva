import React from 'react';
import { getFoodMeta } from '../Food/foodMeta';

interface FoodCategoryBadgeProps {
  foodName: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const FoodCategoryBadge: React.FC<FoodCategoryBadgeProps> = ({
  foodName,
  category = 'General',
  size = 'md',
  style,
}) => {
  const meta = getFoodMeta(foodName, category);

  let dimensions = { width: '44px', height: '44px', fontSize: '1.3rem' };
  if (size === 'sm') {
    dimensions = { width: '34px', height: '34px', fontSize: '1.05rem' };
  } else if (size === 'lg') {
    dimensions = { width: '64px', height: '64px', fontSize: '2rem' };
  }

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${meta.color}22 0%, var(--bg-court) 100%)`,
        border: `1px solid ${meta.color}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dimensions.fontSize,
        flexShrink: 0,
        ...style,
      }}
      title={`${foodName} (${meta.badge})`}
    >
      {meta.emoji}
    </div>
  );
};
