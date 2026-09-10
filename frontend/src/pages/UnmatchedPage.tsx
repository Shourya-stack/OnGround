import React, { useState } from 'react';
import { useUnmatched, UnmatchedActivityRecord } from '../hooks/useUnmatched';
import { DataTable, Column } from '../components/common/DataTable';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { Link2 } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { Toast, ToastMessage } from '../components/common/Toast';

export const UnmatchedPage: React.FC = () => {
  const { isPlanner } = useAuth();
  const { data: unmatched, loading, error, refetch } = useUnmatched();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleManualLink = (record: UnmatchedActivityRecord) => {
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Manual Linking Interface',
      message: `Initiated link search for: "${record.extracted_activity?.activity_description.slice(0, 30)}..."`,
    });
  };

  const columns: Column<UnmatchedActivityRecord>[] = [
    {
      key: 'description',
      header: 'Unmatched Activity Description',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
            {item.extracted_activity?.activity_description || 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', gap: '0.5rem' }}>
            <span style={{ textTransform: 'capitalize' }}>
              {item.extracted_activity?.discipline || 'unknown'}
            </span>
            {item.extracted_activity?.location_reference && (
              <span>• {item.extracted_activity.location_reference}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'System Matching Reason',
      render: (item) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.reason || 'Below confidence threshold 0.70'}
        </span>
      ),
    },
    {
      key: 'confidence',
      header: 'Extraction Conf',
      width: '130px',
      render: (item) => (
        <ConfidenceBadge
          score={item.extracted_activity?.extraction_confidence || 0.5}
          type="extraction"
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      render: (item) =>
        isPlanner ? (
          <button
            className="btn btn-secondary"
            onClick={() => handleManualLink(item)}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Link2 size={13} /> Manual Link
          </button>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>View Only</span>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Unmatched Activities Pool
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Physical work reported on site that could not be matched with high confidence to the active baseline schedule.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={unmatched}
        loading={loading}
        error={error}
        emptyTitle="No Unmatched Activities"
        emptyDescription="All extracted progress activities have been linked to the baseline schedule."
        keyExtractor={(item) => item.id}
        onRetry={refetch}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
