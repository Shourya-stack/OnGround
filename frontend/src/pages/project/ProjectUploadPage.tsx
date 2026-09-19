import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UploadDropzone } from '../../components/upload/UploadDropzone';
import { UploadStatusCard, PipelineStep } from '../../components/upload/UploadStatusCard';
import { apiClient, formatApiErrorMessage } from '../../lib/apiClient';
import { ExtractedActivity, MatchResult } from '../../lib/types';
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
      // 1. Upload report file to backend / Supabase Storage
      const uploadRes = await apiClient.uploadReport(file);
      const extractionId = uploadRes.extraction_id;

      // 2. Trigger AI extraction pipeline
      setPipelineStep('extracting');
      const extractRes = await apiClient.triggerExtraction(extractionId);
      const activities: ExtractedActivity[] = extractRes.activities || [];
      const count = extractRes.activities_count ?? activities.length ?? 0;
      setExtractedCount(count);

      // If no activities were extracted, stop cleanly without matching
      if (activities.length === 0) {
        setMatchedCount(0);
        setPipelineStep('completed');
        setToast({
          id: Date.now().toString(),
          type: 'info',
          title: 'Report Processed (No Activities)',
          message: `Processed ${file.name}, but 0 physical construction activities were detected.`,
        });
        return;
      }

      // 3. Trigger matching for each real extracted activity
      setPipelineStep('matching');
      const uniqueIds = Array.from(
        new Set(activities.map((a) => a.id).filter(Boolean))
      );

      const matchResults: MatchResult[] = [];
      const matchErrors: string[] = [];

      for (const actId of uniqueIds) {
        try {
          const res = await apiClient.triggerMatch(actId);
          matchResults.push(res);
        } catch (err: any) {
          console.error(`Matching failed for extracted activity ${actId}:`, err);
          matchErrors.push(err?.message || `Match failed for activity ${actId}`);
        }
      }

      if (matchResults.length === 0 && uniqueIds.length > 0) {
        throw new Error(matchErrors[0] || 'Matching engine failed for all extracted activities.');
      }

      const autoLinked = matchResults.filter((m) => m.status === 'auto_linked').length;
      const pendingReview = matchResults.filter((m) => m.status === 'pending_review').length;
      const unmatched = matchResults.filter((m) => m.status === 'unmatched').length;
      const totalProcessed = autoLinked + pendingReview;

      setMatchedCount(totalProcessed);
      setPipelineStep('completed');

      const summaryParts: string[] = [];
      if (autoLinked > 0) summaryParts.push(`${autoLinked} auto-linked`);
      if (pendingReview > 0) summaryParts.push(`${pendingReview} pending review`);
      if (unmatched > 0) summaryParts.push(`${unmatched} unmatched`);
      if (matchErrors.length > 0) summaryParts.push(`${matchErrors.length} failed`);

      const summaryText = summaryParts.length > 0 ? ` (${summaryParts.join(', ')})` : '';

      setToast({
        id: Date.now().toString(),
        type: matchErrors.length > 0 ? 'info' : 'success',
        title: matchErrors.length > 0 ? 'Report Processed with Warnings' : 'Report Processed Successfully',
        message: `Extracted ${count} activities${summaryText}.`,
      });
    } catch (err: any) {
      console.error('Upload, extraction, or matching pipeline error:', err);
      setPipelineStep('failed');
      const message = formatApiErrorMessage(err);
      setErrorMessage(message);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Processing Failed',
        message,
      });
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
        <div className="bionis-card bionis-card-glow-blue" style={{ padding: '36px' }}>
          <UploadDropzone onFileSelect={handleFileSelect} isUploading={false} />

          <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>✓ Supported: PDF, DOCX, XLSX, CSV, TXT</span>
            <span>✓ Up to 10 MB per file</span>
            <span>✓ Automatic format detection</span>
          </div>
        </div>
      ) : (
        <div className="bionis-card bionis-card-glow-blue" style={{ padding: '36px' }}>
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
