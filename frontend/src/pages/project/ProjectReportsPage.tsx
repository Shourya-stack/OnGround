import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { apiClient, formatApiErrorMessage } from '../../lib/apiClient';
import { ReportItem } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || '';
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
      const data = await apiClient.getReports({ project_id: projectId });
      setReports(data || []);
    } catch (err: any) {
      console.error('Failed to load reports from API', err);
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getFileName = (fileName: string) => fileName || 'Daily Report';

  const getFileType = (report: ReportItem) => {
    const type = report.file_extension || report.file_type;
    return type ? type.replace(/^\./, '').toUpperCase() : 'DOCUMENT';
  };

  const filtered = reports.filter((r) => {
    const term = search.toLowerCase();
    const fileName = getFileName(r.display_name || r.file_name).toLowerCase();
    const uploader = (r.uploaded_by || '').toLowerCase();
    const matchesSearch = fileName.includes(term) || uploader.includes(term) || r.id.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === 'all' ||
      r.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'complete' && r.status === 'complete');
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
            Live repository of ingested contractor daily progress logs, spreadsheets, and site records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadReports}
            disabled={loading}
            title="Refresh reports list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <Link to={`/projects/${projectId}/reports/upload`} className="btn btn-primary">
            <UploadCloud size={16} /> Upload Daily Log
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="bionis-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search report name or ID..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
          {['all', 'complete', 'processing', 'pending', 'failed'].map((st) => (
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
                <th style={{ width: '150px' }}>Extraction ID</th>
                <th style={{ width: '130px' }}>Uploaded At</th>
                <th style={{ width: '180px' }}>Uploaded By</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
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
                          {getFileName(rep.display_name || rep.file_name)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Type: {getFileType(rep)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {rep.id ? `${rep.id.slice(0, 8)}...` : '—'}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {rep.uploaded_at ? new Date(rep.uploaded_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {rep.uploaded_by ? (
                      <span title={rep.uploaded_by} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {rep.uploaded_by.slice(0, 8)}...
                      </span>
                    ) : (
                      'System / Supabase'
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          rep.status === 'complete'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : rep.status === 'processing' || rep.status === 'pending'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          rep.status === 'complete'
                            ? 'var(--confidence-high)'
                            : rep.status === 'processing' || rep.status === 'pending'
                            ? 'var(--confidence-review)'
                            : '#ef4444',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/projects/${projectId}/processing`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="View Extraction Pipeline"
                      >
                        <Eye size={14} />
                      </Link>
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
