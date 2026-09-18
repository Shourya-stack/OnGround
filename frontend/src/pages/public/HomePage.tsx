import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileText,
  Cpu,
  GitCompare,
  CheckCircle2,
  Layers,
  History,
  FileSpreadsheet,
  Clock,
  Check,
  BarChart3,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Hero14 } from '../../components/hero/Hero14';
import './HomePage.css';

export const HomePage: React.FC = () => {
  // Interactive reconciliation showcase state
  const [matchStatus, setMatchStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');

  // Interactive role selector state
  const [activeRole, setActiveRole] = useState<'planners' | 'supervisors' | 'managers' | 'auditors'>('planners');

  const roleData = {
    planners: {
      tagline: 'Primavera P6 Governance',
      title: 'Project Planners',
      description:
        'Review AI-suggested semantic links, disambiguate low-confidence candidates, and link verified daily progress to master WBS codes without hours of manual cross-referencing.',
      benefits: [
        'Automated semantic matching against baseline activities',
        '1-click Confirm, Reject, or Reassign controls',
        'Direct alignment with Primavera P6 work breakdown structures',
        'Eliminate tedious copy-pasting from contractor spreadsheets',
      ],
      previewCode: 'PIP-201',
      previewDesc: 'Piping spool fabrication & fit-up for 12-inch cooling line',
      previewConfidence: '94.0% High',
    },
    supervisors: {
      tagline: 'Native Reporting in the Field',
      title: 'Site Supervisors',
      description:
        'Upload progress reports and daily shift logs in native formats (PDF, Excel, CSV, or text) without learning complex scheduling tools or altering established field routines.',
      benefits: [
        'Zero rigid forms — upload native site diaries directly',
        'Automatic extraction of activity, discipline, location & hours',
        'Immediate feedback on unparsed or ambiguous text',
        'Continuous synchronization with head-office project schedule',
      ],
      previewCode: 'DPR-0914',
      previewDesc: 'Area 4 Substation cable tray installation & grounding check',
      previewConfidence: 'Ingested • 3 Activities',
    },
    managers: {
      tagline: 'Cross-Discipline Portfolio Visibility',
      title: 'Project Managers & Executives',
      description:
        'Monitor portfolio-wide reconciliation velocity across Civil, Piping, Electrical, and Instrumentation packages with real-time health indicators and discipline bottleneck detection.',
      benefits: [
        'Unified dashboard across all EPC contracting packages',
        'Early detection of unlinked activities and reporting blindspots',
        'Reconciliation completion metrics by discipline',
        'Objective, data-backed actuals for stakeholder reporting',
      ],
      previewCode: 'PKG-03',
      previewDesc: 'Western Refinery Expansion — 92% Reconciled',
      previewConfidence: '21 Baseline Tasks',
    },
    auditors: {
      tagline: 'Immutable Traceability',
      title: 'Quality & Audit Officers',
      description:
        'Verify complete provenance for every confirmed schedule actual with an append-only, tamper-evident audit trail capturing actor ID, timestamp, confidence score, and rationale.',
      benefits: [
        'Append-only database log of every system decision',
        'Full contextual diff of previous vs updated match state',
        'Actor identification linked directly to authenticated profiles',
        'Complete defensibility during claim and dispute reviews',
      ],
      previewCode: 'AUD-8821',
      previewDesc: 'CONFIRM_MATCH event logged with authenticated planner ID',
      previewConfidence: 'Tamper-Evident',
    },
  };

  const currentRole = roleData[activeRole];

  return (
    <div className="landing-page">
      {/* =========================================================================
          1. HERO SECTION (Untouched Hero14 Visual Reference Implementation)
          ========================================================================= */}
      <Hero14 />

      {/* =========================================================================
          2. PROBLEM / VALUE TRANSITION SECTION
          ========================================================================= */}
      <section className="landing-section" style={{ background: 'linear-gradient(180deg, #020617 0%, #060b19 100%)' }}>
        <div className="landing-container">
          <div className="landing-header">
            <div className="landing-tag">Operational Challenge</div>
            <h2 className="landing-title">
              Managing infrastructure progress
              <span className="landing-title-italic">shouldn't mean running spreadsheets.</span>
            </h2>
            <p className="landing-subtitle">
              EPC megaprojects lose critical momentum when field execution is trapped in disparate formats,
              unverified assumptions, and slow manual reconciliation cycles.
            </p>
          </div>

          <div className="problem-grid">
            {/* Problem 1 */}
            <div className="problem-card">
              <div className="problem-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="problem-card-title">Fragmented Field Formats</h3>
              <p className="problem-card-desc">
                Supervisors submit progress via scanned daily logs, vendor spreadsheets, and handwritten notes with non-standard naming conventions across subcontractors.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="problem-card">
              <div className="problem-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Clock size={20} />
              </div>
              <h3 className="problem-card-title">Multi-Day Schedule Lag</h3>
              <p className="problem-card-desc">
                Manual review creates persistent delays between when work is physically executed in the field and when actuals are reflected in master Primavera P6 plans.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="problem-card">
              <div className="problem-icon-wrapper" style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                <GitCompare size={20} />
              </div>
              <h3 className="problem-card-title">Manual Matching Overhead</h3>
              <p className="problem-card-desc">
                Planners spend extensive hours cross-referencing hundreds of disparate activities against thousands of WBS codes instead of performing strategic critical path analysis.
              </p>
            </div>

            {/* Problem 4 */}
            <div className="problem-card">
              <div className="problem-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                <AlertCircle size={20} />
              </div>
              <h3 className="problem-card-title">Unverifiable Decision History</h3>
              <p className="problem-card-desc">
                When schedule adjustments occur manually, teams lack an immutable audit record explaining who authorized the link, when, and against which engineering specification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CORE FEATURES (Editorial Bento Grid Layout)
          ========================================================================= */}
      <section className="landing-section" style={{ background: '#040816' }}>
        <div className="landing-container">
          <div className="landing-header">
            <div className="landing-tag">Core Platform Capabilities</div>
            <h2 className="landing-title">
              Engineered for the Field-to-Schedule Lifecycle
              <span className="landing-title-italic">From raw site diary to verified baseline link.</span>
            </h2>
            <p className="landing-subtitle">
              OnGround replaces manual cross-referencing with deterministic AI extraction, semantic vector matching,
              and strict planner governance.
            </p>
          </div>

          <div className="bento-grid">
            {/* BENTO CARD 1: Semantic Matching Engine (Large 2 Columns) */}
            <div className="bento-card bento-card-large">
              <div className="bento-header">
                <div className="bento-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <Cpu size={22} />
                </div>
                <span className="bento-pill" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  AI Matching Engine
                </span>
              </div>
              <h3 className="bento-title">Semantic Vector Schedule Matching</h3>
              <p className="bento-desc">
                Transforms unstructured daily text into dense semantic vector representations. Matches activities against Primavera P6 master schedules using contextual embeddings, discipline alignment, and confidence scoring bands.
              </p>

              {/* Micro-UI Preview: Live Confidence Gauge */}
              <div className="micro-ui-preview">
                <div className="micro-match-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>PIP-201</span>
                    <span style={{ color: '#ffffff' }}>12" CS cooling water line spool fit-up</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    94.0% High Match
                  </span>
                </div>
                <div className="micro-match-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>ELE-301</span>
                    <span style={{ color: '#ffffff' }}>33kV cable pulling between substation & compressor</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontWeight: 600, background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    89.5% High Match
                  </span>
                </div>
              </div>
            </div>

            {/* BENTO CARD 2: Multi-Format Ingestion */}
            <div className="bento-card">
              <div className="bento-header">
                <div className="bento-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <FileText size={22} />
                </div>
                <span className="bento-pill" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  Universal Ingestion
                </span>
              </div>
              <h3 className="bento-title">Multi-Format Extraction</h3>
              <p className="bento-desc">
                Ingests PDF reports, Excel workbooks, CSV tables, and plain text notes. Extracts physical descriptions, disciplines, dates, and locations deterministically.
              </p>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>.PDF Reports</span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>.XLSX Logs</span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>.CSV Tables</span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Site Text</span>
              </div>
            </div>

            {/* BENTO CARD 3: Human Verification Gates */}
            <div className="bento-card">
              <div className="bento-header">
                <div className="bento-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <CheckCircle2 size={22} />
                </div>
                <span className="bento-pill" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  Human Authority
                </span>
              </div>
              <h3 className="bento-title">Human Verification Gates</h3>
              <p className="bento-desc">
                AI suggests semantic candidates, but certified Project Planners maintain final authority. 1-click Confirm, Reject, or Reassign controls prevent unverified schedule corruption.
              </p>
              <div style={{ marginTop: 'auto', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '12.5px', color: '#fcd34d' }}>
                Role-gated: Only Planners can confirm baseline links.
              </div>
            </div>

            {/* BENTO CARD 4: Immutable Audit Trail */}
            <div className="bento-card">
              <div className="bento-header">
                <div className="bento-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                  <History size={22} />
                </div>
                <span className="bento-pill" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  System Memory
                </span>
              </div>
              <h3 className="bento-title">Append-Only Audit Trail</h3>
              <p className="bento-desc">
                Every file upload, extraction result, planner confirmation, rejection, and reassignment is recorded chronologically with actor ID, timestamp, and verification rationale.
              </p>
              <div style={{ marginTop: 'auto', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '12.5px', color: '#c7d2fe' }}>
                Complete traceability for dispute & claims defense.
              </div>
            </div>

            {/* BENTO CARD 5: Discipline & Portfolio Visibility (Large 2 Columns) */}
            <div className="bento-card bento-card-large">
              <div className="bento-header">
                <div className="bento-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                  <BarChart3 size={22} />
                </div>
                <span className="bento-pill" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  Multi-Discipline
                </span>
              </div>
              <h3 className="bento-title">Unified Multi-Discipline Tracking</h3>
              <p className="bento-desc">
                Consolidates physical actuals across Civil foundations, Piping spools, Electrical feeds, Instrumentation loops, and Equipment erection packages into one authoritative progress intelligence layer.
              </p>
              <div className="micro-ui-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>CIVIL</div>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Excavation & Rebar</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#c084fc', fontWeight: 600 }}>PIPING</div>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Spools & Welding</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(250, 204, 21, 0.1)', borderRadius: '6px', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#facc15', fontWeight: 600 }}>ELECTRICAL</div>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Cables & Substation</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '6px', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: 600 }}>INSTRUMENT</div>
                  <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>Loops & Calibration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PRODUCT SHOWCASE — High-Fidelity Interactive Workspace Section
          ========================================================================= */}
      <section className="landing-section" style={{ background: 'linear-gradient(180deg, #040816 0%, #060b19 100%)' }}>
        <div className="landing-container">
          <div className="landing-header">
            <div className="landing-tag">Interactive Workspace Showcase</div>
            <h2 className="landing-title">
              Everything happening on the ground,
              <span className="landing-title-italic">reconciled in one place.</span>
            </h2>
            <p className="landing-subtitle">
              Experience the actual OnGround reconciliation interface: link unstructured contractor notes
              to master Primavera P6 schedules with AI assistance and certified human sign-off.
            </p>
          </div>

          <div className="showcase-wrapper">
            {/* Showcase App Chrome / Header */}
            <div className="showcase-chrome">
              <div className="showcase-dots">
                <div className="showcase-dot" style={{ backgroundColor: '#ef4444' }} />
                <div className="showcase-dot" style={{ backgroundColor: '#f59e0b' }} />
                <div className="showcase-dot" style={{ backgroundColor: '#10b981' }} />
                <div className="showcase-breadcrumb" style={{ marginLeft: '12px' }}>
                  <Layers size={14} style={{ color: '#38bdf8' }} />
                  <span>OnGround Workspace</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>/</span>
                  <span style={{ color: '#ffffff' }}>Western Refinery Expansion (Package 3)</span>
                </div>
              </div>
              <div className="showcase-pills">
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
                  21 Baseline Tasks Loaded
                </span>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                  Active P6 Connection
                </span>
              </div>
            </div>

            {/* Showcase Main Viewport */}
            <div className="showcase-body">
              {/* Left Pane: Ingested Field Report Activity */}
              <div className="showcase-box">
                <div className="showcase-box-header" style={{ color: '#38bdf8' }}>
                  1. Ingested Daily Field Report
                </div>
                <div style={{ background: 'rgba(2, 6, 23, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                    Source: DPR_Package3_ShiftA.pdf • Extracted at 08:30 UTC
                  </div>
                  <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 600, lineHeight: 1.4 }}>
                    "Fit-up and root pass welding of 12-inch CS cooling water line, Unit 200 Area B (08:00 to 14:30)."
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderRadius: '4px', fontWeight: 600 }}>
                      Discipline: Piping
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.7)', borderRadius: '4px' }}>
                      Location: Unit 200 Area B
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px' }}>
                      Confidence: 0.95
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#38bdf8' }} />
                  <span>Embeddings matched against 21 candidate baseline schedule elements.</span>
                </div>
              </div>

              {/* Right Pane: Semantic Match Candidate & Human Authority Bar */}
              <div className="showcase-box" style={{ borderColor: 'rgba(56, 189, 248, 0.25)', background: 'rgba(15, 23, 42, 0.85)' }}>
                <div className="showcase-box-header" style={{ color: '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                  <span>2. Primavera P6 Baseline Match</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>94.0% Similarity</span>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
                      PIP-201
                    </span>
                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      High Match Band
                    </span>
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#ffffff', fontWeight: 600 }}>
                    Piping spool fabrication & fit-up for 12-inch cooling line
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '8px' }}>
                    WBS: 1.4.2.1 Cooling Water System • Discipline: Piping (Exact Match)
                  </div>
                </div>

                {/* Planner Interactive Action Bar */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', fontWeight: 500 }}>
                    Planner Decision Gate:
                  </div>

                  {matchStatus === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setMatchStatus('confirmed')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          background: '#f4f4f5',
                          color: '#090d16',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Check size={16} /> Confirm Match
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatchStatus('rejected')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {matchStatus === 'confirmed' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                        <CheckCircle2 size={18} />
                        <span>Match Confirmed & Linked to P6 Baseline</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMatchStatus('pending')}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {matchStatus === 'rejected' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>
                        <AlertCircle size={18} />
                        <span>Match Rejected → Moved to Unmatched Pool</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMatchStatus('pending')}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW ONGROUND WORKS (Linear 5-Step Pipeline)
          ========================================================================= */}
      <section className="landing-section" style={{ background: '#020617' }}>
        <div className="landing-container">
          <div className="landing-header">
            <div className="landing-tag">Process Architecture</div>
            <h2 className="landing-title">
              From Field Diary to Schedule Baseline
              <span className="landing-title-italic">in five governed stages.</span>
            </h2>
            <p className="landing-subtitle">
              A transparent, auditable pipeline that turns unstructured field reports into verified schedule actuals.
            </p>
          </div>

          <div className="workflow-track">
            {/* Step 1 */}
            <div className="workflow-card">
              <div className="workflow-step-num">STAGE 01</div>
              <h4 className="workflow-card-title">Upload</h4>
              <p className="workflow-card-desc">
                Ingest PDF site reports, Excel shift spreadsheets, or contractor raw text.
              </p>
            </div>

            {/* Step 2 */}
            <div className="workflow-card">
              <div className="workflow-step-num">STAGE 02</div>
              <h4 className="workflow-card-title">Extract</h4>
              <p className="workflow-card-desc">
                AI parses individual activities, identifying discipline, location, and hours.
              </p>
            </div>

            {/* Step 3 */}
            <div className="workflow-card">
              <div className="workflow-step-num">STAGE 03</div>
              <h4 className="workflow-card-title">Match</h4>
              <p className="workflow-card-desc">
                Vector embeddings calculate semantic similarity against master P6 schedule activities.
              </p>
            </div>

            {/* Step 4 */}
            <div className="workflow-card">
              <div className="workflow-step-num">STAGE 04</div>
              <h4 className="workflow-card-title">Review</h4>
              <p className="workflow-card-desc">
                Planners inspect suggestions with confidence banding to confirm or reassign links.
              </p>
            </div>

            {/* Step 5 */}
            <div className="workflow-card">
              <div className="workflow-step-num">STAGE 05</div>
              <h4 className="workflow-card-title">Audit</h4>
              <p className="workflow-card-desc">
                Immutable event record committed to system memory with actor ID and reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. ROLE-BASED EXPERIENCE
          ========================================================================= */}
      <section className="landing-section" style={{ background: 'linear-gradient(180deg, #020617 0%, #050b18 100%)' }}>
        <div className="landing-container">
          <div className="landing-header">
            <div className="landing-tag">Stakeholder Governance</div>
            <h2 className="landing-title">
              One platform.
              <span className="landing-title-italic">Every megaproject stakeholder.</span>
            </h2>
            <p className="landing-subtitle">
              Purpose-built capabilities tailored to the specific responsibilities of site supervision,
              planning governance, and executive oversight.
            </p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'planners' ? 'active' : ''}`}
              onClick={() => setActiveRole('planners')}
            >
              Project Planners
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'supervisors' ? 'active' : ''}`}
              onClick={() => setActiveRole('supervisors')}
            >
              Site Supervisors
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'managers' ? 'active' : ''}`}
              onClick={() => setActiveRole('managers')}
            >
              Project Managers
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'auditors' ? 'active' : ''}`}
              onClick={() => setActiveRole('auditors')}
            >
              Quality & Audit Officers
            </button>
          </div>

          {/* Active Role Showcase Card */}
          <div className="role-display-card">
            <div>
              <div className="role-tagline">{currentRole.tagline}</div>
              <h3 className="role-heading">{currentRole.title}</h3>
              <p className="role-description">{currentRole.description}</p>
              <div className="role-benefits-list">
                {currentRole.benefits.map((benefit) => (
                  <div key={benefit} className="role-benefit-item">
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Context Preview Box */}
            <div style={{ background: 'rgba(2, 6, 23, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Role Preview Context
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                {currentRole.previewCode}
              </div>
              <div style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, marginBottom: '16px' }}>
                {currentRole.previewDesc}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Validation Status</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  {currentRole.previewConfidence}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FINAL CTA SECTION (Hero14 Matching Aesthetic)
          ========================================================================= */}
      <section className="final-cta-section">
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <h2 className="final-cta-title">
            Reconcile field actuals.
            <span className="final-cta-title-italic">Not spreadsheets.</span>
          </h2>
          <p className="final-cta-subtitle">
            Eliminate progress reconciliation data lag, automate contractor report parsing,
            and maintain complete planner authority over your master Primavera P6 schedule.
          </p>
          <div className="final-cta-buttons">
            <Link to="/signup" className="hero14-btn-primary">
              <span>Get Started with OnGround</span>
              <ArrowRight size={15} className="hero14-arrow-icon" strokeWidth={2.2} />
            </Link>
            <Link to="/dashboard" className="hero14-btn-secondary">
              <span>Explore Demo Workspace</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
