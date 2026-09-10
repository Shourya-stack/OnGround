import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
  variant?: 'table' | 'card' | 'line';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  height = '42px',
  variant = 'line',
}) => {
  if (variant === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="kpi-card"
            style={{
              height: '110px',
              animation: 'pulse 1.5s infinite ease-in-out',
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            background: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
            animation: 'pulse 1.5s infinite ease-in-out',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
};
