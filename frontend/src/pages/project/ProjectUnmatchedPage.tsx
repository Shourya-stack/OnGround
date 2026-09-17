import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { UnmatchedActivity, SchedulePlanItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/ui/Modal';

export const ProjectUnmatchedPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

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
        apiService.getUnmatched(projectId),
        apiService.getSchedule(projectId),
      ]);
      setUnmatched(unData);
      setSchedule(schedData);
    } catch (err: any) {
      console.error('Failed to load unmatched activities', err);
      setError(err?.message || 'Failed to load unmatched activities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleManualLink = async (targetPlanId: string) => {
    if (!linkingTarget) return;
    try {
      await apiService.resolveUnmatched(linkingTarget.id, targetPlanId);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Manually Linked',
        message: 'Activity successfully attached to baseline schedule node.',
      });
      setLinkingTarget(null);
      loadData();
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err.message });
    }
  };

  const filtered = unmatched.filter((u) => {
    const term = search.toLowerCase();
    return u.extracted_activity?.activity_description.toLowerCase().includes(term);
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
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Unmatched Activities Pool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Site progress items scoring below the 70% confidence threshold. Resolve manually or investigate for scope additions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
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
                <th style={{ width: '160px' }}>Best Similarity</th>
                <th style={{ width: '220px' }}>System Reason</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {u.extracted_activity?.activity_description}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Report ID: {u.extracted_activity?.extraction_id}
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
                      {u.extracted_activity?.discipline}
                    </span>
                  </td>
                  <td>
                    <span className="confidence-badge low">
                      {((u.best_score || 0.5) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Below minimum 70.0% matching threshold
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setLinkingTarget(u)}
                    >
                      <Link2 size={13} /> Manual Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Link Modal */}
      {linkingTarget && (
        <Modal
          isOpen={!!linkingTarget}
          onClose={() => setLinkingTarget(null)}
          title="Manual Schedule Linking"
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Unmatched Task
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {linkingTarget.extracted_activity?.activity_description}
              </div>
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

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      onClick={() => handleManualLink(item.id)}
                    >
                      Link
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setLinkingTarget(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
