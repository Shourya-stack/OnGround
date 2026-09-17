import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CalendarRange,
  GitCompare,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const featureGroups = [
    {
      icon: FileText,
      tag: 'INGESTION ENGINE',
      title: 'Report Intelligence',
      description: 'Convert diverse, messy site reporting formats into standardized, machine-readable progress items.',
      color: 'var(--accent-blue)',
      features: [
        { name: 'Multi-Format Ingestion', desc: 'Accepts PDF site reports, Excel sheets, CSV logs, and plain text diaries.' },
        { name: 'AI Activity Extraction', desc: 'Identifies specific work items, physical tasks, and labor descriptions automatically.' },
        { name: 'Structured Activity Schema', desc: 'Extracts discipline, timestamps, location references, and deterministic confidence scores.' },
      ],
    },
    {
      icon: CalendarRange,
      tag: 'MASTER SCHEDULE',
      title: 'Schedule Intelligence',
      description: 'Seamlessly align site work with master Primavera P6 WBS hierarchies.',
      color: 'var(--accent-indigo)',
      features: [
        { name: 'Schedule Import', desc: 'Import Primavera P6 CSV and XML schedules to establish master baseline activities.' },
        { name: 'WBS Activity Identification', desc: 'Hierarchical activity code mapping across Civil, Piping, Electrical, Instrumentation, and Equipment.' },
        { name: 'Semantic Embeddings', desc: 'Sentence-transformers vector embeddings compare physical descriptions against planned baseline titles.' },
      ],
    },
    {
      icon: GitCompare,
      tag: 'CORE ENGINE',
      title: 'Progress Reconciliation',
      description: 'Intelligent triage banding with human-in-the-loop verification gates.',
      color: 'var(--confidence-high)',
      features: [
        { name: '3-Tier Confidence Banding', desc: 'Automatic categorization into Matched (High), Needs Review (Medium), and Unmatched (Low).' },
        { name: 'Candidate Disambiguation', desc: 'Shows alternative matching candidates with relative similarity scores for ambiguous tasks.' },
        { name: 'Planner Confirmation Gates', desc: 'One-click confirmation, rejection, or reassignment governed by role permissions.' },
      ],
    },
    {
      icon: Users,
      tag: 'GOVERNANCE',
      title: 'Collaboration & Governance',
      description: 'Cross-functional transparency between site supervisors, planners, and project managers.',
      color: 'var(--confidence-review)',
      features: [
        { name: 'Role-Based Access Control', desc: 'Distinct permissions for Site Supervisors (upload) and Project Planners (confirm/reject).' },
        { name: 'Realtime Data Sync', desc: 'Live event updates across all connected team sessions as reports are processed.' },
        { name: 'Append-Only Audit Trail', desc: 'Immutable history recording actor, action, timestamp, and confidence for every schedule link.' },
      ],
    },
    {
      icon: BarChart3,
      tag: 'EXECUTIVE METRICS',
      title: 'Project Analytics',
      description: 'Clear visual tracking of reporting health, match distribution, and discipline velocity.',
      color: '#ec4899',
      features: [
        { name: 'Match Rate Tracking', desc: 'Monitor the proportion of site activities automatically resolved versus requiring human review.' },
        { name: 'Discipline Velocity', desc: 'Breakdown of progress reporting across Piping, Electrical, Civil, and Mechanical systems.' },
        { name: 'Unmatched Activity Queue', desc: 'Track unresolved site activities and identify scope additions or unregistered progress.' },
      ],
    },
  ];

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <div className="section-tag">Feature Specifications</div>
        <h1 className="section-title">Comprehensive Progress Reconciliation Capabilities</h1>
        <p className="section-subtitle">
          Explore the purpose-built modules designed to connect contractor daily reports with master EPC schedules.
        </p>
      </div>

      {/* Feature Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', marginBottom: '80px' }}>
        {featureGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="glass-card"
              style={{ padding: '36px', borderLeft: `4px solid ${group.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    color: group.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: group.color }}>
                    {group.tag}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {group.title}
                  </h2>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', maxWidth: '720px' }}>
                {group.description}
              </p>

              <div className="grid-3">
                {group.features.map((feat) => (
                  <div
                    key={feat.name}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      padding: '18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: group.color }} />
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {feat.name}
                      </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px' }}>
          Explore OnGround in Action
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '540px', margin: '0 auto 24px' }}>
          Test the interactive reconciliation table and schedule linking flow on realistic sample project data.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Get Started Free <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
