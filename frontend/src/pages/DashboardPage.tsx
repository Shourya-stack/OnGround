import React from 'react';
import { useMatches } from '../hooks/useMatches';
import { useExtractions } from '../hooks/useExtractions';
import { ProgressSummary } from '../components/dashboard/ProgressSummary';
import { DisciplineBreakdown } from '../components/dashboard/DisciplineBreakdown';
import { RecentUploads } from '../components/dashboard/RecentUploads';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { Link } from 'react-router-dom';
import { UploadCloud, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: matches, loading: matchesLoading, error: matchesError, refetch: refetchMatches } = useMatches();
  const { data: extractions, loading: extLoading, error: extError, refetch: refetchExt } = useExtractions();

  const loading = matchesLoading || extLoading;
  const error = matchesError || extError;

  const handleRefresh = () => {
    refetchMatches();
    refetchExt();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          padding: '1.75rem 2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            TrueLine Project Intelligence Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Automated EPC Progress Capture & Primavera P6 Schedule Linking • Role:{' '}
            <strong style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>{user?.role}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to="/upload"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            <UploadCloud size={16} /> Upload Daily Report
          </Link>
          <Link
            to="/reconciliation"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            Reconciliation Table <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={handleRefresh} />
      ) : loading ? (
        <LoadingSkeleton rows={4} variant="card" />
      ) : (
        <>
          {/* KPI Metrics */}
          <ProgressSummary matches={matches} extractions={extractions} />

          {/* 2-Column Analytics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <DisciplineBreakdown matches={matches} />
            <RecentUploads extractions={extractions} />
          </div>
        </>
      )}
    </div>
  );
};
