import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  FileText,
  GitCompare,
  AlertTriangle,
  FolderPlus,
  UploadCloud,
  CalendarRange,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../context/ProjectContext';
import { apiService } from '../../api/apiService';
import { Project, ReportItem, ScheduleMatch, AuditTrailEntry } from '../../lib/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const PortfolioDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { setActiveProjectId } = useProject();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrailEntry[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [projData, repData, matchData, auditData] = await Promise.all([
          apiService.getProjects(),
          apiService.getReports(),
          apiService.getMatches(),
          apiService.getAuditTrail(),
        ]);
        setProjects(projData);
        setReports(repData);
        setMatches(matchData);
        setAuditLogs(auditData);
      } catch (err) {
        console.error('Failed to load portfolio dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSkeleton rows={6} height="70px" />;
  }

  // Aggregated KPIs
  const totalReports = reports.length;
  const totalMatches = matches.length;
  const autoLinkedCount = matches.filter((m) => m.status === 'auto_linked' || m.status === 'confirmed').length;
  const pendingReviewCount = matches.filter((m) => m.status === 'pending_review').length;
  const pendingReviewsList = matches.filter((m) => m.status === 'pending_review');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600 }}>EXECUTIVE COMMAND CENTER</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Good morning, {profile?.full_name?.split(' ')[0] || 'Planner'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Multi-project infrastructure progress reconciliation and baseline schedule alignment overview.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/projects/new" className="btn btn-primary btn-sm">
            <FolderPlus size={15} /> New Project
          </Link>
          <Link to="/projects/proj-01/reports/upload" className="btn btn-secondary btn-sm">
            <UploadCloud size={15} /> Upload Daily Log
          </Link>
          <Link to="/projects/proj-01/schedule" className="btn btn-secondary btn-sm">
            <CalendarRange size={15} /> Import Schedule
          </Link>
          <Link to="/projects/proj-01/review" className="btn btn-secondary btn-sm">
            <GitCompare size={15} /> Review Matches ({pendingReviewCount})
          </Link>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE PROJECTS</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)' }}>
              <FolderGit2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{projects.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across 3 industrial zones</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>REPORTS PROCESSED</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalReports}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-high)', marginTop: '4px' }}>PDF, XLSX, CSV & TXT</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVITIES MATCHED</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--confidence-high)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--confidence-high)' }}>{autoLinkedCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Linked to Primavera WBS</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NEEDS HUMAN REVIEW</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--confidence-review)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--confidence-review)' }}>{pendingReviewCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-review)', marginTop: '4px' }}>Awaiting planner confirmation</div>
        </div>
      </div>

      {/* 3. Main 2-Column Area: Projects & Reconciliation Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Left Column: Recent Projects */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Active Project Portfolios</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Click to enter dedicated project workspace</p>
            </div>
            <Link to="/projects" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-blue)' }}>
              View All Projects <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveProjectId(proj.id);
                  navigate(`/projects/${proj.id}/overview`);
                }}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {proj.name}
                    </h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      {proj.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Client: {proj.client} • {proj.location} • Budget: {proj.budget}
                  </div>
                  <div style={{ maxWidth: '320px' }}>
                    <ProgressBar progress={proj.progress} showLabel />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {proj.matched_count} / {proj.activities_count}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasks Reconciled</div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Reconciliation Health */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Reconciliation Health
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Overall task reconciliation status across all ingested reports
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Health Bars */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600 }}>Matched & Confirmed</span>
                <span style={{ fontWeight: 700 }}>{autoLinkedCount} ({totalMatches ? Math.round((autoLinkedCount / totalMatches) * 100) : 0}%)</span>
              </div>
              <ProgressBar progress={totalMatches ? Math.round((autoLinkedCount / totalMatches) * 100) : 0} color="var(--confidence-high)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-review)', fontWeight: 600 }}>Needs Review</span>
                <span style={{ fontWeight: 700 }}>{pendingReviewCount} ({totalMatches ? Math.round((pendingReviewCount / totalMatches) * 100) : 0}%)</span>
              </div>
              <ProgressBar progress={totalMatches ? Math.round((pendingReviewCount / totalMatches) * 100) : 0} color="var(--confidence-review)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-low)', fontWeight: 600 }}>Unmatched</span>
                <span style={{ fontWeight: 700 }}>1 (7%)</span>
              </div>
              <ProgressBar progress={7} color="var(--confidence-low)" />
            </div>
          </div>

          <div style={{ marginTop: '28px', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Reconciliation Tip</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Resolving the {pendingReviewCount} pending review candidates will raise overall baseline schedule alignment.
            </p>
            <Link to="/projects/proj-01/review" className="btn btn-primary btn-sm" style={{ marginTop: '10px', width: '100%' }}>
              Open Review Queue
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Area: Pending Reviews & Recent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Pending Reviews Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pending Reviews Queue</h2>
            <Link to="/projects/proj-01/review" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              View Queue →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingReviewsList.slice(0, 3).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.extracted_activity?.activity_description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Suggested: <strong style={{ color: 'var(--accent-blue)' }}>{item.schedule_plan?.activity_code}</strong> • {item.schedule_plan?.activity_description?.slice(0, 45)}...
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="confidence-badge review">{(item.confidence_score * 100).toFixed(1)}%</span>
                  <Link to={`/projects/proj-01/review`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Audit Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent System Activity</h2>
            <Link to="/projects/proj-01/audit" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              Full Audit Trail →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
                <div style={{ padding: '4px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', marginTop: '2px' }}>
                  <Clock size={14} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{log.actor || 'System'}</span>{' '}
                    {log.action === 'confirmed' ? 'confirmed schedule link' : log.action === 'flagged' ? 'flagged activity for review' : 'auto-linked activity'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Confidence: {((log.confidence_score || 0.9) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
