import React from 'react';
import { HelpCircle, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const UnmatchedPage: React.FC = () => {
  const { role } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          Unmatched Activities
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Daily report activities where AI similarity fell below threshold or detected potential scope additions.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
          <AlertCircle size={20} color="#f59e0b" />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Unmatched activities can be manually linked by a <strong>Planner</strong> or flagged as new scope items.
          </span>
        </div>

        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
          No unmatched activities currently pending review.
        </div>
      </div>
    </div>
  );
};
