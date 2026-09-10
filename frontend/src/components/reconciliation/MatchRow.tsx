import { ScheduleMatch } from '../../lib/types';

import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MatchRowProps {
  match: ScheduleMatch;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}

export const MatchRow: React.FC<MatchRowProps> = ({
  match,
  isExpanded,
  onToggleExpand,
  onConfirm,
  onReject,
}) => {
  const { isPlanner } = useAuth();
  const extracted = match.extracted_activity;
  const plan = match.schedule_plan;
  const hasCandidates = match.candidates && match.candidates.length > 0;

  return (
    <tr
      style={{
        background: isExpanded ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <td style={{ width: '40px', textAlign: 'center' }}>
        {hasCandidates ? (
          <button
            onClick={onToggleExpand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
            title="Toggle disambiguation alternatives"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span style={{ color: 'var(--color-border)', fontSize: '0.8rem' }}>•</span>
        )}
      </td>

      <td>
        <div style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '0.875rem' }}>
          {extracted?.activity_description || 'Unknown activity'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', gap: '0.5rem' }}>
          <span style={{ textTransform: 'capitalize' }}>{extracted?.discipline || 'unknown'}</span>
          {extracted?.location_reference && <span>• {extracted.location_reference}</span>}
        </div>
      </td>

      <td>
        {plan ? (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.8rem' }}>
              {plan.activity_code}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginTop: '1px' }}>
              {plan.activity_description}
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
            Unassigned
          </span>
        )}
      </td>

      <td>
        <ConfidenceBadge score={match.confidence_score} size="sm" />
      </td>

      <td>
        <StatusBadge status={match.status} size="sm" />
      </td>

      <td style={{ textAlign: 'right' }}>
        {isPlanner && match.status === 'pending_review' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onReject(match.id)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
              title="Reject match"
            >
              <X size={13} />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onConfirm(match.id)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              title="Confirm match"
            >
              <Check size={13} /> Confirm
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
