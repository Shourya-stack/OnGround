import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Clock, XCircle, FileText, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { AnalyticsOut } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const ProjectAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOut | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load project analytics from API', err);
      setError(err?.message || 'Failed to load project analytics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <LoadingSkeleton rows={2} height="40px" />
        <div className="grid-4">
          <LoadingSkeleton rows={1} height="110px" />
          <LoadingSkeleton rows={1} height="110px" />
          <LoadingSkeleton rows={1} height="110px" />
          <LoadingSkeleton rows={1} height="110px" />
        </div>
        <LoadingSkeleton rows={4} height="70px" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAnalytics} />;
  }

  const totalMatches = analytics?.total_matches || 0;
  const autoLinked = analytics?.matches_by_status?.auto_linked || 0;
  const confirmed = analytics?.matches_by_status?.confirmed || 0;
  const pendingReview = analytics?.matches_by_status?.pending_review || 0;
  const rejected = analytics?.matches_by_status?.rejected || 0;

  const totalUnmatched = analytics?.total_unmatched || 0;
  const unresolved = analytics?.unmatched_by_resolution?.unresolved || 0;
  const manuallyLinked = analytics?.unmatched_by_resolution?.manually_linked || 0;
  const markedNew = analytics?.unmatched_by_resolution?.marked_new_activity || 0;

  const autoLinkedPct = totalMatches > 0 ? Math.round((autoLinked / totalMatches) * 100) : 0;
  const confirmedPct = totalMatches > 0 ? Math.round((confirmed / totalMatches) * 100) : 0;
  const pendingReviewPct = totalMatches > 0 ? Math.round((pendingReview / totalMatches) * 100) : 0;
  const rejectedPct = totalMatches > 0 ? Math.round((rejected / totalMatches) * 100) : 0;

  const unresolvedPct = totalUnmatched > 0 ? Math.round((unresolved / totalUnmatched) * 100) : 0;
  const manuallyLinkedPct = totalUnmatched > 0 ? Math.round((manuallyLinked / totalUnmatched) * 100) : 0;
  const markedNewPct = totalUnmatched > 0 ? Math.round((markedNew / totalUnmatched) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Project Progress Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Live aggregate metrics, match distribution, and pipeline health derived directly from the active database state.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadAnalytics}
          disabled={loading}
          title="Refresh analytics metrics"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              REPORTS INGESTED
            </span>
            <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.total_extractions ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total document logs</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              ACTIVITIES EXTRACTED
            </span>
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
            {analytics?.total_extracted_activities ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Physical tasks identified</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              TOTAL MATCHES
            </span>
            <CheckCircle2 size={16} style={{ color: 'var(--confidence-high)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-high)' }}>
            {analytics?.total_matches ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-high)', marginTop: '4px' }}>Evaluated schedule matches</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              AVG MATCH CONFIDENCE
            </span>
            <ShieldCheck size={16} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.average_match_confidence !== null && analytics?.average_match_confidence !== undefined
              ? `${(analytics.average_match_confidence * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Mean confidence score</div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="analytics-grid-2col">
        {/* Match Status Distribution */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Match Status Distribution</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Breakdown of all {totalMatches} schedule matches across lifecycle states
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Auto-Linked (≥ 85%)
                </span>
                <span style={{ fontWeight: 700 }}>
                  {autoLinked} ({autoLinkedPct}%)
                </span>
              </div>
              <ProgressBar progress={autoLinkedPct} color="var(--confidence-high)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Confirmed by Planner
                </span>
                <span style={{ fontWeight: 700 }}>
                  {confirmed} ({confirmedPct}%)
                </span>
              </div>
              <ProgressBar progress={confirmedPct} color="var(--confidence-high)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-review)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Pending Planner Review (70-84%)
                </span>
                <span style={{ fontWeight: 700 }}>
                  {pendingReview} ({pendingReviewPct}%)
                </span>
              </div>
              <ProgressBar progress={pendingReviewPct} color="var(--confidence-review)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={14} /> Rejected
                </span>
                <span style={{ fontWeight: 700 }}>
                  {rejected} ({rejectedPct}%)
                </span>
              </div>
              <ProgressBar progress={rejectedPct} color="#ef4444" />
            </div>
          </div>
        </div>

        {/* Unmatched Resolution Breakdown */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Unmatched Activities Pool</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Resolution status across all {totalUnmatched} low-confidence activities
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-review)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} /> Unresolved
                </span>
                <span style={{ fontWeight: 700 }}>
                  {unresolved} ({unresolvedPct}%)
                </span>
              </div>
              <ProgressBar progress={unresolvedPct} color="var(--confidence-review)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Manually Linked
                </span>
                <span style={{ fontWeight: 700 }}>
                  {manuallyLinked} ({manuallyLinkedPct}%)
                </span>
              </div>
              <ProgressBar progress={manuallyLinkedPct} color="var(--confidence-high)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} /> Marked New Activity
                </span>
                <span style={{ fontWeight: 700 }}>
                  {markedNew} ({markedNewPct}%)
                </span>
              </div>
              <ProgressBar progress={markedNewPct} color="var(--accent-blue)" />
            </div>
          </div>

          <div style={{ marginTop: '28px', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Unmatched activities represent physical site tasks below the 70% threshold that require engineering classification.
            </div>
          </div>
        </div>
      </div>

      {/* System Baseline & Integrity Overview */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>System Operational Totals</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Aggregate counts across all 7 operational tables in the current project database
        </p>

        <div className="grid-3">
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              SCHEDULE BASELINE TASKS
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {analytics?.total_planned_activities ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Planned schedule_plan rows
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              AUDIT LOG TRAIL
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
              {analytics?.total_audit_events ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Immutable audit_trail events
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              UNMATCHED ACTIVITIES
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--confidence-review)' }}>
              {analytics?.total_unmatched ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              unmatched_activities records
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
