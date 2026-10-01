import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Info } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Free / Trial',
      badge: 'EVALUATION',
      price: 'Demo Tier',
      period: 'Phase 1 Prototype Access',
      description: 'Ideal for evaluating report extraction, semantic schedule linking, and human review workflows.',
      features: [
        'Single active EPC demo project',
        'Multi-format ingestion (PDF, CSV, XLSX, TXT)',
        'AI structured activity extraction',
        'Semantic schedule matching with confidence bands',
        'Candidate disambiguation panel',
        'Full immutable audit logging',
      ],
      ctaText: 'Get Started with Trial',
      ctaLink: '/signup',
      highlighted: false,
    },
    {
      name: 'Professional',
      badge: 'MOST POPULAR',
      price: 'Team Tier',
      period: 'For Active Infrastructure Sites',
      description: 'Designed for project delivery teams requiring multi-package progress reconciliation.',
      features: [
        'Multiple active project workspaces',
        'Unlimited daily site report ingestion',
        'Full Primavera P6 schedule baseline import',
        'Planner vs Site Supervisor role-based access control',
        'Batch reconciliation confirmation workflows',
        'Detailed discipline analytics & trends',
        'Real-time team collaboration',
      ],
      ctaText: 'Explore Pro Features',
      ctaLink: '/signup',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      badge: 'CUSTOM',
      price: 'Custom Tier',
      period: 'For EPC Contractors & Authorities',
      description: 'For large contractors and infrastructure owners managing enterprise-wide project portfolios.',
      features: [
        'Unlimited project portfolio workspaces',
        'Dedicated deployment options (Cloud / On-Premise)',
        'Custom baseline schedule schemas & WBS depth',
        'Role-governed multi-tiered approval workflows',
        'Historical project cross-querying & knowledge repository',
        'Dedicated onboarding and technical support',
      ],
      ctaText: 'Contact for Enterprise',
      ctaLink: '/contact',
      highlighted: false,
    },
  ];

  return (
    <div className="section-container">
      {/* Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: 'var(--accent-blue)',
          fontSize: '13px',
          maxWidth: '820px',
          margin: '0 auto 40px',
        }}
      >
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Billing notice:</strong> Subscription management and payment processing are not currently available. Pricing tiers are informational; access is managed through authenticated project roles.
        </span>
      </div>

      {/* Header */}
      <div className="section-header">
        <div className="section-tag">Flexible Deployment</div>
        <h1 className="section-title">Plans Scaled to Your Project Needs</h1>
        <p className="section-subtitle">
          Transparent, role-governed access to automated progress reconciliation and schedule alignment.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid-3" style={{ marginBottom: '80px', alignItems: 'stretch' }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="glass-card"
            style={{
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderColor: plan.highlighted ? 'var(--accent-blue)' : undefined,
              boxShadow: plan.highlighted ? '0 10px 40px rgba(56, 189, 248, 0.15)' : undefined,
            }}
          >
            {plan.highlighted && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-blue)',
                  color: 'var(--text-inverse)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                {plan.badge}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {plan.name}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, minHeight: '40px' }}>
                {plan.description}
              </p>
            </div>

            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {plan.price}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {plan.period}
              </div>
            </div>

            <div style={{ flex: 1, marginBottom: '32px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Included Capabilities
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Check size={16} style={{ color: 'var(--confidence-high)', marginTop: '2px', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to={plan.ctaLink}
              className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              {plan.ctaText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
