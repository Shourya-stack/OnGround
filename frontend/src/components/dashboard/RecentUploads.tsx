import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExtractionRecord } from '../../lib/types';
import { StatusBadge } from '../common/StatusBadge';

interface RecentUploadsProps {
  extractions: ExtractionRecord[];
}

export const RecentUploads: React.FC<RecentUploadsProps> = ({ extractions }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
          Recent Daily Reports
        </h3>
        <Link
          to="/upload"
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontWeight: 500,
          }}
        >
          Upload New <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {extractions.slice(0, 4).map((ext) => {
          const filename = ext.file_url ? ext.file_url.split('/').pop() : 'daily_report.pdf';
          return (
            <div
              key={ext.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--color-primary)' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                    {filename}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(ext.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <StatusBadge status={ext.status} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
