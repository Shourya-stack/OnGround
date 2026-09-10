import React from 'react';
import { CandidateMatch } from '../../lib/types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { Check } from 'lucide-react';

interface CandidateListProps {
  candidates: CandidateMatch[];
  selectedId?: string;
  onSelectCandidate?: (candidate: CandidateMatch) => void;
  readOnly?: boolean;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  selectedId,
  onSelectCandidate,
  readOnly = false,
}) => {
  if (!candidates || candidates.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No alternative candidates found.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {candidates.map((cand, idx) => {
        const isSelected = selectedId === cand.plan_activity_id;
        return (
          <div
            key={cand.plan_activity_id || idx}
            onClick={() => !readOnly && onSelectCandidate && onSelectCandidate(cand)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--color-surface)',
              border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  padding: '0.15rem 0.4rem',
                  background: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'nowrap',
                }}
              >
                #{idx + 1} • {cand.activity_code}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  {cand.activity_description}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ConfidenceBadge score={cand.score} size="sm" />
              {isSelected && (
                <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
