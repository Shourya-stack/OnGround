import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UploadDropzone } from '../../components/upload/UploadDropzone';
import { UploadStatusCard, PipelineStep } from '../../components/upload/UploadStatusCard';
import { apiService } from '../../api/apiService';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { ArrowLeft, Cpu } from 'lucide-react';

export const ProjectUploadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [currentFileName, setCurrentFileName] = useState('');
  const [extractedCount, setExtractedCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleFileSelect = async (file: File) => {
    setCurrentFileName(file.name);
    setPipelineStep('uploading');
    setErrorMessage(null);

    try {
      // 1. Upload
      await new Promise((res) => setTimeout(res, 600));

      // 2. Extract
      setPipelineStep('extracting');
      await new Promise((res) => setTimeout(res, 700));
      setExtractedCount(4);

      // 3. Match
      setPipelineStep('matching');
      await new Promise((res) => setTimeout(res, 700));
      setMatchedCount(3);

      // 4. Complete
      setPipelineStep('completed');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = (['pdf', 'docx', 'xlsx', 'csv', 'txt'].includes(fileExt) ? fileExt : 'pdf') as 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt';

      await apiService.uploadReport(projectId, {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileType,
      });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Report Processed Successfully',
        message: `Extracted 4 activities and linked with baseline schedule.`,
      });
    } catch (err: any) {
      setPipelineStep('failed');
      setErrorMessage(err.message || 'Pipeline processing encountered an error.');
    }
  };

  const handleReset = () => {
    setPipelineStep('idle');
    setCurrentFileName('');
    setExtractedCount(0);
    setMatchedCount(0);
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
      {/* Back Link */}
      <div>
        <Link to={`/projects/${projectId}/reports`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '8px' }}>
          <ArrowLeft size={14} /> Back to Reports
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Upload Daily Progress Report
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Upload PDF daily reports, Excel work logs, or CSV entries to trigger automated activity extraction.
            </p>
          </div>
          <Link to={`/projects/${projectId}/processing`} className="btn btn-secondary btn-sm">
            <Cpu size={14} /> Pipeline Tracker
          </Link>
        </div>
      </div>

      {/* Upload Box / Status Card */}
      {pipelineStep === 'idle' ? (
        <div className="glass-card" style={{ padding: '36px' }}>
          <UploadDropzone onFileSelect={handleFileSelect} isUploading={false} />

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>✓ Supported: PDF, DOCX, XLSX, CSV, TXT</span>
            <span>✓ Up to 10 MB per file</span>
            <span>✓ Automatic format detection</span>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '36px' }}>
          <UploadStatusCard
            step={pipelineStep}
            fileName={currentFileName}
            extractedCount={extractedCount}
            matchedCount={matchedCount}
            errorMessage={errorMessage || undefined}
            onReset={handleReset}
          />
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
