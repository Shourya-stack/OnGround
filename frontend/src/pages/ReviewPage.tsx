import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatches } from '../hooks/useMatches';
import { ReviewPanel } from '../components/review/ReviewPanel';
import { apiClient } from '../lib/apiClient';
import { CandidateMatch } from '../lib/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Toast, ToastMessage } from '../components/common/Toast';

export const ReviewPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: matches, loading, error, refetch } = useMatches();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const currentMatch = matches.find((m) => m.id === matchId) || matches[0];

  const handleConfirm = async () => {
    if (!currentMatch) return;
    try {
      await apiClient.confirmMatch(currentMatch.id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Match Confirmed',
        message: 'Physical progress linked to Primavera/P6 baseline schedule.',
      });
      setTimeout(() => navigate('/reconciliation'), 1000);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Confirmation Failed',
        message: err.message,
      });
    }
  };

  const handleReject = async (reason?: string) => {
    if (!currentMatch) return;
    try {
      await apiClient.rejectMatch(currentMatch.id, reason);
      setToast({
        id: Date.now().toString(),
        type: 'info',
        title: 'Match Rejected',
        message: 'Activity moved to Unmatched pool.',
      });
      setTimeout(() => navigate('/reconciliation'), 1000);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Rejection Failed',
        message: err.message,
      });
    }
  };

  const handleSelectAlternative = async (cand: CandidateMatch) => {
    if (!currentMatch) return;
    try {
      await apiClient.confirmMatch(currentMatch.id);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Alternative Linked',
        message: `Successfully reassigned to activity #${cand.activity_code}.`,
      });
      setTimeout(() => navigate('/reconciliation'), 1000);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Reassignment Failed',
        message: err.message,
      });
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (loading) {
    return <LoadingSkeleton rows={5} height="60px" />;
  }

  if (!currentMatch) {
    return (
      <EmptyState
        title="No Match Found"
        description="The requested reconciliation match could not be found or has already been resolved."
        actionLabel="Back to Reconciliation"
        onAction={() => navigate('/reconciliation')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <ReviewPanel
        match={currentMatch}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onSelectAlternative={handleSelectAlternative}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
