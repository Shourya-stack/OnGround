import React from 'react';
import { Shield, ShieldAlert, History, Lock, CheckCircle2 } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="section-container" style={{ maxWidth: '960px' }}>
      <div className="section-header">
        <div className="section-tag">Governance & Data Integrity</div>
        <h1 className="section-title">Security & Governance Architecture</h1>
        <p className="section-subtitle">
          OnGround is built around strict data integrity, role-based confirmation boundaries, and immutable audit logs.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '64px' }}>
        {/* Capability 1: RBAC */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)' }}>
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Role-Based Access Control (RBAC)
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Planner vs Site Supervisor Boundaries</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
            OnGround implements role-based privilege separation to prevent unauthorized modification of schedule progress:
          </p>
          <div className="grid-2">
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldAlert size={16} style={{ color: 'var(--confidence-review)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Site Supervisor Role</h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Authorized to upload daily site reports, view extracted activities, and inspect reconciliation statuses. Cannot approve or alter baseline schedule links.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Shield size={16} style={{ color: 'var(--confidence-high)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Project Planner Role</h4>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Authorized to review candidate suggestions, confirm or reject matches, manually resolve unmatched items, and manage baseline schedule configurations.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 2: Human in the Loop */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--confidence-review)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Human-in-the-Loop Verification Gates
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deterministic Confidence Thresholds</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            The AI system does not possess autonomous authority over schedule baselines. Automatic linking only occurs when semantic similarity and contextual confidence exceed the strict threshold (0.85). Any ambiguous matches (0.70 - 0.84) are held in a pending review queue until explicitly confirmed by a verified planner.
          </p>
        </div>

        {/* Capability 3: Immutable Audit Trail */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--confidence-high)' }}>
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Append-Only Immutable Audit Trail
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete Historical Traceability</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Every action taken within the system—including file ingestion, AI activity extraction, automatic linking, manual confirmation, match rejection, and reassignment—is permanently logged in an append-only audit trail with actor identity, timestamp, confidence score, and affected entity references. Logs cannot be modified or deleted.
          </p>
        </div>

        {/* Capability 4: Baseline Immutability */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)' }}>
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Master Baseline Schedule Immutability
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contractual Baseline Preservation</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Master Primavera P6 baseline schedule nodes imported into OnGround remain immutable reference standards. Daily site progress links attach to baseline activities without modifying original baseline planned dates, contractual milestones, or WBS codes.
          </p>
        </div>
      </div>
    </div>
  );
};
