import React from 'react';
import { CandidateMatch } from '../../lib/types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { Check, Info, TrendingUp } from 'lucide-react';

interface CandidateListProps {
  candidates: CandidateMatch[];
  selectedId?: string;
  onSelectCandidate?: (candidate: CandidateMatch) => void;
  onAcceptCandidate?: (candidate: CandidateMatch) => void;
  onRejectCandidate?: () => void;
  readOnly?: boolean;
  showActions?: boolean;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  selectedId,
  onSelectCandidate,
  onAcceptCandidate,
  onRejectCandidate,
  readOnly = false,
  showActions = false,
}) => {
  if (!candidates || candidates.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
        No candidate schedule activities identified.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {candidates.map((cand, idx) => {
        const isSelected = selectedId === cand.plan_activity_id;
        const variance =
          cand.actual_progress !== undefined && cand.planned_progress !== undefined
            ? cand.actual_progress - cand.planned_progress
            : null;

        return (
          <div
            key={cand.plan_activity_id || idx}
            onClick={() => !readOnly && onSelectCandidate && onSelectCandidate(cand)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
              border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              cursor: readOnly ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Top row: Code, Description, Score */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    padding: '2px 8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{idx + 1} • {cand.activity_code}
                </span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {cand.activity_description}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <ConfidenceBadge score={cand.score} size="sm" />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
                    Similarity
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                    <Check size={18} />
                  </div>
                )}
              </div>
            </div>

            {/* Match Reasons (Why this candidate was suggested) */}
            {cand.reasons && cand.reasons.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={11} /> Suggested because:
                </span>
                {cand.reasons.map((reason, rIdx) => (
                  <span
                    key={rIdx}
                    style={{
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}

            {/* Physical Planned vs Actual metrics (Separated from similarity!) */}
            {(cand.planned_progress !== undefined || cand.actual_progress !== undefined) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} style={{ color: 'var(--accent-blue)' }} />
                  <span>Baseline Plan: <strong style={{ color: 'var(--text-primary)' }}>{cand.planned_progress ?? '—'}%</strong></span>
                </div>
                <div>
                  <span>Actual Recorded: <strong style={{ color: 'var(--text-primary)' }}>{cand.actual_progress ?? '—'}%</strong></span>
                </div>
                {variance !== null && (
                  <div>
                    <span>Variance: </span>
                    <strong style={{ color: variance < 0 ? '#ef4444' : 'var(--confidence-high)' }}>
                      {variance > 0 ? `+${variance}%` : `${variance}%`}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Optional inline actions */}
            {showActions && !readOnly && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCandidate && onSelectCandidate(cand);
                  }}
                  style={{ fontSize: '11.5px', padding: '4px 10px' }}
                >
                  Change Target
                </button>
                {onAcceptCandidate && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptCandidate(cand);
                    }}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    <Check size={12} /> Accept Link
                  </button>
                )}
                {onRejectCandidate && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectCandidate();
                    }}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
