import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} color="var(--color-success)" />,
    error: <AlertCircle size={18} color="var(--color-danger)" />,
    info: <Info size={18} color="var(--color-primary)" />,
  };

  const borders = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    info: 'var(--color-primary)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        borderLeft: `4px solid ${borders[toast.type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        minWidth: '300px',
        maxWidth: '450px',
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      <div style={{ marginTop: '2px' }}>{icons[toast.type]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px' }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
