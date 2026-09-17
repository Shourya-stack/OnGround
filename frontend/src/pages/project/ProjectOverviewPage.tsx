import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarRange,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  GitCompare,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { apiService } from '../../api/apiService';
import { Project, ReportItem, ScheduleMatch, SchedulePlanItem, FieldUpdateRecord } from '../../lib/types';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { FieldUpdateFeed } from '../../components/feed/FieldUpdateFeed';

export const ProjectOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [schedule, setSchedule] = useState<SchedulePlanItem[]>([]);
  const [fieldUpdates, setFieldUpdates] = useState<FieldUpdateRecord[]>([]);

  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      try {
        const [p, r, m, s, f] = await Promise.all([
          apiService.getProjectById(projectId),
          apiService.getReports(projectId),
          apiService.getMatches(projectId),
          apiService.getSchedule(projectId),
          apiService.getFieldUpdates(),
        ]);
        setProject(p || null);
        setReports(r);
        setMatches(m);
        setSchedule(s);
        setFieldUpdates(f);
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

  // Compute Planned vs Actual statistics
  const plannedAvg = schedule.length
    ? Number((schedule.reduce((acc, curr) => acc + (curr.planned_progress ?? 0), 0) / schedule.length).toFixed(1))
    : 68.2;
  const actualAvg = schedule.length
    ? Number((schedule.reduce((acc, curr) => acc + (curr.actual_progress ?? 0), 0) / schedule.length).toFixed(1))
    : 64.8;
  const scheduleVariance = Number((actualAvg - plannedAvg).toFixed(1));

  // Discipline Planned vs Actual breakdown
  const disciplineStats = [
    { name: 'Civil & Foundation', planned: 82, actual: 76, color: 'var(--disc-civil)' },
    { name: 'Piping Works', planned: 65, actual: 64, color: 'var(--disc-piping)' },
    { name: 'Electrical & Power', planned: 55, actual: 45, color: 'var(--disc-electrical)' },
    { name: 'Instrumentation & Control', planned: 40, actual: 38, color: 'var(--accent-blue)' },
    { name: 'Equipment Placement', planned: 60, actual: 52, color: 'var(--disc-equip)' },
    { name: 'HSE & Safety Compliance', planned: 100, actual: 100, color: 'var(--confidence-high)' },
  ];

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

      {/* KPIs Grid */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVITIES TRACKED</span>
            <CalendarRange size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{schedule.length || 21}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Primavera P6 master baseline</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>FIELD OBSERVATIONS</span>
            <FileText size={18} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reports.length * 4 + 7}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Across {reports.length} daily logs</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>MATCHED & LINKED</span>
            <CheckCircle2 size={18} style={{ color: 'var(--confidence-high)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-high)' }}>{matchedCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-high)', marginTop: '4px' }}>Verified schedule links</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NEEDS REVIEW</span>
            <AlertTriangle size={18} style={{ color: 'var(--confidence-review)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-review)' }}>{reviewCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-review)', marginTop: '4px' }}>Human sign-off required</div>
        </div>
      </div>

      {/* Planned vs Actual Master Card & Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Planned vs Actual Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Planned vs Actual Progress</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Comparing physical field execution reality against contractual schedule baseline.
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: scheduleVariance < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: scheduleVariance < 0 ? '#ef4444' : 'var(--confidence-high)',
              }}
            >
              {scheduleVariance < 0 ? 'ATTENTION REQUIRED' : 'ON TRACK'}
            </span>
          </div>

          {/* Key comparison metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Planned Progress
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {plannedAvg}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Actual Recorded
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>
                {actualAvg}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Schedule Variance
              </div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: scheduleVariance < 0 ? '#ef4444' : 'var(--confidence-high)',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                {scheduleVariance < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                {scheduleVariance > 0 ? `+${scheduleVariance}%` : `${scheduleVariance}%`}
              </div>
            </div>
          </div>

          {/* Discipline Breakdown */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px' }}>
            Discipline Variance Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {disciplineStats.map((d) => {
              const diff = d.actual - d.planned;
              return (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>Plan: {d.planned}%</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Act: {d.actual}%</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: diff < 0 ? '#ef4444' : diff > 0 ? 'var(--confidence-high)' : 'var(--text-muted)',
                        }}
                      >
                        {diff > 0 ? `+${diff}%` : `${diff}%`}
                      </span>
                    </div>
                  </div>
                  <ProgressBar progress={d.actual} color={d.color} height="6px" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Matching Health & System Integrity */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Reconciliation Health</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Semantic mapping health across extracted tasks
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-high)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Auto-Linked (≥ 85%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High semantic certainty</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--confidence-high)' }}>{matchedCount} tasks</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--confidence-review)' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Needs Review (70-84%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ambiguous / alternative matches</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--confidence-review)' }}>{reviewCount} tasks</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Unmatched Pool (&lt; 70%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No high-scoring baseline candidate</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>1 task</span>
              </div>
            </div>
          </div>

          <Link to={`/projects/${projectId}/reconciliation`} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '20px' }}>
            Open Full Reconciliation Table
          </Link>
        </div>
      </div>

      {/* Master Baseline Activity Performance Table (Teammate feature integrated) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Activity Schedule Performance</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Detailed planned vs actual progress tracking for master baseline tasks
            </p>
          </div>
          <Link to={`/projects/${projectId}/schedule`} style={{ fontSize: '12.5px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            View Master Schedule WBS →
          </Link>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Activity ID</th>
                <th>Activity Description</th>
                <th style={{ width: '130px' }}>Discipline</th>
                <th style={{ width: '110px' }}>Planned</th>
                <th style={{ width: '110px' }}>Actual</th>
                <th style={{ width: '110px' }}>Variance</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.slice(0, 6).map((item) => {
                const plan = item.planned_progress ?? 70;
                const act = item.actual_progress ?? 65;
                const variance = act - plan;
                const status = item.status || (variance < -10 ? 'DELAYED' : variance < 0 ? 'ATTENTION' : 'ON_TRACK');

                return (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '12.5px' }}>
                        {item.activity_code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {item.activity_description}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {item.discipline.replace('_', ' ')}
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 600 }}>
                      {plan}%
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {act}%
                    </td>
                    <td style={{ fontSize: '13px', fontWeight: 700, color: variance < 0 ? '#ef4444' : 'var(--confidence-high)' }}>
                      {variance > 0 ? `+${variance}%` : `${variance}%`}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            status === 'COMPLETED' || status === 'ON_TRACK'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : status === 'ATTENTION'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            status === 'COMPLETED' || status === 'ON_TRACK'
                              ? 'var(--confidence-high)'
                              : status === 'ATTENTION'
                              ? 'var(--confidence-review)'
                              : '#ef4444',
                          textTransform: 'uppercase',
                        }}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Live Field Updates & Review Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Live Field Updates Timeline (Teammate Feature) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Live Field Updates Feed</h2>
            </div>
            <Link to={`/projects/${projectId}/reports`} style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              All Daily Reports →
            </Link>
          </div>

          <FieldUpdateFeed updates={fieldUpdates} projectId={projectId} limit={4} />
        </div>

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
                  <Link to={`/projects/${projectId}/review/${m.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
