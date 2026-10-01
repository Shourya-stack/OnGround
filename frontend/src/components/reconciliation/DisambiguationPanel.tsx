import React, { useState, useEffect } from 'react';
import { ScheduleMatch, CandidateMatch, SchedulePlanItem } from '../../lib/types';
import { CandidateList } from './CandidateList';
import { AlertTriangle, CheckCircle, Shield, Search, X } from 'lucide-react';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

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
  const { id: routeProjectId } = useParams<{ id: string }>();
  const projectId = routeProjectId || match.schedule_plan?.project_id || '';
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [allSchedule, setAllSchedule] = useState<SchedulePlanItem[]>([]);
  const [scheduleSearch, setScheduleSearch] = useState('');

  const extracted = match.extracted_activity;

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await apiClient.getSchedule({ project_id: projectId });
        setAllSchedule(data);
      } catch (e) {
        console.error('Failed to load schedule in disambiguation', e);
      }
    };
    loadSchedule();
  }, []);

  const filteredSchedule = allSchedule.filter((p) => {
    const q = scheduleSearch.toLowerCase();
    return (
      p.activity_code.toLowerCase().includes(q) ||
      p.activity_description.toLowerCase().includes(q) ||
      p.discipline.toLowerCase().includes(q)
    );
  });

  const handleSelectFromFullSchedule = (item: SchedulePlanItem) => {
    setSelectedCandidate({
      plan_activity_id: item.id,
      activity_code: item.activity_code,
      activity_description: item.activity_description,
      score: 0.85,
      reasons: ['Manually chosen by certified planner', `Discipline: ${item.discipline}`],
      planned_progress: item.planned_progress,
      actual_progress: item.actual_progress,
    });
    setShowFullSchedule(false);
  };

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--confidence-review)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Candidate Disambiguation Hub
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Match Reference: <span style={{ fontFamily: 'var(--font-mono)' }}>{match.id}</span>
        </div>
      </div>

      <div className="disambiguation-grid" style={{ alignItems: 'flex-start' }}>
        {/* Left: Extracted Field Activity */}
        <div
          style={{
            padding: '1.2rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Extracted Daily Field Observation
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            "{extracted?.activity_description || 'N/A'}"
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', textTransform: 'capitalize', border: '1px solid var(--border-subtle)' }}>
              Discipline: <strong style={{ color: 'var(--text-primary)' }}>{extracted?.discipline || 'unknown'}</strong>
            </span>
            {extracted?.location_reference && (
              <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                Zone: <strong style={{ color: 'var(--text-primary)' }}>{extracted.location_reference}</strong>
              </span>
            )}
            {extracted && <ConfidenceBadge score={extracted.extraction_confidence} type="extraction" size="sm" />}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            Captured from daily construction report. Verify against Primavera P6 baseline WBS targets.
          </div>
        </div>

        {/* Right: Candidate Alternatives */}
        <div
          style={{
            padding: '1.2rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested Baseline Targets
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              style={{ fontSize: '11.5px', padding: '2px 6px' }}
            >
              {showFullSchedule ? 'Hide Full Schedule' : '+ Choose Other Activity'}
            </button>
          </div>

          {/* Full Schedule Search Dropdown Modal */}
          {showFullSchedule ? (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--accent-blue)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter schedule by code or description..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: '32px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowFullSchedule(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredSchedule.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFromFullSchedule(item)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      background: 'var(--bg-surface)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', marginRight: '6px' }}>
                        {item.activity_code}
                      </span>
                      <span>{item.activity_description}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {item.discipline}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CandidateList
              candidates={match.candidates || []}
              selectedId={selectedCandidate?.plan_activity_id || match.plan_activity_id}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              readOnly={!isPlanner}
            />
          )}

          {selectedCandidate && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--accent-blue)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Selected Target: <strong style={{ color: 'var(--accent-blue)' }}>{selectedCandidate.activity_code}</strong> — {selectedCandidate.activity_description.slice(0, 40)}...
              </div>
              <span className="confidence-badge high" style={{ fontSize: '11px', padding: '2px 6px' }}>
                {(selectedCandidate.score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {isPlanner ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          {onReject && (
            <button className="btn btn-danger btn-sm" onClick={() => onReject(match.id)}>
              Reject Link
            </button>
          )}
          {selectedCandidate && selectedCandidate.plan_activity_id !== match.plan_activity_id ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onConfirmAlternative && onConfirmAlternative(match.id, selectedCandidate)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={14} /> Reassign & Confirm #{selectedCandidate.activity_code}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onConfirmPrimary && onConfirmPrimary(match.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={14} /> Confirm Top Candidate
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', justifyContent: 'flex-end' }}>
          <Shield size={14} /> Switch to Planner role to confirm or reassign ambiguous matches
        </div>
      )}
    </div>
  );
};
