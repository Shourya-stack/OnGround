import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarRange,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  GitCompare,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { Project, ReportItem, ScheduleMatch } from '../../lib/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const ProjectOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);

  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      try {
        const [p, r, m] = await Promise.all([
          apiService.getProjectById(projectId),
          apiService.getReports(projectId),
          apiService.getMatches(projectId),
        ]);
        setProject(p || null);
        setReports(r);
        setMatches(m);
      } catch (err) {
        console.error('Failed to load project overview', err);
      } finally {
        setLoading(false);
      }
    };
    loadProjectData();
  }, [projectId]);

  if (loading) {
    return <LoadingSkeleton rows={5} height="70px" />;
  }

  const matchedCount = matches.filter((m) => m.status === 'auto_linked' || m.status === 'confirmed').length;
  const reviewCount = matches.filter((m) => m.status === 'pending_review').length;
  const pendingReviews = matches.filter((m) => m.status === 'pending_review');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {project?.code}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>• {project?.client}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {project?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Location: {project?.location} • Budget: {project?.budget} • Contract: {project?.contract_type}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to={`/projects/${projectId}/reports/upload`} className="btn btn-primary btn-sm">
            <UploadCloud size={15} /> Upload Daily Log
          </Link>
          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-secondary btn-sm">
            <GitCompare size={15} /> Reconciliation Table
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SCHEDULE ACTIVITIES</span>
            <CalendarRange size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>21</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Primavera P6 baseline</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>DAILY REPORTS</span>
            <FileText size={18} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reports.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Ingested site logs</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>MATCHED TASKS</span>
            <CheckCircle2 size={18} style={{ color: 'var(--confidence-high)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-high)' }}>{matchedCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-high)', marginTop: '4px' }}>Linked to baseline</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NEEDS REVIEW</span>
            <AlertTriangle size={18} style={{ color: 'var(--confidence-review)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-review)' }}>{reviewCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-review)', marginTop: '4px' }}>Planner verification queue</div>
        </div>
      </div>

      {/* Middle Grid: Progress Overview & Matching Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Progress Overview Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Project Physical Progress</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>Overall baseline physical progress</p>

          <div style={{ marginBottom: '24px' }}>
            <ProgressBar progress={project?.progress || 68} height="12px" showLabel />
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Discipline Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { disc: 'Piping Works', progress: 74, color: 'var(--disc-piping)' },
              { disc: 'Electrical & Instrumentation', progress: 62, color: 'var(--disc-electrical)' },
              { disc: 'Civil & Foundation', progress: 85, color: 'var(--disc-civil)' },
              { disc: 'Equipment Placement', progress: 48, color: 'var(--disc-equip)' },
            ].map((d) => (
              <div key={d.disc}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.disc}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.progress}%</span>
                </div>
                <ProgressBar progress={d.progress} color={d.color} height="6px" />
              </div>
            ))}
          </div>
        </div>

        {/* Matching Health Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Matching Health</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Reconciliation breakdown</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Auto-Linked (≥ 85%)</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--confidence-high)' }}>{matchedCount} tasks</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-review)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Needs Review (70-84%)</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--confidence-review)' }}>{reviewCount} tasks</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-low)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Unmatched (&lt; 70%)</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--confidence-low)' }}>1 task</span>
            </div>
          </div>

          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '20px' }}>
            Open Full Reconciliation Table
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Pending Reviews & Recent Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Pending Reviews Queue */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pending Review Queue</h2>
            <Link to={`/projects/${projectId}/review`} style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              View Review Hub →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingReviews.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.extracted_activity?.activity_description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Suggested: <strong style={{ color: 'var(--accent-blue)' }}>{m.schedule_plan?.activity_code}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="confidence-badge review">{(m.confidence_score * 100).toFixed(0)}%</span>
                  <Link to={`/projects/${projectId}/review`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Daily Reports */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Reports</h2>
            <Link to={`/projects/${projectId}/reports`} style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              All Reports →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reports.slice(0, 4).map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.file_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {r.uploaded_by} • {r.file_size}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: r.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: r.status === 'completed' ? 'var(--confidence-high)' : 'var(--confidence-review)',
                    textTransform: 'uppercase',
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
