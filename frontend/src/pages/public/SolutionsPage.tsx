import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarRange,
  HardHat,
  Building2,
  GitMerge,
  ArrowRight,
} from 'lucide-react';

export const SolutionsPage: React.FC = () => {
  const solutions = [
    {
      title: 'Project Managers',
      role: 'Executive Portfolio Oversight',
      icon: Users,
      problem: 'Progress visibility lags field execution, leading to delayed discovery of critical path slippages and discipline bottlenecks.',
      workflow: 'Access real-time cross-discipline dashboards displaying verified daily progress, extraction velocity, and reconciliation health metrics.',
      benefit: 'Timely visibility into physical accomplishments across all packages without waiting for weekly manual reconciliation summaries.',
    },
    {
      title: 'Project Planners',
      role: 'Schedule Integrity & WBS Alignment',
      icon: CalendarRange,
      problem: 'Consolidating daily site logs from multiple contractors into Primavera P6 takes excessive manual effort and often introduces mapping errors.',
      workflow: 'Review semantic match suggestions with ranked candidate disambiguation, confirming or rejecting links with clear confidence indicators.',
      benefit: 'Eliminates repetitive data entry, focusing planner expertise on reviewing ambiguous items and managing master schedule critical paths.',
    },
    {
      title: 'Site Supervisors',
      role: 'Field Data Capture',
      icon: HardHat,
      problem: 'Supervisors must translate physical field progress into complex schedule software codes or fill out rigid, repetitive forms.',
      workflow: 'Submit daily work logs in native document formats (PDF, Excel, or text). OnGround automatically extracts structured tasks and locations.',
      benefit: 'Zero disruption to field reporting habits while ensuring site accomplishments are accurately captured and linked.',
    },
    {
      title: 'Construction Teams',
      role: 'Subcontractor Coordination',
      icon: Building2,
      problem: 'Misalignment between subcontractor daily reports and general contractor schedules leads to disputed billings and progress claims.',
      workflow: 'Every accepted progress claim is tied directly to source document excerpts and stored with immutable timestamps and confidence scores.',
      benefit: 'Clear historical traceability reduces progress disputes and creates a shared, auditable record of site completion.',
    },
    {
      title: 'Infrastructure & EPC Teams',
      role: 'Multi-Package Delivery',
      icon: GitMerge,
      problem: 'Large-scale projects generate massive volumes of siloed reporting data across Civil, Piping, Electrical, and Instrumentation packages.',
      workflow: 'Standardized ingestion and semantic categorization unify progress intelligence across diverse packages and contractors.',
      benefit: 'Unified progress tracking across disciplines with consistent governance and role-based confirmation boundaries.',
    },
  ];

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <div className="section-tag">Role-Based Solutions</div>
        <h1 className="section-title">Engineered for Every Construction Stakeholder</h1>
        <p className="section-subtitle">
          Discover how OnGround addresses specific operational bottlenecks across engineering disciplines and organizational roles.
        </p>
      </div>

      {/* Solutions Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '80px' }}>
        {solutions.map((sol) => {
          const Icon = sol.icon;
          return (
            <div
              key={sol.title}
              className="glass-card"
              style={{
                padding: '36px',
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '32px',
                alignItems: 'flex-start',
              }}
            >
              {/* Persona Info */}
              <div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <Icon size={24} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {sol.title}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {sol.role}
                </span>
              </div>

              {/* Problem -> Workflow -> Benefit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', display: 'block', marginBottom: '4px' }}>
                    The Problem
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {sol.problem}
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', display: 'block', marginBottom: '4px' }}>
                    OnGround Workflow
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {sol.workflow}
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--confidence-high)', display: 'block', marginBottom: '4px' }}>
                    Key Benefit
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                    {sol.benefit}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px' }}>
          Equip Your Project Team
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Connect daily site reports to master schedules with role-based confirmation gates.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Start Free Trial <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
