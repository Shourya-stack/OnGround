import React, { useState } from 'react';
import { ScheduleMatch, CandidateMatch } from '../../lib/types';
import { CandidateList } from './CandidateList';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';

import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { useAuth } from '../../hooks/useAuth';

interface DisambiguationPanelProps {
  match: ScheduleMatch;
  onConfirmAlternative?: (matchId: string, candidate: CandidateMatch) => void;
  onConfirmPrimary?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
}

export const DisambiguationPanel: React.FC<DisambiguationPanelProps> = ({
  match,
  onConfirmAlternative,
  onConfirmPrimary,
  onReject,
}) => {
  const { isPlanner } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);

  const extracted = match.extracted_activity;


  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.95)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Ambiguity Disambiguation: Top candidate scores within 5% proximity
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Match ID: <span style={{ fontFamily: 'monospace' }}>{match.id.slice(0, 8)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Extracted Report Activity */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Extracted from Contractor Report
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text)' }}>
            {extracted?.activity_description || 'N/A'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ padding: '0.2rem 0.5rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', textTransform: 'capitalize' }}>
              Discipline: {extracted?.discipline || 'unknown'}
            </span>
            {extracted?.location_reference && (
              <span style={{ padding: '0.2rem 0.5rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                Loc: {extracted.location_reference}
              </span>
            )}
            {extracted && <ConfidenceBadge score={extracted.extraction_confidence} type="extraction" size="sm" />}
          </div>
        </div>

        {/* Right: Candidate Alternatives */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Select Best Baseline Target
          </div>

          <CandidateList
            candidates={match.candidates || []}
            selectedId={selectedCandidate?.plan_activity_id || match.plan_activity_id}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            readOnly={!isPlanner}
          />
        </div>
      </div>

      {/* Action Bar */}
      {isPlanner ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          {onReject && (
            <button className="btn btn-secondary" onClick={() => onReject(match.id)} style={{ fontSize: '0.85rem' }}>
              Reject All
            </button>
          )}
          {selectedCandidate && selectedCandidate.plan_activity_id !== match.plan_activity_id ? (
            <button
              className="btn btn-primary"
              onClick={() => onConfirmAlternative && onConfirmAlternative(match.id, selectedCandidate)}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={14} /> Reassign & Confirm #{selectedCandidate.activity_code}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => onConfirmPrimary && onConfirmPrimary(match.id)}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={14} /> Confirm Top Candidate
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', justifyContent: 'flex-end' }}>
          <Shield size={14} /> Switch to Planner role to confirm or reassign ambiguous matches
        </div>
      )}
    </div>
  );
};
