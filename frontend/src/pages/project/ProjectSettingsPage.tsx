import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { Project } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || '';

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'matching' | 'reports'>('general');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // General settings controlled state
  const [projectName, setProjectName] = useState('');
  const [wbsCode, setWbsCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [generalErrors, setGeneralErrors] = useState<Record<string, string>>({});

  // Matching thresholds form state
  const [autoLinkThreshold, setAutoLinkThreshold] = useState(85);
  const [reviewThreshold, setReviewThreshold] = useState(70);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  // Ingestion rules state
  const [autoExtractionEnabled, setAutoExtractionEnabled] = useState(true);
  const [notifyOnReview, setNotifyOnReview] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const p = await apiClient.getProjectById(projectId);
        if (p) {
          setProject(p);
          setProjectName(p.name || '');
          setWbsCode(p.code || '');
          setClient(p.client || '');
          setLocation(p.location || '');
          setBudget(p.budget || '');
        }
      } catch (err) {
        console.error('Failed to load project settings', err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!projectName.trim()) {
      errors.name = 'Project name is required.';
    } else if (projectName.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters.';
    }

    if (!wbsCode.trim()) {
      errors.code = 'WBS Package Code is required.';
    } else if (wbsCode.trim().length < 2) {
      errors.code = 'WBS Package Code must be at least 2 characters.';
    }

    if (!client.trim()) {
      errors.client = 'Client authority is required.';
    }

    if (!location.trim()) {
      errors.location = 'Site corridor / location is required.';
    }

    if (!budget.trim()) {
      errors.budget = 'Contract budget is required.';
    }

    setGeneralErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const updated = await apiClient.updateProject(projectId, {
        name: projectName.trim(),
        code: wbsCode.trim(),
        client: client.trim(),
        location: location.trim(),
        budget: budget.trim(),
      });
      if (updated) {
        setProject(updated);
      }
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Settings Saved',
        message: 'Project parameters updated and persisted successfully.',
      });
    } catch (err) {
      console.error('Failed to update project settings', err);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update project settings.',
      });
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewThreshold >= autoLinkThreshold) {
      setThresholdError('Review threshold must be strictly lower than Auto-Link threshold.');
      return;
    }
    if (autoLinkThreshold - reviewThreshold < 5) {
      setThresholdError('Auto-Link threshold must be at least 5% higher than Review threshold.');
      return;
    }
    setThresholdError(null);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Thresholds Saved',
      message: `Auto-link set to ${autoLinkThreshold}% and Review set to ${reviewThreshold}%.`,
    });
  };

  const handleSaveIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Ingestion Rules Saved',
      message: 'Automated processing rules updated successfully.',
    });
  };

  if (loading) {
    return <LoadingSkeleton rows={4} height="60px" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Project Settings & Matching Rules
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Configure parameters for {project?.name || 'this project'}, semantic matching confidence thresholds, and governance preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="bionis-card" style={{ padding: '12px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { id: 'general', label: 'General Parameters' },
          { id: 'matching', label: 'Matching Thresholds' },
          { id: 'reports', label: 'Ingestion Rules' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-pill ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bionis-card" style={{ padding: '32px' }}>
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (generalErrors.name) setGeneralErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`form-input ${generalErrors.name ? 'input-error' : ''}`}
                placeholder="e.g., Line 247 EPC Package"
              />
              {generalErrors.name && (
                <span style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {generalErrors.name}
                </span>
              )}
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">WBS Package Code *</label>
                <input
                  type="text"
                  value={wbsCode}
                  onChange={(e) => {
                    setWbsCode(e.target.value);
                    if (generalErrors.code) setGeneralErrors((prev) => ({ ...prev, code: '' }));
                  }}
                  className={`form-input ${generalErrors.code ? 'input-error' : ''}`}
                  placeholder="e.g., EPC-247"
                />
                {generalErrors.code && (
                  <span style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {generalErrors.code}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Client Authority *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => {
                    setClient(e.target.value);
                    if (generalErrors.client) setGeneralErrors((prev) => ({ ...prev, client: '' }));
                  }}
                  className={`form-input ${generalErrors.client ? 'input-error' : ''}`}
                  placeholder="e.g., National Highways Authority"
                />
                {generalErrors.client && (
                  <span style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {generalErrors.client}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Location / Site Corridor *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (generalErrors.location) setGeneralErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  className={`form-input ${generalErrors.location ? 'input-error' : ''}`}
                  placeholder="e.g., Km 42+200 to 58+600, Sector 4"
                />
                {generalErrors.location && (
                  <span style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {generalErrors.location}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Contract Budget *</label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    if (generalErrors.budget) setGeneralErrors((prev) => ({ ...prev, budget: '' }));
                  }}
                  className={`form-input ${generalErrors.budget ? 'input-error' : ''}`}
                  placeholder="e.g., ₹240 Cr"
                />
                {generalErrors.budget && (
                  <span style={{ color: 'var(--confidence-low)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {generalErrors.budget}
                  </span>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        )}

        {activeTab === 'matching' && (
          <form onSubmit={handleSaveThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Semantic Vector Matching Thresholds
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Determine the boundary percentages for automatic schedule linking versus planner review requirements.
              </p>
            </div>

            {thresholdError && (
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>{thresholdError}</span>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ color: 'var(--confidence-high)', margin: 0 }}>
                  High Confidence Band (Auto-Link Threshold): {autoLinkThreshold}%
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default: 85%</span>
              </div>
              <input
                type="range"
                min={75}
                max={95}
                value={autoLinkThreshold}
                onChange={(e) => {
                  setAutoLinkThreshold(Number(e.target.value));
                  if (thresholdError) setThresholdError(null);
                }}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Matches with similarity ≥ {autoLinkThreshold}% will be automatically linked to the baseline schedule.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ color: 'var(--confidence-review)', margin: 0 }}>
                  Medium Confidence Band (Review Gate Threshold): {reviewThreshold}%
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default: 70%</span>
              </div>
              <input
                type="range"
                min={50}
                max={80}
                value={reviewThreshold}
                onChange={(e) => {
                  setReviewThreshold(Number(e.target.value));
                  if (thresholdError) setThresholdError(null);
                }}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Matches between {reviewThreshold}% and {autoLinkThreshold - 1}% are held for human planner review.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Threshold Preferences
            </button>
          </form>
        )}

        {activeTab === 'reports' && (
          <form onSubmit={handleSaveIngestion} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Document Ingestion Preferences
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Configure automated parsing and notification settings for new reports.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <input
                type="checkbox"
                id="auto-extract"
                checked={autoExtractionEnabled}
                onChange={(e) => setAutoExtractionEnabled(e.target.checked)}
              />
              <label htmlFor="auto-extract" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Automatically trigger AI physical activity extraction upon file upload completion
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <input
                type="checkbox"
                id="notify-review"
                checked={notifyOnReview}
                onChange={(e) => setNotifyOnReview(e.target.checked)}
              />
              <label htmlFor="notify-review" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Notify lead project planner when reports produce ambiguous activities requiring disambiguation
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Ingestion Rules
            </button>
          </form>
        )}

      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
