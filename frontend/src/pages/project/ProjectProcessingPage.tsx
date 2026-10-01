import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { ReportItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const ProjectProcessingPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      if (!projectId) {
        setError('A project must be selected to view processing status.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const records = await apiClient.getReports({ project_id: projectId });
        if (active) setReports(records);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load report processing status.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReports();
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports to process"
        description="Upload a project report to see its real extraction and matching status here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '920px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Processing Pipeline
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Report status from this project’s processing records.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reports.map((report) => (
          <article key={report.id} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                  {report.display_name || report.file_name}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Uploaded {report.uploaded_at ? new Date(report.uploaded_at).toLocaleString() : 'date unavailable'}
                </p>
                {report.error_message && (
                  <p role="alert" style={{ fontSize: '12px', color: 'var(--confidence-low)', marginTop: '8px' }}>
                    {report.error_message}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
                {report.status}
              </span>
            </div>
          </article>
        ))}
      </div>

      <Link to={`/projects/${projectId}/reports`} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
        View project reports
      </Link>
    </div>
  );
};
