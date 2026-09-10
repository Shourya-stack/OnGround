import React from 'react';
import { GitCompare, Filter, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ReconciliationPage: React.FC = () => {
  const { role } = useAuth();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
            Schedule Reconciliation Table
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Extracted daily site activities linked against baseline schedule milestones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-action-btn" title="Filter by discipline">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Confidence</th>
              <th>Extracted Daily Activity</th>
              <th>Discipline</th>
              <th>Matched Plan Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="confidence-badge high">
                  <CheckCircle size={12} />
                  AUTO-LINKED
                </span>
              </td>
              <td>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#10b981' }}>94%</span>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: '#ffffff' }}>Erect Line 247-XX Piping Spool at Bay 3</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily Log: piping_report_sept10.txt</div>
              </td>
              <td>
                <span style={{ fontSize: 11, color: 'var(--disc-piping)', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  PIPING
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>L5-247-ERC: Spool Erection Unit 4</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Planned: 2026-09-08 to 2026-09-14</div>
              </td>
              <td>
                {role === 'planner' ? (
                  <span style={{ fontSize: 12, color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 500 }}>Review Match</span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Read Only</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
