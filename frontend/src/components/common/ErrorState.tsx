import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--confidence-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--confidence-low)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', marginBottom: onRetry ? '1.25rem' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRetry}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};

