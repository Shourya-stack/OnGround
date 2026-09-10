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
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '400px', marginBottom: onRetry ? '1rem' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          className="btn btn-secondary"
          onClick={onRetry}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};
