import React, { useState, useEffect } from 'react';
import {
  Search,
  Link2,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { apiClient, formatApiErrorMessage } from '../../lib/apiClient';
import { UnmatchedActivity, SchedulePlanItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/ui/Modal';

export const ProjectUnmatchedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedActivity[]>([]);
  const [schedule, setSchedule] = useState<SchedulePlanItem[]>([]);
  const [search, setSearch] = useState('');
  const [linkingTarget, setLinkingTarget] = useState<UnmatchedActivity | null>(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unData, schedData] = await Promise.all([
        apiClient.getUnmatched(),
        apiClient.getSchedule(),
      ]);
      setUnmatched(unData || []);
      setSchedule(schedData || []);
    } catch (err: any) {
      console.error('Failed to load unmatched activities from API', err);
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualLinkClick = (record: UnmatchedActivity) => {
    setLinkingTarget(record);
  };

  const handleAttemptLink = (_targetPlanId: string) => {
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Action Not Available',
      message: 'Unmatched activity resolution mutation is not supported by the Phase 1 backend API (read-only pool).',
    });
    setLinkingTarget(null);
  };

  const filtered = unmatched.filter((u) => {
    const term = search.toLowerCase();
    const desc = (u.extracted_activity?.activity_description || '').toLowerCase();
    const disc = (u.extracted_activity?.discipline || '').toLowerCase();
    const loc = (u.extracted_activity?.location_reference || '').toLowerCase();
    return desc.includes(term) || disc.includes(term) || loc.includes(term) || u.id.toLowerCase().includes(term);
  });

  const filteredSchedule = schedule.filter((s) => {
    const term = scheduleSearch.toLowerCase();
    return (
      s.activity_code.toLowerCase().includes(term) ||
      s.activity_description.toLowerCase().includes(term) ||
      s.discipline.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Unmatched Activities Pool
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Site progress items scoring below the 70% confidence threshold that could not be automatically linked to baseline schedule activities.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loading}
          title="Refresh unmatched activities"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search unmatched activities..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <LoadingSkeleton rows={4} height="50px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : unmatched.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Unmatched Activities"
          description="All reported site tasks have been successfully linked to master baseline schedule activities."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          isFiltered
          title="No Activities Match Your Search"
          description={`No unmatched tasks matched "${search}". Try clearing your search query.`}
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unmatched Activity Description</th>
                <th style={{ width: '140px' }}>Discipline</th>
                <th style={{ width: '150px' }}>Best Score</th>
                <th style={{ width: '150px' }}>Resolution</th>
                <th style={{ width: '220px' }}>System Reason</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {u.extracted_activity?.activity_description || 'Unspecified activity'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                      <span>Extraction ID: {u.extracted_activity_id ? `${u.extracted_activity_id.slice(0, 8)}...` : '—'}</span>
                      {u.extracted_activity?.location_reference && (
                        <span>• Loc: {u.extracted_activity.location_reference}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {u.extracted_activity?.discipline || 'unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="confidence-badge low">
                      {u.best_score !== null && u.best_score !== undefined
                        ? `${(u.best_score * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {u.resolution.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {u.best_score !== null && u.best_score !== undefined
                      ? `Top score ${(u.best_score * 100).toFixed(0)}% below 70% threshold`
                      : 'No candidate schedule match found'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleManualLinkClick(u)}
                      title="Inspect candidate links"
                    >
                      <Link2 size={13} /> Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Link / Inspection Modal */}
      {linkingTarget && (
        <Modal
          isOpen={!!linkingTarget}
          onClose={() => setLinkingTarget(null)}
          title="Schedule Baseline Linking"
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Unmatched Task
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {linkingTarget.extracted_activity?.activity_description || 'Unspecified activity'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Discipline: {linkingTarget.extracted_activity?.discipline || 'unknown'} • Resolution: {linkingTarget.resolution}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Info size={15} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span>
                Baseline schedule activities available for reference. Unmatched activity mutation endpoint is not active in Phase 1 API.
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search schedule WBS baseline..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSchedule.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No master schedule activities match "{scheduleSearch}".
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
                filteredSchedule.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '12px' }}>
                          {item.activity_code}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.activity_description}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Discipline: {item.discipline} • Dates: {item.planned_start} to {item.planned_end}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAttemptLink(item.id)}
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setLinkingTarget(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
