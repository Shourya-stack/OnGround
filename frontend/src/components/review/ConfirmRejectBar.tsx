import React, { useState } from 'react';
import { CheckCircle2, XCircle, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ConfirmRejectBarProps {
  onConfirm: () => void;
  onReject: (reason?: string) => void;
  isSubmitting?: boolean;
}

export const ConfirmRejectBar: React.FC<ConfirmRejectBarProps> = ({
  onConfirm,
  onReject,
  isSubmitting,
}) => {
  const { isPlanner } = useAuth();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirmReject = () => {
    onReject(rejectReason || 'Rejected by planner during review');
    setShowRejectModal(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Shield size={18} color={isPlanner ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Planner Reconciliation Decision
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {isPlanner
              ? 'Your confirmation will link this daily progress into the master Primavera/P6 baseline.'
              : 'Supervisor read-only mode. Only Lead Planners can confirm or reject schedule links.'}
          </div>
        </div>
      </div>

      {isPlanner ? (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowRejectModal(true)}
            disabled={isSubmitting}
            style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <XCircle size={15} /> Reject Link
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <CheckCircle2 size={15} /> Confirm Match
          </button>
        </div>
      ) : (
        <span className="confidence-badge badge-review" style={{ fontSize: '0.75rem' }}>
          Planner Role Required
        </span>
      )}

      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{ padding: '1.75rem', maxWidth: '460px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reject Schedule Match</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              This activity will be moved to the Unmatched pool for manual linking or re-extraction.
            </p>
            <textarea
              placeholder="Reason for rejection (e.g. incorrect work package, scope discrepancy)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: 'var(--color-text)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
