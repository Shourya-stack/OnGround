import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Cpu,
  GitCompare,
  CheckCircle2,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  Users,
  History,
  FileSpreadsheet,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  // Interactive demo preview state
  const [demoConfirmed, setDemoConfirmed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '96px 24px 80px',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), rgba(10, 14, 23, 0))',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', marginBottom: '24px' }}>
            <div className="hero-glow-badge">
              <Sparkles size={14} />
              <span>Infrastructure Progress Intelligence System</span>
            </div>
          </div>

          {/* Primary Message */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#ffffff',
              maxWidth: '960px',
              margin: '0 auto 24px',
            }}
          >
            Turn Daily Site Reports Into{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Actionable Project Data
            </span>
          </h1>

          {/* Supporting Message */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              maxWidth: '780px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            Ingest unstructured site reports, extract physical progress activities with AI,
            semantically reconcile tasks with Primavera P6 baseline schedules, and empower planners
            with clear human review for uncertain matches.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>

          {/* Live Interactive Product Preview Card */}
          <div
            className="glass-card"
            style={{
              maxWidth: '980px',
              margin: '0 auto',
              textAlign: 'left',
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.1)',
            }}
          >
            {/* Header / Simulated Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '12px' }}>
                  Live Reconciliation Engine • Line 247 EPC Package
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="confidence-badge high">Semantic Embeddings</span>
                <span className="confidence-badge high" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  Human In The Loop
                </span>
              </div>
            </div>

            {/* Reconciliation Demonstration Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto',
                gap: '16px',
                alignItems: 'center',
                padding: '20px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Daily Report Activity */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '4px' }}>
                  Daily Site Report (Field Text)
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                  "Fit-up and root pass welding of 12-inch CS cooling water line in Area B"
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Discipline: Piping • Source: DPR_Package3.pdf
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
                <ChevronRight size={24} />
              </div>

              {/* Baseline Schedule Activity */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--confidence-high)', marginBottom: '4px' }}>
                  Primavera P6 Baseline Match
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>PIP-201</span>
                  <span>Piping spool fabrication & fit-up for 12-inch cooling line</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <span className="confidence-badge high">Similarity: 94.0%</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confidence: High</span>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {demoConfirmed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--confidence-high)', fontWeight: 600, fontSize: '13px' }}>
                      <CheckCircle2 size={18} />
                      <span>Linked to P6</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => setDemoConfirmed(false)}
                      title="Reset interactive preview"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setDemoConfirmed(true)}
                  >
                    Confirm Match
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="section-container" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-header">
          <div className="section-tag">Industry Challenge</div>
          <h2 className="section-title">The Field-to-Schedule Information Disconnect</h2>
          <p className="section-subtitle">
            Infrastructure projects lose critical momentum when progress tracking relies on manual consolidation across multiple site disciplines.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileSpreadsheet size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Fragmented Field Formats
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Supervisors submit progress via scanned daily logs, handwritten diaries, vendor spreadsheets, and informal notes with non-standard naming conventions.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <History size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Delayed Progress Recognition
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Manual review creates multi-day lags between when work is completed in the field and when actuals are reflected in the master Primavera P6 schedule.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <GitCompare size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              High Manual Reconciliation Overhead
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Planners spend extensive hours cross-referencing hundreds of disparate activities against thousands of WBS codes instead of performing strategic analysis.
            </p>
          </div>
        </div>
      </section>

      {/* 3. THE SOLUTION */}
      <section className="section-container" style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-header">
          <div className="section-tag">The Solution</div>
          <h2 className="section-title">Automated Progress Reconciliation</h2>
          <p className="section-subtitle">
            OnGround links unstructured contractor logs directly to baseline schedule activities with semantic AI and planner-governed verification gates.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--confidence-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Multi-Format Ingestion
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Accepts PDF reports, CSV tables, Excel logs, and raw field text. Automatically extracts activity descriptions, disciplines, dates, and locations.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Semantic Schedule Matching
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Transforms report text and schedule activities into semantic vector representations to identify conceptual matches despite phrasing variations.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Human Verification Gates
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Clear confidence banding separates confident matches from uncertain candidates. Planners maintain complete control to confirm, reject, or disambiguate.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 7-STEP WORKFLOW */}
      <section className="section-container" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-header">
          <div className="section-tag">Workflow</div>
          <h2 className="section-title">From Site Diary to Schedule Link in 7 Steps</h2>
          <p className="section-subtitle">
            An end-to-end governed pipeline that preserves auditability from the initial field upload to final confirmation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          {[
            { step: '01', title: 'Upload', desc: 'Ingest PDF, Excel, or text site report' },
            { step: '02', title: 'Extract', desc: 'AI structures activities & metadata' },
            { step: '03', title: 'Understand', desc: 'Categorize discipline, date & location' },
            { step: '04', title: 'Match', desc: 'Semantic comparison against P6 schedule' },
            { step: '05', title: 'Review', desc: 'Planner inspects ambiguous candidates' },
            { step: '06', title: 'Confirm', desc: 'Verify and link progress to baseline' },
            { step: '07', title: 'Audit', desc: 'Record immutable event with full context' },
          ].map((item) => (
            <div
              key={item.step}
              className="glass-card"
              style={{ padding: '20px 16px', textAlign: 'center', position: 'relative' }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--accent-blue)',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                STEP {item.step}
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. USE CASES */}
      <section className="section-container" style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="section-header">
          <div className="section-tag">Target Personas</div>
          <h2 className="section-title">Built For Infrastructure Project Stakeholders</h2>
          <p className="section-subtitle">
            Tailored capabilities for every role involved in site execution, scheduling, and project governance.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Project Planners</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
              Review semantic link suggestions, resolve candidate ambiguities, and link daily field activities to Primavera P6 baseline WBS elements without manual entry.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600 }}>
              Key Benefit: Focus on critical path analysis instead of manual data entry.
            </div>
          </div>

          <div className="glass-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--confidence-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Check size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Site Supervisors</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
              Upload existing progress reports and site diaries in native formats without altering field reporting routines or learning complex scheduling software.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--confidence-high)', fontWeight: 600 }}>
              Key Benefit: Upload daily logs in native formats with zero rigid forms.
            </div>
          </div>

          <div className="glass-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--confidence-review)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Layers size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Project Managers</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
              Track portfolio progress across EPC packages, monitor reconciliation health, identify discipline bottlenecks, and review verified audit trails.
            </p>
            <div style={{ fontSize: '13px', color: 'var(--confidence-review)', fontWeight: 600 }}>
              Key Benefit: Unified visibility across all engineering disciplines.
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECURITY & GOVERNANCE */}
      <section className="section-container" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="section-header">
          <div className="section-tag">Governance & Trust</div>
          <h2 className="section-title">Engineered With Human Governance at the Core</h2>
          <p className="section-subtitle">
            AI assists with extraction and semantic suggestion, but human planners hold final authority over schedule baseline integrity.
          </p>
        </div>

        <div className="grid-2">
          <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Role-Based Permission Gates
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Site Supervisors submit daily logs, but only certified Project Planners can confirm, reject, or reassign schedule matches, preventing unauthorized changes.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--confidence-high)' }}>
              <History size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Append-Only Immutable Audit Trail
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Every extraction, automatic link, manual confirmation, rejection, and alternative assignment is recorded chronologically with actor ID, timestamp, and confidence score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section
        style={{
          padding: '80px 24px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(56, 189, 248, 0.12), rgba(10, 14, 23, 0))',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Ready to Modernize Site Progress Tracking?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
            Experience how automated extraction and semantic schedule reconciliation eliminate manual progress tracking bottlenecks.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started with OnGround <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              Explore Demo Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
