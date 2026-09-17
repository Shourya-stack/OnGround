import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = '8px',
  showLabel = false,
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{clamped}%</span>
        </div>
      )}
      <div className="progress-bar-container" style={{ height }}>
        <div
          className="progress-bar-fill"
          style={{
            width: `${clamped}%`,
            background: color || undefined,
          }}
        />
      </div>
    </div>
  );
};
