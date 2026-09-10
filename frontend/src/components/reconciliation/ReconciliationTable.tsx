import React, { useState } from 'react';
import { ScheduleMatch, CandidateMatch } from '../../lib/types';
import { MatchRow } from './MatchRow';
import { DisambiguationPanel } from './DisambiguationPanel';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ErrorState } from '../common/ErrorState';
import { Search, CheckCheck } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

interface ReconciliationTableProps {
  matches: ScheduleMatch[];
  loading?: boolean;
  error?: string | null;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onConfirmAlternative?: (id: string, candidate: CandidateMatch) => void;
  onRefresh?: () => void;
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  matches,
  loading,
  error,
  onConfirm,
  onReject,
  onConfirmAlternative,
  onRefresh,
}) => {
  const { isPlanner } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const disciplines = ['all', 'piping', 'electrical', 'civil', 'instrumentation', 'static_rotating_equipment'];
  const statuses = ['all', 'pending_review', 'auto_linked', 'confirmed', 'rejected'];

  const filteredMatches = matches.filter((m) => {
    const desc = m.extracted_activity?.activity_description?.toLowerCase() || '';
    const code = m.schedule_plan?.activity_code?.toLowerCase() || '';
    const planDesc = m.schedule_plan?.activity_description?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = desc.includes(term) || code.includes(term) || planDesc.includes(term);
    const matchesDiscipline =
      selectedDiscipline === 'all' ||
      m.extracted_activity?.discipline?.toLowerCase() === selectedDiscipline ||
      m.schedule_plan?.discipline?.toLowerCase() === selectedDiscipline;
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const handleBatchConfirm = () => {
    const reviewMatches = filteredMatches.filter((m) => m.status === 'pending_review');
    reviewMatches.forEach((m) => onConfirm(m.id));
  };

  if (error) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Control Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.75rem',
              minWidth: '240px',
            }}
          >
            <Search size={15} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search descriptions, codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Discipline Filter */}
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            style={{
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              padding: '0.4rem 0.75rem',
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

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              padding: '0.4rem 0.75rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Actions for Planner */}
        {isPlanner && (
          <div>
            <button
              className="btn btn-secondary"
              onClick={handleBatchConfirm}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCheck size={15} /> Batch Confirm Visible
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <LoadingSkeleton rows={6} height="52px" />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title="No Reconciliation Matches Found"
          description="Try adjusting your search terms or filter selection to see linked progress items."
        />
      ) : (
        <div style={{ overflowX: 'auto', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Extracted Activity (Report)</th>
                <th>Linked Plan Target (Primavera/P6)</th>
                <th style={{ width: '110px' }}>Confidence</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((match) => {
                const isExpanded = expandedMatchId === match.id;
                return (
                  <React.Fragment key={match.id}>
                    <MatchRow
                      match={match}
                      isExpanded={isExpanded}
                      onToggleExpand={() => setExpandedMatchId(isExpanded ? null : match.id)}
                      onConfirm={onConfirm}
                      onReject={onReject}
                    />
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <DisambiguationPanel
                            match={match}
                            onConfirmAlternative={onConfirmAlternative}
                            onConfirmPrimary={onConfirm}
                            onReject={onReject}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
