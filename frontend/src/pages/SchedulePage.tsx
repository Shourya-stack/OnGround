import React, { useState } from 'react';
import { useSchedulePlan } from '../hooks/useSchedulePlan';
import { SchedulePlanItem } from '../lib/types';
import { DataTable, Column } from '../components/common/DataTable';
import { Calendar, Tag, UploadCloud } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { Toast, ToastMessage } from '../components/common/Toast';

export const SchedulePage: React.FC = () => {
  const { isPlanner } = useAuth();
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const { data: schedule, loading, error, refetch } = useSchedulePlan(selectedDiscipline);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const disciplines = ['all', 'piping', 'electrical', 'civil', 'instrumentation', 'static_rotating_equipment'];

  const handleUploadBaseline = () => {
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Baseline Schedule Upload',
      message: 'Primavera P6 XML / CSV baseline parser ready for project schedule updates.',
    });
  };

  const columns: Column<SchedulePlanItem>[] = [
    {
      key: 'activity_code',
      header: 'WBS Code',
      width: '140px',
      render: (item) => (
        <span
          style={{
            fontWeight: 700,
            color: 'var(--color-primary)',
            fontFamily: 'monospace',
            padding: '0.2rem 0.5rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {item.activity_code}
        </span>
      ),
    },
    {
      key: 'activity_description',
      header: 'Baseline Activity Description',
      render: (item) => (
        <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
          {item.activity_description}
        </div>
      ),
    },
    {
      key: 'discipline',
      header: 'Discipline',
      width: '150px',
      render: (item) => (
        <span
          style={{
            fontSize: '0.8rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-hover)',
            textTransform: 'capitalize',
            color: 'var(--color-text)',
          }}
        >
          {item.discipline.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Planned Window',
      width: '200px',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Calendar size={13} />
          <span>
            {item.planned_start} → {item.planned_end}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Baseline Schedule (Primavera P6)
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Authoritative project baseline work breakdown structure and activity milestones.
          </p>
        </div>

        {isPlanner && (
          <button
            className="btn btn-primary"
            onClick={handleUploadBaseline}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UploadCloud size={16} /> Update Baseline (P6)
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          background: 'var(--color-surface)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag size={15} /> Discipline:
        </div>
        <select
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text)',
            padding: '0.35rem 0.65rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
        >
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All Disciplines' : d.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={schedule}
        loading={loading}
        error={error}
        emptyTitle="No Schedule Activities"
        emptyDescription="No baseline activities found for this project."
        keyExtractor={(item) => item.id}
        onRetry={refetch}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
