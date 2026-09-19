import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../context/ProjectContext';
import { apiService } from '../../api/apiService';
import { Project, ReportItem, ScheduleMatch, AuditTrailEntry } from '../../lib/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { KPICard } from '../../components/common/KPICard';
import { ScoreDonut } from '../../components/common/ScoreDonut';

function useGreeting(fullName: string) {
  return useMemo(() => {
    const hour = new Date().getHours();
    const firstName = fullName.split(' ')[0] || fullName;
    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 18) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  }, [fullName]);
}

export const PortfolioDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { activeProject, setActiveProjectId } = useProject();
  const navigate = useNavigate();
  const targetProjectId = activeProject?.id || 'proj-01';

  const greeting = useGreeting(profile?.full_name || 'Planner');

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

  const overallHealth = totalMatches > 0 ? Math.round((autoLinkedCount / totalMatches) * 100) : 92;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Header Banner & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-blue)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              COMMAND CENTER
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>• Portfolio Oversight</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Multi-project infrastructure progress intelligence and baseline schedule alignment overview.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link to="/projects/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <FolderPlus size={15} /> New Project
          </Link>
          <Link to={`/projects/${targetProjectId}/reports/upload`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <UploadCloud size={15} /> Upload Daily Log
          </Link>
          <Link to={`/projects/${targetProjectId}/schedule`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <CalendarRange size={15} /> Baseline WBS
          </Link>
          <Link to={`/projects/${targetProjectId}/review`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <GitCompare size={15} /> Review Queue ({pendingReviewCount})
          </Link>
        </div>
      </div>

      {/* 2. Bionis Reference "Overall Wellness" Section -> Adapted to Portfolio Health */}
      <section
        className="bionis-card bionis-card-glow-blue"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '1.5rem 2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--confidence-high)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)' }} />
              PORTFOLIO STABLE
            </span>
            <span className="bionis-insight-badge">
              <Sparkles size={12} color="var(--accent-blue)" />
              {projects.length} Active Sites
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Enterprise Schedule Ingestion & Alignment
          </h2>

          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
            Across all active projects, <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalReports} daily progress logs</strong> have been ingested and reconciled with <strong style={{ color: 'var(--confidence-high)', fontWeight: 600 }}>{autoLinkedCount} automated schedule links</strong>. Only {pendingReviewCount} items currently require human planner confirmation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <ScoreDonut
            value={overallHealth}
            max={100}
            label="Integrity"
            sublabel="Auto-Linked"
            size={120}
            color="var(--accent-blue)"
          />
        </div>
      </section>

      {/* 3. 4 Bionis Key Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KPICard
          title="Active Projects"
          value={projects.length}
          unit="sites"
          icon={FolderGit2}
          variant="primary"
          trend={{
            value: `${projects.length} live`,
            isPositive: true,
            label: 'across all regions',
          }}
        />
        <KPICard
          title="Reports Processed"
          value={totalReports}
          unit="logs"
          icon={FileText}
          variant="info"
          trend={{
            value: 'PDF & Excel',
            isPositive: true,
            label: 'automated OCR/LLM',
          }}
        />
        <KPICard
          title="Activities Matched"
          value={autoLinkedCount}
          unit="tasks"
          icon={CheckCircle2}
          variant="success"
          trend={{
            value: `${overallHealth}%`,
            isPositive: true,
            label: 'semantic certainty',
          }}
        />
        <KPICard
          title="Needs Review"
          value={pendingReviewCount}
          unit="items"
          icon={AlertTriangle}
          variant={pendingReviewCount > 0 ? 'warning' : 'success'}
          trend={{
            value: pendingReviewCount > 0 ? `${pendingReviewCount} pending` : 'Zero backlog',
            isPositive: pendingReviewCount === 0,
            label: pendingReviewCount > 0 ? 'human check required' : 'all verified',
          }}
        />
      </section>

      {/* 4. Main 2-Column Area: Projects & Review Queue */}
      <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Active Project Portfolios */}
        <article className="bionis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Active Project Portfolios
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Select a project to enter its dedicated execution workspace
              </p>
            </div>
            <Link to="/projects" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              View All <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setActiveProjectId(proj.id);
                  navigate(`/projects/${proj.id}/overview`);
                }}
                className="bionis-factor-row"
                style={{
                  cursor: 'pointer',
                  padding: '1rem 1.15rem',
                }}
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {proj.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--accent-blue)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {proj.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Client: {proj.client} • Location: {proj.location}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar progress={proj.progress || 65} height="5px" color="var(--accent-blue)" />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {proj.progress || 65}%
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Right Column: Planner Review Queue & Audit Log */}
        <article className="bionis-card bionis-card-glow-amber" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Pending Review Alerts
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Activities requiring human planner validation
              </p>
            </div>
            <Link
              to={`/projects/${targetProjectId}/review`}
              style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              Open Queue <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {pendingReviewsList.length > 0 ? (
              pendingReviewsList.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Match #{m.id.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--chart-warn)' }}>
                      {Math.round((m.confidence_score ?? 0.75) * 100)}% Match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Extracted task needs planner validation against schedule baseline.
                  </p>
                  <Link
                    to={`/projects/${targetProjectId}/review/${m.id}`}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '4px', textDecoration: 'none' }}
                  >
                    Review Activity →
                  </Link>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                }}
              >
                <CheckCircle2 size={24} color="var(--confidence-high)" style={{ margin: '0 auto 8px auto' }} />
                <span>All matches confirmed across active projects!</span>
              </div>
            )}
          </div>

          {/* Recent Audit Timeline preview */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Recent Audit Events
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {auditLogs.slice(0, 2).map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Action: <strong style={{ color: 'var(--text-primary)' }}>{log.action}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
