import React, { useState } from 'react';
import { LucideIcon, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'primary' | 'danger' | 'info' | 'purple';
  onClick?: () => void;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const iconBgMap: Record<string, string> = {
    default: 'var(--metric-steps)',
    primary: 'var(--metric-steps)',
    success: 'var(--metric-recovery)',
    warning: 'var(--chart-warn)',
    danger: 'var(--metric-heart)',
    info: 'var(--metric-vital)',
    purple: 'var(--metric-sleep)',
  };

  const bg = iconBgMap[variant] || 'var(--metric-steps)';

  return (
    <article
      className={`bionis-metric-card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Top Row: Icon Badge + Label + 3-Dot Options */}
      <div className="bionis-metric-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <span
            className="bionis-metric-icon-wrap"
            style={{ backgroundColor: bg }}
          >
            <Icon size={16} />
          </span>
          <span className="bionis-metric-title" title={title}>
            {title}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="sidebar-collapse-btn"
            style={{ width: '24px', height: '24px', border: 'none' }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label={`Options for ${title}`}
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div
              className="bionis-chart-tooltip"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 30,
                minWidth: '120px',
                padding: '4px',
                marginTop: '4px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => setMenuOpen(false)}
              >
                View Details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Value Row */}
      <div className="bionis-metric-value-wrap">
        <div>
          <span className="bionis-metric-value">{value}</span>
          {unit && <span className="bionis-metric-unit">{unit}</span>}
        </div>

        {/* Trend & Context Row */}
        {(trend || subtitle) && (
          <div className="bionis-trend-wrap">
            {trend && (
              <span className={`bionis-trend-badge ${trend.isPositive ? 'positive' : 'negative'}`}>
                {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trend.value}</span>
              </span>
            )}
            <span className="bionis-trend-label">
              {trend?.label || subtitle || 'vs baseline'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
