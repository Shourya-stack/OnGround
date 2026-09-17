import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What site report formats does OnGround support?',
      a: 'In Phase 1, OnGround supports PDF daily progress reports, Microsoft Excel (.xlsx) spreadsheets, Comma-Separated Values (.csv) tables, and plain text (.txt) files from transcribed site diaries. The parser automatically extracts task descriptions, disciplines, dates, times, and location references.',
    },
    {
      q: 'How does OnGround match daily reports with Primavera P6 schedules?',
      a: 'OnGround uses local vector embeddings via sentence-transformers (all-MiniLM-L6-v2) to compare extracted task descriptions against master baseline activity names. A hybrid scoring function considers semantic similarity, extraction confidence, and date alignment to determine the matching score.',
    },
    {
      q: 'What are the confidence bands and how do they work?',
      a: 'Matching scores are grouped into three distinct operational bands: High Confidence (>= 85%), which are auto-linked; Medium Confidence (70% - 84%), which require human planner review with candidate disambiguation; and Low Confidence (< 70%), which are routed to the Unmatched pool for manual investigation.',
    },
    {
      q: 'Can site supervisors alter or overwrite master baseline schedules?',
      a: 'No. OnGround enforces role-based access control (RBAC). Site Supervisors have ingestion and read permissions. Only certified Project Planners have permissions to confirm, reject, or reassign schedule matches. Master schedule baselines remain immutable reference standards.',
    },
    {
      q: 'What happens when an activity description is ambiguous?',
      a: 'When an activity has multiple possible schedule targets (e.g. "Cable tray installation" across multiple levels or areas), OnGround presents a Disambiguation Panel showing the top candidates, their relative similarity percentages, and discipline tags, allowing the planner to make an informed choice with one click.',
    },
    {
      q: 'How does OnGround handle activities that do not exist in the baseline schedule?',
      a: 'Activities that cannot be matched to existing baseline tasks are held in the Unmatched Activities pool. Planners can manually search the schedule to find a non-obvious link or mark the item as a potential new scope addition or variation order.',
    },
    {
      q: 'Are live Primavera P6 and Microsoft Project direct API syncs supported in Phase 1?',
      a: 'No. Live Primavera P6 API connectors, MS Project direct sync, mobile OCR, and voice dictation are planned for future phases. Phase 1 supports standard CSV and XML baseline schedule imports and multi-format document uploads.',
    },
    {
      q: 'Is there a permanent record of all schedule linking decisions?',
      a: 'Yes. OnGround includes an immutable, append-only audit trail that records every file upload, task extraction, automatic match, manual planner confirmation, and rejection with actor identification and timestamps.',
    },
  ];

  return (
    <div className="section-container" style={{ maxWidth: '840px' }}>
      <div className="section-header">
        <div className="section-tag">Common Questions</div>
        <h1 className="section-title">Frequently Asked Questions</h1>
        <p className="section-subtitle">
          Find answers regarding document ingestion, semantic schedule reconciliation, and planner review workflows.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '64px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="glass-card"
              style={{ padding: '20px 24px', cursor: 'pointer' }}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {faq.q}
                </h3>
                <ChevronDown
                  size={18}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </div>

              {isOpen && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
