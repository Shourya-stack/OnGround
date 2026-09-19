import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { ScheduleMatch, CandidateMatch } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/ui/Modal';
import { DisambiguationPanel } from '../../components/reconciliation/DisambiguationPanel';
import { TraceabilityModal } from '../../components/traceability/TraceabilityModal';

export const ProjectReconciliationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'matched' | 'unmatched'>('review');
  const [search, setSearch] = useState('');
  const [disambiguateMatch, setDisambiguateMatch] = useState<ScheduleMatch | null>(null);
  const [traceMatch, setTraceMatch] = useState<ScheduleMatch | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMatches(projectId);
      setMatches(data);
    } catch (err: any) {
      console.error('Failed to load matches', err);
      setError(err?.message || 'Failed to load reconciliation items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [projectId]);

  const handleConfirm = async (matchId: string) => {
    try {
      await apiService.confirmMatch(matchId);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Match Confirmed',
        message: 'Physical progress linked to Primavera P6 baseline schedule.',
      });
      loadMatches();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Confirmation Failed',
        message: err.message,
      });
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await apiService.rejectMatch(matchId);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Match Rejected',
        message: 'Activity moved to Unmatched pool.',
      });
      loadMatches();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Rejection Failed',
        message: err.message,
      });
    }
  };

  const handleConfirmAlternative = async (matchId: string, candidate: CandidateMatch) => {
    try {
      await apiService.reassignMatch(matchId, candidate);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Alternative Target Linked',
        message: `Successfully linked to baseline activity #${candidate.activity_code}.`,
      });
      setDisambiguateMatch(null);
      loadMatches();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Reassignment Failed',
        message: err.message,
      });
    }
  };

  // Filter items by search and activeTab
  const reviewMatches = matches.filter((m) => m.status === 'pending_review');
  const matchedList = matches.filter((m) => m.status === 'auto_linked' || m.status === 'confirmed');
  const rejectedList = matches.filter((m) => m.status === 'rejected');

  const currentList =
    activeTab === 'review'
      ? reviewMatches
      : activeTab === 'matched'
      ? matchedList
      : rejectedList;

  const filtered = currentList.filter((m) => {
    const term = search.toLowerCase();
    const desc = m.extracted_activity?.activity_description.toLowerCase() || '';
    const code = m.schedule_plan?.activity_code.toLowerCase() || '';
    const planDesc = m.schedule_plan?.activity_description.toLowerCase() || '';
    return desc.includes(term) || code.includes(term) || planDesc.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Progress Reconciliation Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Review semantic links between contractor daily reports and master baseline schedule activities.
        </p>
      </div>

      {/* Tabs & Search Toolbar */}
      <div
        className="bionis-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Needs Review</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {reviewMatches.length}
            </span>
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'matched' ? 'active' : ''}`}
            onClick={() => setActiveTab('matched')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Matched & Confirmed</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {matchedList.length}
            </span>
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'unmatched' ? 'active' : ''}`}
            onClick={() => setActiveTab('unmatched')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Rejected / Unmatched</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              {rejectedList.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter activities or codes..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Reconciliation Cards List */}
      {loading ? (
        <LoadingSkeleton rows={4} height="80px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadMatches} />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={
            activeTab === 'review'
              ? 'Review Queue Clear!'
              : activeTab === 'matched'
              ? 'No Confirmed Matches'
              : 'No Rejected Activities'
          }
          description={
            activeTab === 'review'
              ? 'All ambiguous extracted activities have been reconciled to the master schedule.'
              : activeTab === 'matched'
              ? 'No confirmed schedule matches are recorded for this project yet.'
              : 'No physical tasks have been rejected or marked as unmatched.'
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          isFiltered
          title="No Activities Match Your Search"
          description={`No items in "${activeTab === 'review' ? 'Needs Review' : activeTab === 'matched' ? 'Matched' : 'Rejected'}" matched your query "${search}".`}
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bionis-card reconciliation-card"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'grid',
                gridTemplateColumns: '1.4fr 120px 1.4fr auto',
                alignItems: 'center',
                gap: '1.25rem',
              }}
            >
              {/* Daily Report Extracted Activity */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Daily Site Report Activity
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {m.extracted_activity?.activity_description}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>Discipline: <strong style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{m.extracted_activity?.discipline}</strong></span>
                  {m.extracted_activity?.location_reference && (
                    <span>• {m.extracted_activity.location_reference}</span>
                  )}
                </div>
              </div>

              {/* Linking Arrow & Similarity */}
              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <span
                  className={`confidence-badge ${m.confidence_score >= 0.85 ? 'high' : m.confidence_score >= 0.7 ? 'review' : 'low'}`}
                >
                  {(m.confidence_score * 100).toFixed(1)}%
                </span>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                  Similarity
                </div>
              </div>

              {/* Schedule WBS Target */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--confidence-high)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Primavera P6 Target Task
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '13px' }}>
                    {m.schedule_plan?.activity_code}
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.schedule_plan?.activity_description}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Planned: {m.schedule_plan?.planned_start} to {m.schedule_plan?.planned_end}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {m.status === 'pending_review' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      title="Confirm Link"
                      onClick={() => handleConfirm(m.id)}
                    >
                      <Check size={14} /> Confirm
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      title="Disambiguate Alternatives"
                      onClick={() => setDisambiguateMatch(m)}
                    >
                      Change Match
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      title="Reject Match"
                      aria-label="Reject Match"
                      onClick={() => handleReject(m.id)}
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="Trace full evidence chain"
                      onClick={() => setTraceMatch(m)}
                    >
                      Trace
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: m.status === 'confirmed' || m.status === 'auto_linked' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: m.status === 'confirmed' || m.status === 'auto_linked' ? 'var(--confidence-high)' : '#ef4444',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDisambiguateMatch(m)}
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="Trace full evidence chain"
                      onClick={() => setTraceMatch(m)}
                    >
                      Trace
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disambiguation Modal */}
      {disambiguateMatch && (
        <Modal
          isOpen={!!disambiguateMatch}
          onClose={() => setDisambiguateMatch(null)}
          title="Disambiguation & Candidate Matching"
          maxWidth="820px"
        >
          <DisambiguationPanel
            match={disambiguateMatch}
            onConfirmAlternative={handleConfirmAlternative}
            onConfirmPrimary={handleConfirm}
            onReject={handleReject}
          />
        </Modal>
      )}

      {/* Traceability Modal */}
      {traceMatch && (
        <TraceabilityModal
          isOpen={!!traceMatch}
          onClose={() => setTraceMatch(null)}
          match={traceMatch}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
