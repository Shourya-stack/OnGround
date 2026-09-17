import React from 'react';
import { CheckCircle2, Clock, Loader2, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export type PipelineStep = 'idle' | 'uploading' | 'extracting' | 'matching' | 'completed' | 'failed';

interface UploadStatusCardProps {
  step: PipelineStep;
  fileName?: string;
  extractedCount?: number;
  matchedCount?: number;
  errorMessage?: string;
  onReset?: () => void;
}

export const UploadStatusCard: React.FC<UploadStatusCardProps> = ({
  step,
  fileName = 'report.pdf',
  extractedCount = 0,
  matchedCount = 0,
  errorMessage,
  onReset,
}) => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';
  const steps = [
    { key: 'uploading', label: '1. Ingest File to Storage' },
    { key: 'extracting', label: '2. AI Activity Extraction & Confidence' },
    { key: 'matching', label: '3. Sentence-Transformer Schedule Linking' },
    { key: 'completed', label: '4. Landed in Database & Audit Trail' },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['idle', 'uploading', 'extracting', 'matching', 'completed'];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(stepKey);

    if (step === 'failed') return 'error';
    if (currentIndex > targetIndex) return 'complete';
    if (currentIndex === targetIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--color-primary)" />
          <span>Processing Pipeline: {fileName}</span>
        </h3>
        {step === 'completed' && (
          <span className="confidence-badge badge-high" style={{ fontSize: '0.75rem' }}>
            <CheckCircle2 size={12} /> Pipeline Complete
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((s) => {
          const status = getStepStatus(s.key);
          return (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: status === 'active' ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface-hover)',
                border: `1px solid ${status === 'active' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {status === 'complete' && <CheckCircle2 size={18} color="var(--color-success)" />}
                {status === 'active' && <Loader2 size={18} color="var(--color-primary)" className="animate-spin" />}
                {status === 'pending' && <Clock size={18} color="var(--color-text-muted)" />}
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: status === 'active' ? 600 : 400,
                    color: status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 'completed' && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: '0.9rem' }}>
              Successfully Processed!
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Extracted {extractedCount} activities • Created {matchedCount} schedule matches
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onReset && (
              <button className="btn btn-secondary" onClick={onReset} style={{ fontSize: '0.85rem' }}>
                Upload Another
              </button>
            )}
            <Link
              to={`/projects/${projectId}/reconciliation`}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              View in Reconciliation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMessage}</span>
          {onReset && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onReset}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
};
