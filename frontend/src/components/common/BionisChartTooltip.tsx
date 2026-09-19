import React from 'react';
import { LucideIcon, Calendar } from 'lucide-react';

export interface ChartTooltipItemConfig {
  label: string | ((point?: any) => string);
  dataKey: string;
  formatValue?: (val: any, point?: any) => React.ReactNode;
  color?: string;
}

export interface BionisChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string | number;
    value?: any;
    color?: string;
    fill?: string;
    stroke?: string;
    payload?: Record<string, any>;
  }>;
  label?: React.ReactNode;
  icon?: LucideIcon;
  items?: ChartTooltipItemConfig[];
}

export const BionisChartTooltip: React.FC<BionisChartTooltipProps> = ({
  active,
  payload,
  label,
  icon: Icon = Calendar,
  items,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  const titleText = point?.fullDate || point?.label || point?.date || label || '—';

  return (
    <div className="bionis-chart-tooltip">
      <div className="bionis-chart-tooltip-title">
        {Icon && <Icon size={12} />}
        <span>{titleText}</span>
      </div>

      {items && items.length > 0
        ? items.map((item) => {
            const rawVal =
              point?.[item.dataKey] ??
              payload.find((p) => p.dataKey === item.dataKey)?.value;
            const displayLabel =
              typeof item.label === 'function' ? item.label(point) : item.label;
            const displayVal = item.formatValue
              ? item.formatValue(rawVal, point)
              : rawVal ?? '—';
            const dotColor = item.color || 'var(--accent-blue)';

            return (
              <div key={item.dataKey} className="bionis-chart-tooltip-row">
                <div className="bionis-chart-tooltip-key">
                  <span
                    className="bionis-chart-tooltip-dot"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{displayLabel}</span>
                </div>
                <span className="bionis-chart-tooltip-val">{displayVal}</span>
              </div>
            );
          })
        : payload.map((p, idx) => (
            <div key={String(p.dataKey || idx)} className="bionis-chart-tooltip-row">
              <div className="bionis-chart-tooltip-key">
                <span
                  className="bionis-chart-tooltip-dot"
                  style={{ backgroundColor: p.color || p.fill || p.stroke || 'var(--accent-blue)' }}
                />
                <span>{String(p.name || p.dataKey || '')}</span>
              </div>
              <span className="bionis-chart-tooltip-val">{String(p.value ?? '—')}</span>
            </div>
          ))}
    </div>
  );
};
