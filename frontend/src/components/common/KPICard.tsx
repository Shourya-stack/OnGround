import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'primary';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const accentColors = {
    default: 'var(--color-primary)',
    primary: 'var(--color-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
  };

  return (
    <div className="kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--color-text)' }}>
            {value}
          </div>
        </div>
        <div
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-hover)',
            color: accentColors[variant],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          {trend && (
            <span
              style={{
                color: trend.isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 600,
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span style={{ color: 'var(--color-text-muted)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
