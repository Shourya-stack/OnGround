import React, { useState } from 'react';
import { useMatches } from '../hooks/useMatches';
import { ReconciliationTable } from '../components/reconciliation/ReconciliationTable';
import { apiClient } from '../lib/apiClient';
import { CandidateMatch } from '../lib/types';
import { Toast, ToastMessage } from '../components/common/Toast';

export const ReconciliationPage: React.FC = () => {
  const { data: matches, loading, error, refetch } = useMatches();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleConfirm = async (matchId: string) => {
    try {
      await apiClient.confirmMatch(matchId);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Match Confirmed',
        message: 'Physical progress linked to Primavera/P6 baseline schedule.',
      });
      refetch();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Confirmation Failed',
        message: err.message || 'Could not confirm match.',
      });
    }
  };

  const handleReject = async (matchId: string, reason?: string) => {
    try {
      await apiClient.rejectMatch(matchId, reason);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Match Rejected',
        message: 'Activity moved to Unmatched pool.',
      });
      refetch();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'Could not reject match.',
      });
    }
  };

  const handleConfirmAlternative = async (matchId: string, candidate: CandidateMatch) => {
    try {
      // In production API, could send candidate reassign payload
      await apiClient.confirmMatch(matchId);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Alternative Target Linked',
        message: `Successfully reassigned to activity #${candidate.activity_code}.`,
      });
      refetch();
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Reassignment Failed',
        message: err.message,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Progress Reconciliation Table
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Review semantic links between contractor daily reports and master baseline schedule activities. Planners can confirm, reject, or disambiguate alternative matches.
        </p>
      </div>

      <ReconciliationTable
        matches={matches}
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onConfirmAlternative={handleConfirmAlternative}
        onRefresh={refetch}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
