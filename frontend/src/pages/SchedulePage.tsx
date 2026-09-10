import React from 'react';
import { CalendarRange, UploadCloud, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const SchedulePage: React.FC = () => {
  const { role } = useAuth();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
            Baseline Schedule WBS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Ground truth Primavera P6 / MS Project milestone baseline (SCHEDULE_PLAN).
          </p>
        </div>

        {role === 'planner' && (
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={16} />
            <span>Import Schedule CSV</span>
          </button>
        )}
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>WBS Activity Code</th>
              <th>Activity Description</th>
              <th>Discipline</th>
              <th>Planned Start</th>
              <th>Planned End</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>L5-247-ERC</td>
              <td>Erect Line 247-XX Piping Spool</td>
              <td>
                <span style={{ fontSize: 11, color: 'var(--disc-piping)', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  PIPING
                </span>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>2026-09-08</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>2026-09-22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
