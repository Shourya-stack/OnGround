import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number; // 0.0 to 1.0
  type?: 'extraction' | 'matching';
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  type = 'matching',
  size = 'md',
}) => {
  const percentage = Math.round(score * 100);

  let badgeClass = 'badge-low';
  let Icon = AlertCircle;
  let label = 'Low';

  if (score >= 0.85) {
    badgeClass = 'badge-high';
    Icon = ShieldCheck;
    label = 'High';
  } else if (score >= 0.70) {
    badgeClass = 'badge-review';
    Icon = AlertTriangle;
    label = 'Review';
  }


  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`confidence-badge ${badgeClass} ${sizeClasses[size]}`}
      title={`${type === 'matching' ? 'Match Score' : 'Extraction Confidence'}: ${percentage}% (${label})`}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{percentage}%</span>
      {size !== 'sm' && <span style={{ opacity: 0.8, fontSize: '0.75em' }}>{label}</span>}
    </span>
  );
};
