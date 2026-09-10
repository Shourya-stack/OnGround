import React from 'react';
import { UploadCloud, FileText } from 'lucide-react';

export const UploadPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          Upload Site Daily Progress Report
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Upload PDF, CSV, Excel spreadsheets, or daily logs to trigger AI extraction.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
          <UploadCloud size={32} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>
          Drag & drop report file here or click to browse
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          Supported formats: .pdf, .csv, .xlsx, .txt (Max file size: 10MB)
        </p>
        <button
          type="button"
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Select Report File
        </button>
      </div>
    </div>
  );
};
