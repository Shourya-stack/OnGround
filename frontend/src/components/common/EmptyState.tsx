import React from 'react';
import { LucideIcon, Inbox, FilterX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  isFiltered?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  isFiltered = false,
}) => {
  const Icon = icon || (isFiltered ? FilterX : Inbox);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-medium)',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: isFiltered ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
          color: isFiltered ? 'var(--accent-blue)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', marginBottom: actionLabel ? '1.25rem' : 0 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          className={isFiltered ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
          onClick={onAction}
          style={{ marginTop: '0.75rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

