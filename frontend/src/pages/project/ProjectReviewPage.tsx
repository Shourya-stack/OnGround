import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  ListPlus,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { ScheduleMatch, CandidateMatch, SchedulePlanItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/ui/Modal';

export const ProjectReviewPage: React.FC = () => {
  const { id, matchId } = useParams<{ id: string; matchId?: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [reviewMatches, setReviewMatches] = useState<ScheduleMatch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Full schedule selector state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [allSchedule, setAllSchedule] = useState<SchedulePlanItem[]>([]);
  const [scheduleSearch, setScheduleSearch] = useState('');

  const loadReviewQueue = async () => {
    setLoading(true);
    try {
      const [data, sched] = await Promise.all([
        apiService.getMatches(projectId, 'pending_review'),
        apiService.getSchedule(projectId),
      ]);
      setReviewMatches(data);
      setAllSchedule(sched);
      if (matchId) {
        const found = data.findIndex((m) => m.id === matchId);
        if (found !== -1) {
          setSelectedIndex(found);
        } else {
          setSelectedIndex((prev) => Math.min(prev, Math.max(0, data.length - 1)));
        }
      } else {
        setSelectedIndex((prev) => Math.min(prev, Math.max(0, data.length - 1)));
      }
    } catch (err) {
      console.error('Failed to load review queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewQueue();
  }, [projectId]);

  const safeIndex = Math.min(selectedIndex, Math.max(0, reviewMatches.length - 1));
  const current = reviewMatches[safeIndex];

  const handleConfirm = async () => {
    if (!current) return;
    try {
      await apiService.confirmMatch(current.id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Match Confirmed',
        message: `Linked "${current.extracted_activity?.activity_description.slice(0, 30)}..." to ${current.schedule_plan?.activity_code}.`,
      });
      loadReviewQueue();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleReject = async () => {
    if (!current) return;
    try {
      await apiService.rejectMatch(current.id);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Match Rejected',
        message: 'Activity sent to the unmatched reconciliation pool.',
      });
      loadReviewQueue();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleChooseAlternative = async (candidate: CandidateMatch) => {
    if (!current) return;
    try {
      await apiService.reassignMatch(current.id, candidate);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Activity Reassigned & Confirmed',
        message: `Successfully linked to baseline task #${candidate.activity_code}.`,
      });
      loadReviewQueue();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleChooseFromMasterSchedule = async (item: SchedulePlanItem) => {
    if (!current) return;
    setShowScheduleModal(false);
    const candidate: CandidateMatch = {
      plan_activity_id: item.id,
      activity_code: item.activity_code,
      activity_description: item.activity_description,
      score: 0.88,
      reasons: ['Manually selected by certified planner', `Discipline: ${item.discipline}`],
      planned_progress: item.planned_progress,
      actual_progress: item.actual_progress,
    };
    await handleChooseAlternative(candidate);
  };

  const filteredMasterSchedule = allSchedule.filter((p) => {
    const q = scheduleSearch.toLowerCase();
    return (
      p.activity_code.toLowerCase().includes(q) ||
      p.activity_description.toLowerCase().includes(q) ||
      p.discipline.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <Link
          to={`/projects/${projectId}/reconciliation`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginBottom: '8px',
          }}
        >
          <ArrowLeft size={14} /> Back to Reconciliation Hub
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Human Verification & Review Hub
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Verify semantic matching proposals between field observations and Primavera P6 baseline tasks.
            </p>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--confidence-review)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {reviewMatches.length} Items Pending Review
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} height="80px" />
      ) : reviewMatches.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--confidence-high)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Review Queue Clear!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            All ambiguous physical tasks have been reviewed and verified by the certified planner.
          </p>
          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-primary">
            Return to Reconciliation Table
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pagination bar */}
          {reviewMatches.length > 1 && (
            <div
              className="glass-card"
              style={{
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Reviewing candidate <strong style={{ color: 'var(--text-primary)' }}>{safeIndex + 1}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{reviewMatches.length}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safeIndex === 0}
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safeIndex >= reviewMatches.length - 1}
                  onClick={() => setSelectedIndex((prev) => Math.min(reviewMatches.length - 1, prev + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="review-workspace-grid">
            {/* Main Inspection Card */}
            <div className="glass-card" style={{ padding: '32px' }}>
              {/* Field Reported Activity */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Field Observation from Site Report
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  "{current?.extracted_activity?.activity_description}"
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>
                    Discipline: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{current?.extracted_activity?.discipline}</strong>
                  </span>
                  {current?.extracted_activity?.location_reference && (
                    <span>
                      Location: <strong style={{ color: 'var(--text-primary)' }}>{current?.extracted_activity.location_reference}</strong>
                    </span>
                  )}
                  <span>
                    Extraction Confidence: <strong style={{ color: 'var(--confidence-high)' }}>{((current?.extracted_activity?.extraction_confidence || 0.9) * 100).toFixed(0)}%</strong>
                  </span>
                </div>
              </div>

              {/* Current AI Suggestion */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--confidence-high)', textTransform: 'uppercase' }}>
                    Primary Proposed Schedule Match
                  </span>
                  <span className="confidence-badge review">
                    Confidence: {((current?.confidence_score || 0.78) * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '15px' }}>
                    {current?.schedule_plan?.activity_code}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {current?.schedule_plan?.activity_description}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>Planned Window: {current?.schedule_plan?.planned_start} to {current?.schedule_plan?.planned_end}</span>
                  {current?.schedule_plan?.planned_progress !== undefined && (
                    <span>Baseline Plan: <strong>{current.schedule_plan.planned_progress}%</strong></span>
                  )}
                  {current?.schedule_plan?.actual_progress !== undefined && (
                    <span>Actual Recorded: <strong>{current.schedule_plan.actual_progress}%</strong></span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  onClick={handleConfirm}
                >
                  <CheckCircle2 size={18} /> Confirm This Match
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => setShowScheduleModal(true)}
                  title="Choose from all schedule activities"
                >
                  <ListPlus size={18} /> Choose Other Activity
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-lg"
                  onClick={handleReject}
                >
                  <XCircle size={18} /> Reject Match
                </button>
              </div>
            </div>

            {/* Alternatives Column */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Candidate Alternatives
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Ranked semantic candidate matches with justification
              </p>

              {current?.candidates && current.candidates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {current.candidates.map((cand) => (
                    <div
                      key={cand.activity_code}
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '13px' }}>
                          {cand.activity_code}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <span className="confidence-badge review" style={{ fontSize: '11px', padding: '2px 6px' }}>
                            {(cand.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                        {cand.activity_description}
                      </p>

                      {/* Reasons */}
                      {cand.reasons && cand.reasons.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {cand.reasons.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              style={{
                                fontSize: '10.5px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress Metrics (Distinct from Match Similarity) */}
                      {(cand.planned_progress !== undefined || cand.actual_progress !== undefined) && (
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Plan: <strong style={{ color: 'var(--text-primary)' }}>{cand.planned_progress ?? '—'}%</strong></span>
                          <span>Actual: <strong style={{ color: 'var(--text-primary)' }}>{cand.actual_progress ?? '—'}%</strong></span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', marginTop: '4px' }}
                        onClick={() => handleChooseAlternative(cand)}
                      >
                        Choose This Target
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No close alternative candidates detected. Use "Choose Other Activity" to pick from the full schedule.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Schedule Picker Modal */}
      {showScheduleModal && (
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Select Schedule Activity from Master Baseline"
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search activity code, description, or discipline..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMasterSchedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No master schedule tasks match "{scheduleSearch}".
                  {scheduleSearch && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setScheduleSearch('')}
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredMasterSchedule.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleChooseFromMasterSchedule(item)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '12.5px' }}>
                          {item.activity_code}
                        </span>
                        <span style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                          • {item.discipline}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.activity_description}
                      </div>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
