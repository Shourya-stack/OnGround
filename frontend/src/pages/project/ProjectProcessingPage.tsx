import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const ProjectProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [activeJob, setActiveJob] = useState<'job-active' | 'job-failed'>('job-active');
  const [pipelineProgress, setPipelineProgress] = useState(78);
  const [retrying, setRetrying] = useState(false);

  const handleSimulateRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setActiveJob('job-active');
      setPipelineProgress(95);
    }, 1200);
  };

  const pipelineStages = [
    { name: 'Document Ingestion', status: 'done', desc: 'Validated file integrity & text encoding' },
    { name: 'Activity Extraction', status: 'done', desc: 'Identified 4 physical work tasks and locations' },
    { name: 'Vector Embedding', status: 'done', desc: 'Generated sentence-transformer vector representations' },
    { name: 'Semantic Schedule Matching', status: activeJob === 'job-failed' ? 'failed' : 'in_progress', desc: 'Comparing against Primavera P6 baseline WBS' },
    { name: 'Reconciliation Staging', status: 'pending', desc: 'Populating Matched and Needs Review queues' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Processing Pipeline Tracker
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Real-time visibility into document parsing, AI extraction, and semantic schedule alignment stages.
        </p>
      </div>

      {/* Pipeline Status Overview */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
              ACTIVE JOB #JOB-247-98
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              Daily_Progress_Instrumentation_Unit200.csv
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`tab-pill ${activeJob === 'job-active' ? 'active' : ''}`}
              onClick={() => setActiveJob('job-active')}
            >
              Simulate Active Job
            </button>
            <button
              type="button"
              className={`tab-pill ${activeJob === 'job-failed' ? 'active' : ''}`}
              onClick={() => setActiveJob('job-failed')}
            >
              Simulate Failure
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <ProgressBar
            progress={activeJob === 'job-failed' ? 62 : pipelineProgress}
            color={activeJob === 'job-failed' ? '#ef4444' : undefined}
            showLabel
          />
        </div>

        {/* Stages Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pipelineStages.map((st, idx) => {
            const isDone = st.status === 'done';
            const isFailed = st.status === 'failed';
            const isInProgress = st.status === 'in_progress';

            return (
              <div
                key={st.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: isFailed ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isDone
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isFailed
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isInProgress
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isDone
                      ? 'var(--confidence-high)'
                      : isFailed
                      ? '#ef4444'
                      : isInProgress
                      ? 'var(--accent-blue)'
                      : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : isFailed ? (
                    <AlertCircle size={18} />
                  ) : isInProgress ? (
                    <RefreshCw size={18} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{idx + 1}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {st.name}
                    </h4>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor: isDone
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isFailed
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isInProgress
                          ? 'rgba(56, 189, 248, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isDone
                          ? 'var(--confidence-high)'
                          : isFailed
                          ? '#ef4444'
                          : isInProgress
                          ? 'var(--accent-blue)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {st.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {st.desc}
                  </p>
                </div>

                {isFailed && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={retrying}
                    onClick={handleSimulateRetry}
                  >
                    <RefreshCw size={12} /> {retrying ? 'Retrying...' : 'Retry Job'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Processing Pipeline: Local in-memory embedding demonstration
          </div>
          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-primary btn-sm">
            Proceed to Reconciliation Table <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
