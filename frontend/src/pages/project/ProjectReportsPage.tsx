import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Archive,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { ReportItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getReports(projectId);
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports', err);
      setError(err?.message || 'Failed to load daily reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [projectId]);

  const handleRetry = async (repId: string) => {
    try {
      const updates = { status: 'completed' as const, activities_count: 4, matched_count: 3, review_count: 1 };
      await apiService.updateReport(repId, updates);
      setReports((prev) =>
        prev.map((r) =>
          r.id === repId
            ? { ...r, ...updates }
            : r
        )
      );
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Reprocessing Completed',
        message: `Report ${repId} re-extracted and matched with baseline schedule.`,
      });
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err?.message || 'Failed to retry report processing.' });
    }
  };

  const handleArchive = async (repId: string) => {
    try {
      await apiService.archiveReport(repId);
      setReports((prev) => prev.filter((r) => r.id !== repId));
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Report Archived',
        message: `Report ${repId} successfully archived.`,
      });
    } catch (err: any) {
      setToast({ id: Date.now().toString(), type: 'error', title: 'Error', message: err?.message || 'Failed to archive report.' });
    }
  };

  const filtered = reports.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.file_name.toLowerCase().includes(term) ||
      r.uploaded_by.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Daily Progress Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Repository of ingested contractor daily progress logs, spreadsheets, and diaries.
          </p>
        </div>

        <Link to={`/projects/${projectId}/reports/upload`} className="btn btn-primary">
          <UploadCloud size={16} /> Upload Daily Log
        </Link>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search report name or uploader..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
          {['all', 'completed', 'processing', 'failed'].map((st) => (
            <button
              key={st}
              type="button"
              className={`tab-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
              style={{ textTransform: 'capitalize' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table Area */}
      {loading ? (
        <LoadingSkeleton rows={5} height="50px" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Daily Progress Reports"
          description="Upload daily site diaries, contractor shift reports, or spreadsheets to extract physical progress."
          actionLabel="Upload Daily Log"
          onAction={() => navigate(`/projects/${projectId}/reports/upload`)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          isFiltered
          title="No Reports Match Filters"
          description={`No daily reports matched "${search || statusFilter}". Try clearing your search query or status filter.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report File</th>
                <th style={{ width: '130px' }}>Date</th>
                <th style={{ width: '180px' }}>Uploaded By</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '100px' }}>Activities</th>
                <th style={{ width: '100px' }}>Matched</th>
                <th style={{ width: '100px' }}>Review</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rep) => (
                <tr key={rep.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                          {rep.file_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Size: {rep.file_size} • {rep.file_type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {new Date(rep.uploaded_at).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {rep.uploaded_by}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          rep.status === 'completed'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : rep.status === 'processing'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          rep.status === 'completed'
                            ? 'var(--confidence-high)'
                            : rep.status === 'processing'
                            ? 'var(--confidence-review)'
                            : '#ef4444',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rep.activities_count}</td>
                  <td style={{ fontWeight: 600, color: 'var(--confidence-high)' }}>{rep.matched_count}</td>
                  <td style={{ fontWeight: 600, color: 'var(--confidence-review)' }}>{rep.review_count}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/projects/${projectId}/processing`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="View Extraction & NLP details"
                      >
                        <Eye size={14} />
                      </Link>
                      {rep.status === 'failed' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: 'var(--accent-blue)' }}
                          title="Retry extraction"
                          onClick={() => handleRetry(rep.id)}
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="Archive report"
                        onClick={() => handleArchive(rep.id)}
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
