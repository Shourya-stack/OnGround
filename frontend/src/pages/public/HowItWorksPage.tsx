import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Cpu,
  Layers,
  GitCompare,
  CheckCheck,
  CheckCircle2,
  History,
  ArrowRight,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload Daily Site Reports',
      icon: UploadCloud,
      what: 'The user uploads daily logs, contractor spreadsheets, scanned PDFs, or plain text field entries via drag-and-drop.',
      why: 'Eliminates rigid, repetitive form filling for site personnel by allowing them to use existing reporting documentation.',
      sees: 'An intuitive dropzone with file format verification (PDF, XLSX, CSV, TXT), progress meters, and upload receipt status.',
    },
    {
      step: '02',
      title: 'Extract Structured Activities',
      icon: Cpu,
      what: 'AI parsing identifies distinct physical activities, labor descriptions, work quantities, and equipment usage from unstructured paragraphs.',
      why: 'Free-form text cannot be linked directly to structured WBS databases without first being broken down into discrete work items.',
      sees: 'Live extraction counts, parsed activity cards, and deterministic extraction confidence metrics.',
    },
    {
      step: '03',
      title: 'Understand Discipline & Context',
      icon: Layers,
      what: 'The system categorizes activities into engineering disciplines (Civil, Piping, Electrical, Instrumentation, HSE) and extracts dates and locations.',
      why: 'Discipline and location context narrows the matching search space and prevents cross-discipline false positive links.',
      sees: 'Color-coded discipline tags, location tags (e.g., "Substation 3", "Unit 200"), and verified execution timestamps.',
    },
    {
      step: '04',
      title: 'Semantic Schedule Matching',
      icon: GitCompare,
      what: 'Sentence-transformers vector embeddings compare extracted activity descriptions against planned Primavera P6 baseline tasks.',
      why: 'Field workers rarely use exact WBS wording; semantic similarity detects conceptual equivalences despite varied terminology.',
      sees: 'A side-by-side comparison table showing field text vs planned baseline task, with similarity percentage and confidence band.',
    },
    {
      step: '05',
      title: 'Human Review for Ambiguities',
      icon: CheckCheck,
      what: 'Activities with confidence scores in the review band (0.70 - 0.84) or close alternative candidates are flagged for human inspection.',
      why: 'AI should advise rather than silently make uncertain project management decisions on high-value infrastructure assets.',
      sees: 'Disambiguation panels presenting the top AI candidate alongside ranked alternative tasks and relative similarity margins.',
    },
    {
      step: '06',
      title: 'Confirm & Link Progress',
      icon: CheckCircle2,
      what: 'Project planners verify and approve the link, officially attaching the daily physical progress to the baseline schedule item.',
      why: 'Preserves data integrity and ensures that schedule actuals reflect verified, authorized site accomplishments.',
      sees: 'Confirmed badge status, physical progress update reflection, and updated reconciliation velocity counters.',
    },
    {
      step: '07',
      title: 'Immutable Audit Trail',
      icon: History,
      what: 'The system logs an append-only event recording the actor ID, match ID, baseline code, timestamp, and confidence score.',
      why: 'Provides institutional knowledge, contract dispute protection, and full traceability for client audits.',
      sees: 'Chronological timeline entries in the audit view with complete filterability by user, action type, and date.',
    },
  ];

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <div className="section-tag">System Architecture</div>
        <h1 className="section-title">How OnGround Works</h1>
        <p className="section-subtitle">
          A step-by-step walkthrough of how daily site reports are parsed, semantically linked, and verified into master schedules.
        </p>
      </div>

      {/* Steps List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto 80px' }}>
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="glass-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '24px',
                padding: '32px',
                alignItems: 'flex-start',
              }}
            >
              {/* Step indicator */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}
                >
                  <Icon size={26} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                  STEP {s.step}
                </div>
              </div>

              {/* Step Content */}
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  {s.title}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', display: 'block', marginBottom: '2px' }}>
                      What Happens
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.what}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--confidence-high)', display: 'block', marginBottom: '2px' }}>
                      Why It Matters
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.why}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--confidence-review)', display: 'block', marginBottom: '2px' }}>
                      What You See
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.sees}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '12px' }}>
          See the Reconciliation Workflow
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Experience how planners review and confirm semantic matches in the OnGround workspace.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Try the Pipeline Now <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};
