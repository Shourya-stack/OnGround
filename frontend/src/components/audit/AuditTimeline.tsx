import React, { useState } from 'react';
import { AuditTrailEntry } from '../../lib/types';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ErrorState } from '../common/ErrorState';
import { User, Bot, Clock, Filter } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditTrailEntry[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  logs,
  loading,
  error,
  onRefresh,
}) => {
  const [selectedAction, setSelectedAction] = useState('all');

  const actions = ['all', 'confirmed', 'auto_linked', 'flagged', 'rejected', 'extracted', 'manually_linked'];

  const filteredLogs = logs.filter((log) => {
    return selectedAction === 'all' || log.action.toLowerCase() === selectedAction.toLowerCase();
  });

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'confirmed':
      case 'auto_linked':
        return 'badge-high';
      case 'rejected':
      case 'failed':
        return 'badge-low';
      default:
        return 'badge-review';
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Filters Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          <Filter size={15} /> Action:
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text)',
            padding: '0.35rem 0.65rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} height="64px" />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          description="There are no lifecycle events matching the current filter criteria."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="card"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: log.actor ? 'var(--color-success)' : 'var(--color-primary)',
                  }}
                >
                  {log.actor ? <User size={18} /> : <Bot size={18} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className={`confidence-badge ${getActionBadgeColor(log.action)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      by <strong style={{ color: 'var(--color-text)' }}>{log.actor ? `User (${log.actor.slice(0, 8)}...)` : 'System Engine'}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {log.related_match_id ? `Match ID: ${log.related_match_id.slice(0, 8)}...` : log.related_unmatched_id ? `Unmatched ID: ${log.related_unmatched_id.slice(0, 8)}...` : `Log ID: ${log.id.slice(0, 8)}...`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                <Clock size={13} />
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
