import React, { useState } from 'react';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { UploadStatusCard, PipelineStep } from '../components/upload/UploadStatusCard';
import { apiClient, ApiError } from '../lib/apiClient';
import { ExtractedActivity, MatchResult } from '../lib/types';
import { Toast, ToastMessage } from '../components/common/Toast';

export const UploadPage: React.FC = () => {
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
      // 1. Upload file to backend / storage
      const uploadRes = await apiClient.uploadReport(file);
      const extractionId = uploadRes.extraction_id;

      // 2. Trigger AI extraction
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
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Report processing pipeline encountered an error.';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Ingest Daily Progress Reports
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          Upload PDF reports, CSV logs, or spreadsheets. OnGround AI extracts physical tasks and links them semantically to Primavera/P6 baseline WBS activities.
        </p>
      </div>

      {pipelineStep === 'idle' ? (
        <UploadDropzone onFileSelect={handleFileSelect} isUploading={false} />
      ) : (
        <UploadStatusCard
          step={pipelineStep}
          fileName={currentFileName}
          extractedCount={extractedCount}
          matchedCount={matchedCount}
          errorMessage={errorMessage || undefined}
          onReset={handleReset}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
