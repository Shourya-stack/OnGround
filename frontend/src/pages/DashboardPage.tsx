import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="dashboard-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          Executive Project Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Automated progress linkage status & AI confidence distribution for Line 247.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>42</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-Linked (High Conf)</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>8</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Planner Review</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>3</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unmatched Activities</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>12</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reports Processed</div>
          </div>
        </div>
      </div>

      {/* Overview Panel */}
      <div className="card">
        <h2 className="card-title">Active Environment & Foundation Status</h2>
        <p className="card-subtitle">
          Phase 1 Scaffolding active. FastAPI backend and Supabase PostgreSQL client connected.
        </p>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
          <div>Current Role: <span style={{ color: role === 'planner' ? '#38bdf8' : '#f97316', fontWeight: 600 }}>{role.toUpperCase()}</span></div>
          <div style={{ marginTop: 4 }}>FastAPI Backend: <span style={{ color: '#10b981' }}>Ready (http://localhost:8000)</span></div>
          <div style={{ marginTop: 4 }}>Supabase Realtime: <span style={{ color: '#10b981' }}>Enabled</span></div>
        </div>
      </div>
    </div>
  );
};
