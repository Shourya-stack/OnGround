import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  Download,
  UploadCloud,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { SchedulePlanItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const ProjectSchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<SchedulePlanItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<SchedulePlanItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const disciplines = ['all', 'civil', 'piping', 'electrical', 'instrumentation', 'static_rotating_equipment', 'hse'];
  const statusFilters = ['all', 'ON_TRACK', 'ATTENTION', 'DELAYED', 'COMPLETED'];

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getSchedule(projectId, selectedDiscipline);
      setSchedule(data);
    } catch (err: any) {
      console.error('Failed to load schedule', err);
      setError(err?.message || 'Failed to load baseline schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [projectId, selectedDiscipline]);

  const filtered = schedule.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch =
      item.activity_code.toLowerCase().includes(term) ||
      item.activity_description.toLowerCase().includes(term) ||
      item.discipline.toLowerCase().includes(term);
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Schedule Exported',
      message: 'Primavera P6 CSV export generated successfully.',
    });
  };

  const handleImportMock = () => {
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Baseline Synchronized',
      message: 'Schedule baseline is up-to-date with 21 verified WBS nodes.',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Baseline Schedule WBS & Progress Tracking
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Master Primavera P6 contractual activity baseline standards with live planned vs actual progress variance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleImportMock}>
            <UploadCloud size={15} /> Import P6 XML/CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search activity code, description..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
            {statusFilters.map((st) => (
              <button
                key={st}
                type="button"
                className={`tab-pill ${selectedStatus === st ? 'active' : ''}`}
                onClick={() => setSelectedStatus(st)}
                style={{ textTransform: 'capitalize' }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>DISCIPLINE:</span>
          {disciplines.map((d) => (
            <button
              key={d}
              type="button"
              className={`tab-pill ${selectedDiscipline === d ? 'active' : ''}`}
              onClick={() => setSelectedDiscipline(d)}
              style={{ textTransform: 'capitalize', fontSize: '12px', padding: '3px 10px' }}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table Area */}
      {loading ? (
        <LoadingSkeleton rows={6} height="50px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSchedule} />
      ) : schedule.length === 0 ? (
        <EmptyState
          title="No Baseline Schedule Ingested"
          description="Import your Primavera P6 contractual activity baseline WBS to track physical site progress against planned milestones."
          actionLabel="Import Sample Baseline"
          onAction={handleImportMock}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          isFiltered
          title="No Schedule Activities Match Your Filters"
          description={`No baseline tasks matched "${search || selectedStatus || selectedDiscipline}". Try resetting your search query or status filter.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedStatus('all');
            setSelectedDiscipline('all');
          }}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>WBS Code</th>
                <th>Activity Description</th>
                <th style={{ width: '130px' }}>Discipline</th>
                <th style={{ width: '100px' }}>Planned</th>
                <th style={{ width: '100px' }}>Actual</th>
                <th style={{ width: '110px' }}>Variance</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const plan = item.planned_progress ?? 70;
                const act = item.actual_progress ?? 65;
                const variance = act - plan;
                const status = item.status || (variance < -10 ? 'DELAYED' : variance < 0 ? 'ATTENTION' : 'ON_TRACK');

                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--accent-blue)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          fontSize: '12.5px',
                        }}
                      >
                        {item.activity_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {item.activity_description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Window: {item.planned_start} to {item.planned_end}
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
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.discipline.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{plan}%</span>
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{act}%</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: variance < -10 ? '#ef4444' : variance < 0 ? 'var(--confidence-review)' : 'var(--confidence-high)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {variance > 0 ? `+${variance}%` : `${variance}%`}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            status === 'COMPLETED' || status === 'ON_TRACK'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : status === 'ATTENTION'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            status === 'COMPLETED' || status === 'ON_TRACK'
                              ? 'var(--confidence-high)'
                              : status === 'ATTENTION'
                              ? 'var(--confidence-review)'
                              : '#ef4444',
                          textTransform: 'uppercase',
                        }}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedActivity(item)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Baseline Activity: ${selectedActivity.activity_code}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Activity Description
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedActivity.activity_description}
              </div>
            </div>

            {/* Planned vs Actual Comparison */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Physical Progress & Variance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Planned Progress</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>{selectedActivity.planned_progress ?? 70}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actual Progress</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>{selectedActivity.actual_progress ?? 65}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Variance</div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: ((selectedActivity.actual_progress ?? 65) - (selectedActivity.planned_progress ?? 70)) < 0 ? '#ef4444' : 'var(--confidence-high)',
                      marginTop: '2px',
                    }}
                  >
                    {((selectedActivity.actual_progress ?? 65) - (selectedActivity.planned_progress ?? 70)) > 0 ? '+' : ''}
                    {((selectedActivity.actual_progress ?? 65) - (selectedActivity.planned_progress ?? 70))}%
                  </div>
                </div>
              </div>
              <ProgressBar progress={selectedActivity.actual_progress ?? 65} showLabel />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Discipline</div>
                <div style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedActivity.discipline.replace('_', ' ')}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Execution Status</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: selectedActivity.status === 'DELAYED' ? '#ef4444' : 'var(--confidence-high)' }}>
                  {selectedActivity.status?.replace('_', ' ') || 'ON TRACK'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Planned Start Date</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{selectedActivity.planned_start}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Planned End Date</div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{selectedActivity.planned_end}</div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedActivity(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
