import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Upload,
  Cpu,
  Sparkles,
  GitCompare,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';

type PipelineState = 'processing' | 'completed' | 'failed';

export const ProjectProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [pipelineState, setPipelineState] = useState<PipelineState>('processing');
  const [currentStepIndex, setCurrentStepIndex] = useState(3);
  const [progressPercent, setProgressPercent] = useState(78);
  const [retrying, setRetrying] = useState(false);

  const stages = [
    {
      id: 'upload',
      name: 'Upload & Ingestion',
      icon: Upload,
      desc: 'Validated PDF/CSV document structure, encoding & source metadata',
      output: 'Source validated • DPR_Piping_Package3_2026-09-12.pdf',
    },
    {
      id: 'extraction',
      name: 'Activity Extraction',
      icon: Cpu,
      desc: 'Extracted raw field observations, dates, disciplines, and locations',
      output: '4 work tasks parsed • 100% text recognition',
    },
    {
      id: 'embedding',
      name: 'Understanding & Embedding',
      icon: Sparkles,
      desc: 'Generated 768-dimensional contextual sentence embeddings',
      output: 'Transformer vector representations calculated',
    },
    {
      id: 'matching',
      name: 'Schedule Matching & Scoring',
      icon: GitCompare,
      desc: 'Comparing similarity against Primavera P6 master baseline activities',
      output: pipelineState === 'failed' ? 'Cosine vector similarity timeout on WBS node PIP-204' : '3 auto-matched (≥85%), 1 flagged for certified review',
    },
    {
      id: 'complete',
      name: 'Reconciliation Staging Complete',
      icon: FileCheck2,
      desc: 'Populating Project Reconciliation Hub and Human Review Queue',
      output: 'Ready for planner verification and baseline progress linking',
    },
  ];

  const handleSimulateFailure = () => {
    setPipelineState('failed');
    setCurrentStepIndex(3);
    setProgressPercent(68);
  };

  const handleSimulateComplete = () => {
    setPipelineState('completed');
    setCurrentStepIndex(5);
    setProgressPercent(100);
  };

  const handleRunLiveSimulation = () => {
    setPipelineState('processing');
    setCurrentStepIndex(0);
    setProgressPercent(15);
  };

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setPipelineState('processing');
      setCurrentStepIndex(3);
      setProgressPercent(82);

      setTimeout(() => {
        setPipelineState('completed');
        setCurrentStepIndex(5);
        setProgressPercent(100);
      }, 1500);
    }, 1000);
  };

  // Step progression effect for live simulation
  useEffect(() => {
    if (pipelineState === 'processing' && currentStepIndex < 4) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          setProgressPercent(Math.min(100, (next + 1) * 20));
          if (next >= 4) {
            setPipelineState('completed');
          }
          return next;
        });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [pipelineState, currentStepIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '920px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Processing Pipeline Center
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          End-to-end visibility across document ingestion, physical task extraction, embedding, and semantic schedule alignment.
        </p>
      </div>

      {/* Main Pipeline Card */}
      <div className="glass-card" style={{ padding: '32px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
                PROCESSING JOB #JOB-2026-C4
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    pipelineState === 'completed'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : pipelineState === 'failed'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(56, 189, 248, 0.15)',
                  color:
                    pipelineState === 'completed'
                      ? 'var(--confidence-high)'
                      : pipelineState === 'failed'
                      ? '#ef4444'
                      : 'var(--accent-blue)',
                  textTransform: 'uppercase',
                }}
              >
                {pipelineState === 'completed' ? 'Complete' : pipelineState === 'failed' ? 'Failed' : 'In Progress'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              DPR_Piping_Package3_2026-09-12.pdf
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRunLiveSimulation}
              title="Restart automated pipeline simulation"
            >
              <RotateCcw size={13} /> Run Live
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSimulateFailure}
            >
              Simulate Failure
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSimulateComplete}
            >
              Simulate Complete
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '28px' }}>
          <ProgressBar
            progress={progressPercent}
            color={pipelineState === 'failed' ? '#ef4444' : pipelineState === 'completed' ? 'var(--confidence-high)' : undefined}
            showLabel
          />
        </div>

        {/* Failure Alert Banner */}
        {pipelineState === 'failed' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '14px 18px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>
                  Semantic Schedule Matching Error
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Timeout while evaluating cosine similarity on activity candidate PIP-204.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={retrying}
              onClick={handleRetry}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={retrying ? 'spin' : ''} style={retrying ? { animation: 'spin 1s linear infinite' } : {}} />
              <span>{retrying ? 'Retrying Stage...' : 'Retry Matching Stage'}</span>
            </button>
          </div>
        )}

        {/* 5-Step Stage Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {stages.map((st, idx) => {
            const isDone = pipelineState === 'completed' || idx < currentStepIndex;
            const isFailed = pipelineState === 'failed' && idx === currentStepIndex;
            const isInProgress = pipelineState === 'processing' && idx === currentStepIndex;

            const StageIcon = st.icon;

            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: isFailed
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : isInProgress
                    ? '1px solid var(--accent-blue)'
                    : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Icon Indicator */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
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
                    <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  ) : (
                    <StageIcon size={16} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      0{idx + 1}
                    </span>
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
                      {isDone ? 'COMPLETE' : isFailed ? 'FAILED' : isInProgress ? 'ACTIVE' : 'PENDING'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    {st.desc}
                  </p>

                  {(isDone || isFailed || isInProgress) && (
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: isFailed ? '#ef4444' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: '4px',
                      }}
                    >
                      ↳ {st.output}
                    </div>
                  )}
                </div>

                {isFailed && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={retrying}
                    onClick={handleRetry}
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Pipeline status: {pipelineState === 'completed' ? 'All tasks staged and verified' : 'Live execution pipeline mock simulation'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/projects/${projectId}/reports`} className="btn btn-secondary btn-sm">
              Back to Reports
            </Link>
            <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-primary btn-sm">
              Proceed to Reconciliation Hub <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
