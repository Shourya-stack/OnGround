import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="section-container" style={{ maxWidth: '840px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '32px' }}>
        <div className="section-tag">Legal & Compliance</div>
        <h1 className="section-title">Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Last updated: September 17, 2026</p>
      </div>

      <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Overview</h2>
          <p>
            OnGround Technologies Inc. (&quot;OnGround&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides this Privacy Policy to explain how we handle information in connection with our Infrastructure Progress Intelligence System.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Information Processed</h2>
          <p>
            When project teams utilize OnGround, we process site progress documents uploaded by users (PDF, XLSX, CSV, TXT), master baseline schedule files, extracted activity metadata, and user activity records for the purpose of schedule linking and progress reconciliation.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Project Data Isolation</h2>
          <p>
            Project files, baseline schedule trees, and daily progress logs are segmented by organization and project workspace. Project progress records are processed solely to generate structured extraction records and semantic schedule links.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Audit Log Persistence</h2>
          <p>
            In accordance with contractual construction governance standards, all schedule linking confirmations, rejections, and manual overrides are recorded in an append-only audit trail with the actor identity and timestamp.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>5. Contact</h2>
          <p>
            For inquiries regarding project data privacy or technical security disclosures, please contact privacy@onground.engineering.
          </p>
        </section>
      </div>
    </div>
  );
};
