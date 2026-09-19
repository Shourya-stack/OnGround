import React, { HTMLAttributes } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ScoreDonutProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  size?: number | string;
  color?: string;
  sublabel?: string;
}

const CHART_ANIMATION_MS = 850;

export const ScoreDonut: React.FC<ScoreDonutProps> = ({
  value,
  max = 100,
  label = 'Score',
  sublabel,
  size = 114,
  color = 'var(--score)',
  className = '',
  style,
  ...props
}) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clamped / max : 0;

  const pieData = [
    { name: 'Score', value: progress },
    { name: 'Remaining', value: Math.max(1 - progress, 0) },
  ];

  return (
    <div
      className={`bionis-score-donut ${className}`}
      style={{
        position: 'relative',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          {/* Outer subtle halo ring */}
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            innerRadius="90%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} fillOpacity={0.06} />
          </Pie>

          {/* Inner background track */}
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} fillOpacity={0.12} />
          </Pie>

          {/* Foreground progress arc with rounded caps */}
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
            isAnimationActive
            animationDuration={CHART_ANIMATION_MS}
            animationEasing="ease-out"
          >
            <Cell key="score" fill={color} />
            <Cell key="remaining" fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center readout */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            lineHeight: 1.2,
            color: 'var(--text-muted)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {clamped}
        </span>
        {sublabel && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
