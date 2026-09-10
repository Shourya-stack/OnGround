import React from 'react';
import { ScheduleMatch, CandidateMatch } from '../../lib/types';
import { ActivityDetailCard } from './ActivityDetailCard';
import { CandidateList } from '../reconciliation/CandidateList';
import { ConfirmRejectBar } from './ConfirmRejectBar';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ArrowLeft, Calendar, Tag, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReviewPanelProps {
  match: ScheduleMatch;
  onConfirm: () => void;
  onReject: (reason?: string) => void;
  onSelectAlternative?: (candidate: CandidateMatch) => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  match,
  onConfirm,
  onReject,
  onSelectAlternative,
}) => {
  const extracted = match.extracted_activity;
  const plan = match.schedule_plan;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/reconciliation"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Match Reconciliation Review
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Match ID: {match.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ConfidenceBadge score={match.confidence_score} size="lg" />
          <StatusBadge status={match.status} />
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Extracted Report Activity */}
        {extracted && <ActivityDetailCard activity={extracted} />}

        {/* Right: Master Schedule Baseline Target */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Linked Baseline Activity (Primavera/P6)
              </span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {plan ? plan.activity_description : 'No baseline activity linked'}
              </h3>
            </div>
            {plan && (
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  padding: '0.2rem 0.6rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {plan.activity_code}
              </span>
            )}
          </div>

          {plan && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Tag size={16} color="var(--color-primary)" />
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Discipline</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                    {plan.discipline}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Calendar size={16} color="var(--color-primary)" />
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Planned Window</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    {plan.planned_start} to {plan.planned_end}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative Candidate Suggestions if Ambiguous */}
      {match.candidates && match.candidates.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Alternative Semantic Candidates ({match.candidates.length})
            </h3>
          </div>
          <CandidateList
            candidates={match.candidates}
            selectedId={match.plan_activity_id}
            onSelectCandidate={onSelectAlternative}
          />
        </div>
      )}

      {/* Decision Bar */}
      <ConfirmRejectBar onConfirm={onConfirm} onReject={onReject} />
    </div>
  );
};
