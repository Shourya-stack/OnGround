import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  CalendarRange,
  GitCompare,
  CheckCheck,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const docSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      content: (
        <div>
          <h2>Getting Started with OnGround</h2>
          <p>
            OnGround is an Infrastructure Progress Intelligence System (IPIS) designed to automate the translation of daily site progress reports into verified schedule updates aligned with Primavera P6.
          </p>
          <div style={{ margin: '24px 0', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
            <strong>Prerequisites:</strong> A Primavera P6 baseline schedule (CSV or XML export) and standard site progress logs in PDF, Excel, CSV, or raw text format.
          </div>
          <h3>Quick Start Workflow:</h3>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            <li>Navigate to <strong>Projects</strong> and select your active EPC project workspace.</li>
            <li>Verify that baseline schedule activities are loaded in <strong>Baseline Schedule WBS</strong>.</li>
            <li>Go to <strong>Daily Reports</strong> and click <strong>Upload Daily Log</strong>.</li>
            <li>Review the extracted tasks in the <strong>Processing Pipeline</strong>.</li>
            <li>Open the <strong>Reconciliation Table</strong> to confirm or reject candidate matches.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'how-it-works',
      title: 'How OnGround Works',
      icon: CheckCircle2,
      content: (
        <div>
          <h2>System Flow & Core Principles</h2>
          <p>
            OnGround uses a two-stage intelligence pipeline:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
            <li>
              <strong>Stage 1 — Parsing & Structuring:</strong> An LLM parser reads unstructured text and outputs structured records containing physical task descriptions, engineering disciplines, dates, times, and location tags.
            </li>
            <li>
              <strong>Stage 2 — Semantic Matching:</strong> Sentence-transformer vector embeddings compute cosine similarity between the extracted task and planned schedule tasks. A hybrid scoring function evaluates similarity, extraction confidence, and date alignment.
            </li>
          </ul>
          <p>
            Matches scoring above the high confidence threshold (0.85) are automatically linked. Scores between 0.70 and 0.84 enter the Human Review queue. Activities scoring below 0.70 are routed to the Unmatched pool for manual planner resolution.
          </p>
        </div>
      ),
    },
    {
      id: 'projects',
      title: 'Projects Portfolio',
      icon: FileText,
      content: (
        <div>
          <h2>Managing Project Workspaces</h2>
          <p>
            OnGround supports multiple active infrastructure packages within a single organization. Each project workspace maintains:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
            <li>Isolated master baseline schedule WBS activities.</li>
            <li>Dedicated daily report repository and ingestion log.</li>
            <li>Independent reconciliation table and review queues.</li>
            <li>Project-specific team rosters and role permission assignments.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'schedules',
      title: 'Schedules & WBS',
      icon: CalendarRange,
      content: (
        <div>
          <h2>Baseline Schedule Management</h2>
          <p>
            The baseline schedule defines the planned execution timeline. In OnGround, baseline schedule nodes are treated as immutable reference standards to preserve contractual integrity.
          </p>
          <div style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <code>WBS Hierarchy Format: Code (e.g. ELE-301), Description, Discipline, Planned Start, Planned End</code>
          </div>
          <p>
            Discipline tags include Civil, Piping, Electrical, Instrumentation, Static & Rotating Equipment, and HSE.
          </p>
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'Daily Reports & Upload',
      icon: FileText,
      content: (
        <div>
          <h2>Report Ingestion Guidelines</h2>
          <p>
            OnGround accepts multiple file formats without requiring format conversions:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
            <li><strong>PDF:</strong> Scanned or digital daily progress reports (up to 10MB).</li>
            <li><strong>XLSX / CSV:</strong> Contractor progress spreadsheets and quantity tracking logs.</li>
            <li><strong>TXT:</strong> Transcribed site diaries and field supervisor notes.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'reconciliation',
      title: 'Reconciliation Table',
      icon: GitCompare,
      content: (
        <div>
          <h2>Reconciliation Table Operations</h2>
          <p>
            The Reconciliation Table is the central workspace for project planners. It displays extracted daily tasks side-by-side with matched schedule tasks.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
            <li><strong>Auto-Linked:</strong> High confidence matches requiring minimal review.</li>
            <li><strong>Needs Review:</strong> Ambiguous matches requiring planner confirmation.</li>
            <li><strong>Disambiguation Panel:</strong> Expand any row to compare top alternative candidates and similarity scores.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Human Review & Disambiguation',
      icon: CheckCheck,
      content: (
        <div>
          <h2>Human-in-the-Loop Review</h2>
          <p>
            When multiple schedule tasks share similar descriptions (e.g., cable tray installation across Level 1 vs Level 2), the system flags the task for human disambiguation.
          </p>
          <p>
            Planners can confirm the primary suggestion, select any alternative candidate from the ranked list, or reject the match entirely to send it to the Unmatched pool.
          </p>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Analytics & Audit',
      icon: BarChart3,
      content: (
        <div>
          <h2>Progress Velocity & Immutable Audit Trail</h2>
          <p>
            Track reconciliation velocity over time, monitor match rate percentages, and review the immutable audit timeline. Every action is logged with actor name, timestamp, target activity code, and confidence metric.
          </p>
        </div>
      ),
    },
  ];

  const current = docSections.find((s) => s.id === activeSection) || docSections[0];

  return (
    <div className="section-container" style={{ maxWidth: '1200px' }}>
      <div className="section-header" style={{ textAlign: 'left', margin: '0 0 40px' }}>
        <div className="section-tag">Documentation & Guides</div>
        <h1 className="section-title">OnGround Technical Documentation</h1>
        <p className="section-subtitle" style={{ margin: 0 }}>
          Comprehensive architecture, ingestion instructions, and workflow references for OnGround IPIS.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px', alignItems: 'flex-start' }}>
        {/* Navigation Sidebar */}
        <div className="glass-card" style={{ padding: '16px', position: 'sticky', top: '96px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 12px', letterSpacing: '0.05em' }}>
            TABLE OF CONTENTS
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {docSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} />
                    <span>{sec.title}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Pane */}
        <div className="glass-card" style={{ padding: '40px', minHeight: '500px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {current.content}
        </div>
      </div>
    </div>
  );
};
