import React from 'react';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { AuditTimeline } from '../components/audit/AuditTimeline';

export const AuditPage: React.FC = () => {
  const { data: logs, loading, error, refetch } = useAuditTrail();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
          System Audit Trail
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Immutable, append-only chronological log of all ingestion, extraction, semantic matching, confirmation, and rejection actions across the project.
        </p>
      </div>

      <AuditTimeline logs={logs} loading={loading} error={error} onRefresh={refetch} />
    </div>
  );
};
