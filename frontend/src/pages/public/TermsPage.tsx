import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="section-container" style={{ maxWidth: '840px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '32px' }}>
        <div className="section-tag">Terms & Conditions</div>
        <h1 className="section-title">Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Last updated: September 17, 2026</p>
      </div>

      <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the OnGround Infrastructure Progress Intelligence System, you agree to be bound by these Terms of Service and all applicable construction industry data standards.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Prototype & Phase 1 Scope</h2>
          <p>
            This application represents Phase 1 of the OnGround system. Certain enterprise integrations, live Primavera direct APIs, payment gateways, and automated enterprise billing are intentionally deferred to subsequent development phases.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Role-Governed Responsibilities</h2>
          <p>
            Users assigned the Project Planner role bear responsibility for final verification, confirmation, or rejection of AI-suggested schedule links. AI similarity scores serve as recommendations and do not supersede certified planner authority.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Schedule Baseline Integrity</h2>
          <p>
            OnGround preserves the contractual baseline schedule as an immutable standard. Physical actuals link to baseline nodes without mutating original contractual durations, logic ties, or milestones.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>5. Limitation of Liability</h2>
          <p>
            OnGround is an operational progress tracking tool. Contractual delay claims, extension-of-time (EOT) applications, and financial settlements remain the sole responsibility of the contracting parties and project authorities.
          </p>
        </section>
      </div>
    </div>
  );
};
