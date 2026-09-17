import React from 'react';

export const CookiesPage: React.FC = () => {
  return (
    <div className="section-container" style={{ maxWidth: '840px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
      <div className="section-header" style={{ textAlign: 'left', marginBottom: '32px' }}>
        <div className="section-tag">Cookie Preferences</div>
        <h1 className="section-title">Cookie Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Last updated: September 17, 2026</p>
      </div>

      <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. What Are Cookies</h2>
          <p>
            Cookies and local browser storage are small data files stored on your device that enable the OnGround web interface to recognize your session and persist operational preferences.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. How We Use Cookies & Local Storage</h2>
          <p>
            OnGround uses local browser storage strictly for essential system functionality:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
            <li><strong>Session Authentication:</strong> Remembering logged-in state and active session credentials.</li>
            <li><strong>Demo Role Selection:</strong> Remembering your active role switcher choice (Planner vs Site Supervisor).</li>
            <li><strong>Mock Prototype State:</strong> Preserving in-progress project reports, confirmed links, and newly added team members across page reloads during evaluation.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. No Third-Party Tracking</h2>
          <p>
            OnGround does not deploy third-party advertising cookies or behavioral tracking beacons.
          </p>
        </section>
      </div>
    </div>
  );
};
