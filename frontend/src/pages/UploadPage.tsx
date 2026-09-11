import React, { useState } from 'react';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { UploadStatusCard, PipelineStep } from '../components/upload/UploadStatusCard';
import { apiClient } from '../lib/apiClient';
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
      const extType = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? 'spreadsheet' : 'daily_report';
      const uploadRes = await apiClient.uploadReport(file, 'default-project', extType);
      const extractionId = uploadRes.extraction_id;

      // 2. Trigger AI extraction
      setPipelineStep('extracting');
      const extractRes = await apiClient.triggerExtraction(extractionId);
      const activities = extractRes.activities || [];
      setExtractedCount(activities.length);

      // 3. Trigger matching for each extracted activity
      setPipelineStep('matching');
      let matchesCreated = 0;
      for (const act of activities) {
        if (act.id) {
          await apiClient.triggerMatch(act.id);
          matchesCreated++;
        }
      }
      setMatchedCount(matchesCreated);

      // 4. Complete
      setPipelineStep('completed');
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Report Processed Successfully',
        message: `Extracted ${activities.length} activities and linked with baseline schedule.`,
      });
    } catch (err: any) {
      console.error('Upload pipeline error:', err);
      setPipelineStep('failed');
      setErrorMessage(err.message || 'Pipeline processing encountered an error.');
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Processing Failed',
        message: err.message || 'An error occurred during report extraction or matching.',
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
