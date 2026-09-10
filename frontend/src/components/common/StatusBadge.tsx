import React from 'react';
import { CheckCircle2, Clock, Eye, AlertCircle, XCircle, Sparkles } from 'lucide-react';
import { MatchStatus, ExtractionStatus } from '../../lib/types';

interface StatusBadgeProps {
  status: MatchStatus | ExtractionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  const config: Record<string, { label: string; icon: any; className: string }> = {
    auto_linked: {
      label: 'Auto Linked',
      icon: Sparkles,
      className: 'badge-high',
    },
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      className: 'badge-high',
    },
    pending_review: {
      label: 'Needs Review',
      icon: Eye,
      className: 'badge-review',
    },
    unmatched: {
      label: 'Unmatched',
      icon: AlertCircle,
      className: 'badge-low',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      className: 'badge-low',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'badge-review',
    },
    processing: {
      label: 'Processing',
      icon: Clock,
      className: 'badge-review',
    },
    extracted: {
      label: 'Extracted',
      icon: CheckCircle2,
      className: 'badge-high',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className: 'badge-low',
    },
  };

  const current = config[normalized] || {
    label: status.replace('_', ' '),
    icon: Clock,
    className: 'badge-review',
  };

  const Icon = current.icon;
  const sizeStyle = size === 'sm' ? { fontSize: '0.7rem', padding: '0.15rem 0.5rem' } : {};

  return (
    <span className={`confidence-badge ${current.className}`} style={sizeStyle}>
      <Icon size={size === 'sm' ? 11 : 13} />
      <span style={{ textTransform: 'capitalize' }}>{current.label}</span>
    </span>
  );
};
