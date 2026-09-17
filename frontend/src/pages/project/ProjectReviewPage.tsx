import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { ScheduleMatch, CandidateMatch } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectReviewPage: React.FC = () => {
  const { id, matchId } = useParams<{ id: string; matchId?: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [reviewMatches, setReviewMatches] = useState<ScheduleMatch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadReviewQueue = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMatches(projectId, 'pending_review');
      setReviewMatches(data);
      if (matchId) {
        const found = data.findIndex((m) => m.id === matchId);
        if (found !== -1) setSelectedIndex(found);
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

  const current = reviewMatches[selectedIndex];

  const handleConfirm = async () => {
    if (!current) return;
    try {
      await apiService.confirmMatch(current.id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Match Confirmed',
        message: `Linked ${current.extracted_activity?.activity_description.slice(0, 30)} to ${current.schedule_plan?.activity_code}.`,
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
        message: 'Sent to unmatched pool.',
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
        title: 'Alternative Assigned',
        message: `Reassigned to ${candidate.activity_code}.`,
      });
      loadReviewQueue();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <Link to={`/projects/${projectId}/reconciliation`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '8px' }}>
          <ArrowLeft size={14} /> Back to Reconciliation
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Human Review Hub
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Inspect and resolve uncertain AI matching suggestions requiring certified planner sign-off.
            </p>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--confidence-review)', fontSize: '13px', fontWeight: 700 }}>
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
            All ambiguous physical tasks have been reviewed and verified.
          </p>
          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-primary">
            Return to Reconciliation Table
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                Reviewing candidate <strong style={{ color: 'var(--text-primary)' }}>{selectedIndex + 1}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{reviewMatches.length}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={selectedIndex === 0}
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={selectedIndex >= reviewMatches.length - 1}
                  onClick={() => setSelectedIndex((prev) => Math.min(reviewMatches.length - 1, prev + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
            {/* Main Inspection Card */}
            <div className="glass-card" style={{ padding: '32px' }}>
            {/* Reported Activity */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Field Reported Activity
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {current?.extracted_activity?.activity_description}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                <span>Discipline: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{current?.extracted_activity?.discipline}</strong></span>
                {current?.extracted_activity?.location_reference && (
                  <span>Location: {current?.extracted_activity.location_reference}</span>
                )}
                <span>Extraction Conf: {((current?.extracted_activity?.extraction_confidence || 0.9) * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* AI Suggestion */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--confidence-high)', textTransform: 'uppercase' }}>
                  Top AI Suggestion
                </span>
                <span className="confidence-badge review">
                  Confidence: {((current?.confidence_score || 0.78) * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '15px' }}>
                  {current?.schedule_plan?.activity_code}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {current?.schedule_plan?.activity_description}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Planned: {current?.schedule_plan?.planned_start} to {current?.schedule_plan?.planned_end}
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
                <CheckCircle2 size={18} /> Confirm AI Suggestion
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Candidate Alternatives
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ranked by semantic vector proximity
            </p>

            {current?.candidates && current.candidates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {current.candidates.map((cand) => (
                  <div
                    key={cand.activity_code}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '13px' }}>
                        {cand.activity_code}
                      </span>
                      <span className="confidence-badge review" style={{ fontSize: '11px', padding: '2px 6px' }}>
                        {(cand.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
                      {cand.activity_description}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                      onClick={() => handleChooseAlternative(cand)}
                    >
                      Choose This Target
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No close alternative candidates detected for this task.
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
