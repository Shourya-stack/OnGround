import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search,
  User,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { AuditTrailEntry, ScheduleMatch } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { TraceabilityModal } from '../../components/traceability/TraceabilityModal';

export const ProjectAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditTrailEntry[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditTrailEntry | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditData, matchData] = await Promise.all([
        apiService.getAuditTrail(projectId),
        apiService.getMatches(projectId),
      ]);
      setLogs(auditData);
      setMatches(matchData);
    } catch (err: any) {
      console.error('Failed to load audit trail', err);
      setError(err?.message || 'Failed to load audit trail events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [projectId]);

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (log.actor && log.actor.toLowerCase().includes(term)) ||
      log.action.toLowerCase().includes(term) ||
      (log.related_match_id && log.related_match_id.toLowerCase().includes(term));
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Immutable System Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Chronological, append-only verification log tracking ingestion, extraction, and planner decisions.
        </p>
      </div>

      {/* Filter Bar */}
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
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search actor, action, match ID..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION:</span>
          {['all', 'confirmed', 'auto_linked', 'flagged', 'rejected', 'extracted'].map((act) => (
            <button
              key={act}
              type="button"
              className={`tab-pill ${actionFilter === act ? 'active' : ''}`}
              onClick={() => setActionFilter(act)}
              style={{ textTransform: 'capitalize' }}
            >
              {act.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Timeline / Table Area */}
      {loading ? (
        <LoadingSkeleton rows={5} height="60px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Logs"
          description="Every match confirmation, rejection, and AI link decision will be immutably recorded in this project audit trail."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          isFiltered
          title="No Audit Events Match Filters"
          description={`No audit logs matched "${search || actionFilter}". Try resetting your search or action filter.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setActionFilter('all');
          }}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Timestamp</th>
                <th style={{ width: '200px' }}>Actor</th>
                <th style={{ width: '150px' }}>Action</th>
                <th>Target Object / Context</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Confidence</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Lineage</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                          <User size={13} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {log.actor || 'System Engine'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            log.action === 'confirmed' || log.action === 'auto_linked'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : log.action === 'flagged'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            log.action === 'confirmed' || log.action === 'auto_linked'
                              ? 'var(--confidence-high)'
                              : log.action === 'flagged'
                              ? 'var(--confidence-review)'
                              : '#ef4444',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {log.related_match_id ? (
                        <span>Schedule match reference <code>{log.related_match_id}</code></span>
                      ) : (
                        <span>Direct report ingestion event</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {log.confidence_score !== null ? (
                        <span className="confidence-badge high" style={{ fontSize: '11px', padding: '2px 6px' }}>
                          {((log.confidence_score || 0.9) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedAudit(log)}
                        title="Trace full evidence chain"
                      >
                        Trace
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Traceability Modal */}
      {selectedAudit && (
        <TraceabilityModal
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
          auditEntry={selectedAudit}
          match={matches.find((m) => m.id === selectedAudit.related_match_id)}
        />
      )}
    </div>
  );
};
