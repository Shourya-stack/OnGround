import React from 'react';
import { History, ShieldCheck } from 'lucide-react';

export const AuditPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          Immutable Audit Trail
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Append-only cryptographic ledger of all extraction, matching, confirmation, and rejection actions.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <ShieldCheck size={20} color="#10b981" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
            System Memory & Verification (Database-level Append-Only Guarantee)
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Confidence</th>
                <th>Actor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>2026-09-10 14:32:10 UTC</td>
                <td>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                    EXTRACTED
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>0.92</td>
                <td>SYSTEM (AI Pipeline)</td>
                <td>Extracted 4 daily activities from piping_report_sept10.txt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
