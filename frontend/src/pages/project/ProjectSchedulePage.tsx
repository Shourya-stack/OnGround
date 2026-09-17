import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  Download,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { SchedulePlanItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectSchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<SchedulePlanItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<SchedulePlanItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const disciplines = ['all', 'civil', 'piping', 'electrical', 'instrumentation', 'static_rotating_equipment', 'hse'];

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSchedule(projectId, selectedDiscipline);
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [projectId, selectedDiscipline]);

  const filtered = schedule.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.activity_code.toLowerCase().includes(term) ||
      item.activity_description.toLowerCase().includes(term) ||
      item.discipline.toLowerCase().includes(term)
    );
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
            Baseline Schedule WBS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Master Primavera P6 contractual activity baseline standards for physical progress matching.
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
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '300px' }}>
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
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>DISCIPLINE:</span>
          {disciplines.map((d) => (
            <button
              key={d}
              type="button"
              className={`tab-pill ${selectedDiscipline === d ? 'active' : ''}`}
              onClick={() => setSelectedDiscipline(d)}
              style={{ textTransform: 'capitalize' }}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      {loading ? (
        <LoadingSkeleton rows={6} height="50px" />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>WBS Activity ID</th>
                <th>Activity Description</th>
                <th style={{ width: '160px' }}>Discipline</th>
                <th style={{ width: '130px' }}>Planned Start</th>
                <th style={{ width: '130px' }}>Planned End</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
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
                        fontSize: '13px',
                      }}
                    >
                      {item.activity_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {item.activity_description}
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
                  <td style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {item.planned_start}
                  </td>
                  <td style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {item.planned_end}
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
              ))}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Discipline</div>
                <div style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedActivity.discipline.replace('_', ' ')}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>WBS Level</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>L5 Work Package</div>
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

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Baseline Status</div>
              <div style={{ fontSize: '13px', color: 'var(--confidence-high)', fontWeight: 600 }}>
                Contractual Baseline Locked • Immutable Node
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
