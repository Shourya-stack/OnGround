import React from 'react';
import { Layers, Target, Compass, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="section-container" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div className="section-header">
        <div className="section-tag">About OnGround</div>
        <h1 className="section-title">Bridging the Gap Between Site Execution & Schedule Reality</h1>
        <p className="section-subtitle">
          Building the digital foundation for infrastructure progress intelligence.
        </p>
      </div>

      {/* Vision & Problem */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '64px' }}>
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)' }}>
              <Target size={22} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Our Vision</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
            Transform infrastructure progress tracking from a fragmented, manual reconciliation exercise into an automated, real-time intelligence workflow. We believe project delivery teams should spend their time solving engineering challenges and managing critical paths rather than manually typing daily logs into master schedule systems.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Compass size={22} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>The Problem We Solve</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '14px' }}>
            Large-scale EPC projects in oil & gas, metro rail, highways, and heavy industrial facilities face severe coordination friction. Site engineers write daily reports in unstructured formats; meanwhile, project planners maintain intricate Primavera P6 WBS hierarchies with thousands of discrete activity codes.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
            Because field descriptions rarely match exact schedule titles, progress data is delayed, manual mapping is error-prone, and historical site insights are lost after project completion. OnGround solves this by applying semantic embeddings and human-in-the-loop disambiguation.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--confidence-high)' }}>
              <Layers size={22} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Our Product Philosophy</h2>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>1. Respect Field Realities:</strong> Never force field supervisors to conform to rigid software schemas. The system must adapt to existing documents and text diaries.
            </li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>2. Transparent AI Boundaries:</strong> AI acts as an advisor, not an autonomous decider. High confidence links are clear; uncertain candidates are explicitly surfaced for human review.
            </li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>3. Full Traceability:</strong> Every progress link must point back to original source documents, preserving accountability through an immutable audit trail.
            </li>
          </ul>
        </div>
      </div>

      {/* Team */}
      <div className="glass-card" style={{ padding: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)' }}>
            <Users size={22} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>The Team Behind OnGround</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
          Built by engineers passionate about infrastructure technology, construction software, and practical AI application. Designed as part of the Smart India Hackathon (Problem Statement 26122).
        </p>
        <div className="grid-3">
          {[
            { name: 'Shourya (Lead)', role: 'Product Architecture & Planning Systems' },
            { name: 'AI & Ingestion Team', role: 'NLP Extraction & Sentence Embeddings' },
            { name: 'Platform & Infrastructure', role: 'Full-Stack & Realtime Data Architecture' },
          ].map((m) => (
            <div key={m.name} style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{m.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
