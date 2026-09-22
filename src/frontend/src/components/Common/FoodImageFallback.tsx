import React, { useState } from 'react';
import { getFoodMeta } from '../Food/foodMeta';

interface FoodImageFallbackProps {
  imageUrl?: string | null;
  foodName: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const FoodImageFallback: React.FC<FoodImageFallbackProps> = ({
  imageUrl,
  foodName,
  category = 'General',
  size = 'md',
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const meta = getFoodMeta(foodName, category);

  const displayImage = imageUrl && !imageError ? imageUrl : meta.image;

  let containerDimensions = { width: '48px', height: '48px', fontSize: '1.4rem' };
  if (size === 'sm') {
    containerDimensions = { width: '36px', height: '36px', fontSize: '1.1rem' };
  } else if (size === 'lg') {
    containerDimensions = { width: '72px', height: '72px', fontSize: '2.2rem' };
  }

  if (displayImage && !imageError) {
    return (
      <div
        style={{
          width: containerDimensions.width,
          height: containerDimensions.height,
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'var(--bg-court)',
          border: '1px solid var(--line-heavy)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <img
          src={displayImage}
          alt={foodName}
          onError={() => setImageError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: containerDimensions.width,
        height: containerDimensions.height,
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${meta.color}22 0%, var(--bg-court) 100%)`,
        border: `1px solid ${meta.color}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: containerDimensions.fontSize,
        flexShrink: 0,
        ...style,
      }}
      title={`${foodName} (${meta.badge})`}
    >
      {meta.emoji}
    </div>
  );
};
