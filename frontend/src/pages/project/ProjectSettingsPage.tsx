import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Save,
  RotateCcw,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { Project } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

export const ProjectSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'matching' | 'reports' | 'danger'>('general');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);

  // Settings form states
  const [autoLinkThreshold, setAutoLinkThreshold] = useState(85);
  const [reviewThreshold, setReviewThreshold] = useState(70);
  const [autoExtractionEnabled, setAutoExtractionEnabled] = useState(true);
  const [notifyOnReview, setNotifyOnReview] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const p = await apiService.getProjectById(projectId);
        setProject(p || null);
      } catch (err) {
        console.error('Failed to load project settings', err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Settings Saved',
      message: 'Project parameters updated successfully.',
    });
  };

  const handleResetDemoData = () => {
    apiService.resetMockData();
    setDangerModalOpen(false);
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Demo Data Reset',
      message: 'Restored verified sample baseline schedule and demo reports.',
    });
    setTimeout(() => window.location.reload(), 1000);
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
          Configure project metadata, semantic matching confidence thresholds, and governance preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
        {[
          { id: 'general', label: 'General Parameters' },
          { id: 'matching', label: 'Matching Thresholds' },
          { id: 'reports', label: 'Ingestion Rules' },
          { id: 'danger', label: 'Danger Zone' },
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
      <div className="glass-card" style={{ padding: '32px' }}>
        {activeTab === 'general' && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                defaultValue={project?.name}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">WBS Package Code</label>
                <input
                  type="text"
                  defaultValue={project?.code}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client Authority</label>
                <input
                  type="text"
                  defaultValue={project?.client}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Location / Site Corridor</label>
                <input
                  type="text"
                  defaultValue={project?.location}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contract Budget</label>
                <input
                  type="text"
                  defaultValue={project?.budget}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        )}

        {activeTab === 'matching' && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Semantic Vector Matching Thresholds
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Determine the boundary percentages for automatic schedule linking versus planner review requirements.
              </p>
            </div>

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
                onChange={(e) => setAutoLinkThreshold(Number(e.target.value))}
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
                onChange={(e) => setReviewThreshold(Number(e.target.value))}
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
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {activeTab === 'danger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
                Reset Prototype Demo Data
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
                Restores the verified 21 Primavera P6 baseline activities from <code>data/baseline_schedule.csv</code>, resets confirmed links, and clears temporary uploads.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setDangerModalOpen(true)}
              >
                <RotateCcw size={16} /> Reset Sample Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dangerModalOpen}
        onClose={() => setDangerModalOpen(false)}
        onConfirm={handleResetDemoData}
        title="Reset Demo Prototype State?"
        message="This will reset all modified matches, newly uploaded reports, and restore the initial verified baseline data. Are you sure you want to proceed?"
        confirmLabel="Yes, Reset Prototype"
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
