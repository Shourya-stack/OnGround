import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarRange,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  GitCompare,
  Activity,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiService } from '../../api/apiService';
import {
  Project,
  ReportItem,
  ScheduleMatch,
  SchedulePlanItem,
  FieldUpdateRecord,
  UnmatchedActivity,
} from '../../lib/types';
import { KPICard } from '../../components/common/KPICard';
import { ScoreDonut } from '../../components/common/ScoreDonut';
import { BionisChartTooltip } from '../../components/common/BionisChartTooltip';
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
  const [unmatched, setUnmatched] = useState<UnmatchedActivity[]>([]);

  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      try {
        const [p, r, m, s, f, u] = await Promise.all([
          apiService.getProjectById(projectId),
          apiService.getReports(projectId),
          apiService.getMatches(projectId),
          apiService.getSchedule(projectId),
          apiService.getFieldUpdates(),
          apiService.getUnmatched(projectId),
        ]);
        setProject(p || null);
        setReports(r);
        setMatches(m);
        setSchedule(s);
        setFieldUpdates(f);
        setUnmatched(u);
      } catch (err) {
        console.error('Failed to load project overview', err);
      } finally {
        setLoading(false);
      }
    };
    loadProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton rows={1} height="120px" />
        <LoadingSkeleton rows={4} height="140px" />
      </div>
    );
  }

  const matchedCount = matches.filter(
    (m) => m.status === 'auto_linked' || m.status === 'confirmed'
  ).length;
  const reviewCount = matches.filter((m) => m.status === 'pending_review').length;
  const pendingReviews = matches.filter((m) => m.status === 'pending_review');

  // Compute Planned vs Actual statistics
  const plannedAvg = schedule.length
    ? Number(
        (
          schedule.reduce((acc, curr) => acc + (curr.planned_progress ?? 0), 0) /
          schedule.length
        ).toFixed(1)
      )
    : 68.2;
  const actualAvg = schedule.length
    ? Number(
        (
          schedule.reduce((acc, curr) => acc + (curr.actual_progress ?? 0), 0) /
          schedule.length
        ).toFixed(1)
      )
    : 64.8;
  const scheduleVariance = Number((actualAvg - plannedAvg).toFixed(1));

  // Health Score Calculation (out of 100)
  const healthScore = Math.min(
    Math.max(Math.round(100 - Math.abs(scheduleVariance) * 2.5 - reviewCount * 2), 60),
    98
  );

  // Discipline Planned vs Actual breakdown
  const disciplineStats = [
    { name: 'Civil & Foundation', planned: 82, actual: 76, color: 'var(--disc-civil)' },
    { name: 'Piping Works', planned: 65, actual: 64, color: 'var(--disc-piping)' },
    { name: 'Electrical & Power', planned: 55, actual: 45, color: 'var(--disc-electrical)' },
    { name: 'Instrumentation & Control', planned: 40, actual: 38, color: 'var(--accent-blue)' },
    { name: 'Equipment Placement', planned: 60, actual: 52, color: 'var(--disc-equip)' },
    { name: 'HSE & Safety Compliance', planned: 100, actual: 100, color: 'var(--confidence-high)' },
  ];

  // 14-day trend mockup data aligned with real schedule/reconciliation
  const trendData = [
    { day: 'Day 1', planned: 52, actual: 51, autoLinked: 7 },
    { day: 'Day 3', planned: 55, actual: 54, autoLinked: 8 },
    { day: 'Day 5', planned: 58, actual: 56, autoLinked: 8 },
    { day: 'Day 7', planned: 61, actual: 59, autoLinked: 9 },
    { day: 'Day 9', planned: 63, actual: 61, autoLinked: 9 },
    { day: 'Day 11', planned: 66, actual: 63, autoLinked: 9 },
    { day: 'Day 14', planned: plannedAvg, actual: actualAvg, autoLinked: matchedCount || 9 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Header & Project Action Bar */}
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
              {project?.code || 'EPC-247'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              • {project?.client || 'Infrastructure Authority'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {project?.name || 'Line 247 EPC Package'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Location: {project?.location || 'Gujarat'} • Budget: {project?.budget || '₹140 Cr'} • Contract: {project?.contract_type || 'EPC Lumpsum'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to={`/projects/${projectId}/reports/upload`}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <UploadCloud size={16} />
            <span>Upload Daily Log</span>
          </Link>
          <Link
            to={`/projects/${projectId}/reconciliation`}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <GitCompare size={16} />
            <span>Reconciliation</span>
          </Link>
        </div>
      </div>

      {/* 2. Bionis Reference "Overall Wellness" Section -> Adapted to Project Health Overview */}
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
                backgroundColor: scheduleVariance >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                color: scheduleVariance >= 0 ? 'var(--confidence-high)' : 'var(--chart-warn)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: scheduleVariance >= 0 ? 'var(--confidence-high)' : 'var(--chart-warn)',
                }}
              />
              {scheduleVariance >= 0 ? 'ON SCHEDULE' : 'MINOR VARIANCE DETECTED'}
            </span>
            <span className="bionis-insight-badge">
              <Sparkles size={12} color="var(--accent-blue)" />
              Automated AI Audit
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Overall Project Execution Health
          </h2>

          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
            Physical execution is tracking at{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{actualAvg}%</strong> against contractual target{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{plannedAvg}%</strong>. Daily progress reports have auto-reconciled{' '}
            <strong style={{ color: 'var(--confidence-high)', fontWeight: 600 }}>{matchedCount} schedule tasks</strong> with sentence-transformer embeddings.
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <ScoreDonut
            value={healthScore}
            max={100}
            label="Health"
            sublabel={`${actualAvg}% Done`}
            size={120}
            color={scheduleVariance >= 0 ? 'var(--confidence-high)' : 'var(--accent-blue)'}
          />
        </div>
      </section>

      {/* 3. 4 Modernized Bionis Key Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KPICard
          title="Physical Progress"
          value={`${actualAvg}%`}
          icon={Activity}
          variant="primary"
          trend={{
            value: scheduleVariance >= 0 ? `+${scheduleVariance}%` : `${scheduleVariance}%`,
            isPositive: scheduleVariance >= 0,
            label: 'vs baseline target',
          }}
        />
        <KPICard
          title="Reconciled Matches"
          value={matchedCount}
          unit="activities"
          icon={CheckCircle2}
          variant="success"
          trend={{
            value: `${Math.round((matchedCount / (schedule.length || 1)) * 100)}%`,
            isPositive: true,
            label: 'schedule covered',
          }}
        />
        <KPICard
          title="Daily Reports"
          value={reports.length}
          unit="logs"
          icon={FileText}
          variant="info"
          trend={{
            value: '+1 today',
            isPositive: true,
            label: 'latest report uploaded',
          }}
        />
        <KPICard
          title="Needs Review"
          value={reviewCount}
          unit="tasks"
          subtitle={`${unmatched.length} in unmatched pool`}
          icon={AlertTriangle}
          variant={reviewCount > 0 ? 'warning' : 'success'}
          trend={{
            value: reviewCount > 0 ? `${reviewCount} pending` : 'All cleared',
            isPositive: reviewCount === 0,
            label: reviewCount > 0 ? 'requires sign-off' : 'verified',
          }}
        />
      </section>

      {/* 4. Dual Section: Activity & Progress Trend Chart + Discipline Factors */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Recharts Trend Area */}
        <article className="bionis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--metric-steps)',
                  color: '#fff',
                }}
              >
                <Activity size={16} />
              </span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Progress Trend & Trajectory
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Planned Schedule baseline vs Actual Physical progress
                </p>
              </div>
            </div>
            <span className="bionis-insight-badge">Last 14 Days</span>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressActualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-steps)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-steps)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="progressPlannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-recovery)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-recovery)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  domain={[40, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={
                    <BionisChartTooltip
                      items={[
                        { label: 'Actual Progress', dataKey: 'actual', formatValue: (v) => `${v}%`, color: 'var(--chart-steps)' },
                        { label: 'Planned Baseline', dataKey: 'planned', formatValue: (v) => `${v}%`, color: 'var(--chart-recovery)' },
                      ]}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--chart-steps)"
                  strokeWidth={2.5}
                  fill="url(#progressActualGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--chart-steps)', stroke: '#0f172a', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="planned"
                  stroke="var(--chart-recovery)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#progressPlannedGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--chart-steps)' }} />
              <span>Actual Execution</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--chart-recovery)' }} />
              <span>Baseline Plan (P6)</span>
            </div>
          </div>
        </article>

        {/* Right: Discipline Variance Factors (Bionis Recovery Factors Pattern) */}
        <article className="bionis-card bionis-card-glow-emerald" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--insight-actions)',
                    color: '#fff',
                  }}
                >
                  <Layers size={16} />
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Discipline Execution Breakdown
                </h3>
              </div>
              <span className="bionis-insight-badge">6 Disciplines</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {disciplineStats.map((d) => {
                const diff = d.actual - d.planned;
                return (
                  <div key={d.name} className="bionis-factor-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div className="bionis-factor-bar-track">
                        <div
                          className="bionis-factor-bar-fill"
                          style={{
                            width: `${d.actual}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', width: '38px', textAlign: 'right' }}>
                        {d.actual}%
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          width: '42px',
                          textAlign: 'right',
                          color: diff < 0 ? 'var(--confidence-low)' : diff > 0 ? 'var(--confidence-high)' : 'var(--text-muted)',
                        }}
                      >
                        {diff > 0 ? `+${diff}%` : `${diff}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target alignment: {scheduleVariance >= 0 ? 'Optimal' : 'Intervention Recommended'}
            </span>
            <Link
              to={`/projects/${projectId}/schedule`}
              style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 500 }}
            >
              View WBS Baseline <ArrowRight size={13} />
            </Link>
          </div>
        </article>
      </section>

      {/* 5. Lower Section: Review Queue Preview & Live Activity Feed */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Review Queue Preview */}
        <article className="bionis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--metric-heart)',
                  color: '#fff',
                }}
              >
                <Clock size={16} />
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Planner Review Queue
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: reviewCount > 0 ? 'var(--chart-warn)' : 'var(--confidence-high)',
                backgroundColor: reviewCount > 0 ? 'var(--chart-warn-bg)' : 'var(--confidence-high-bg)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {reviewCount} Pending
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {pendingReviews.length > 0 ? (
              pendingReviews.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem',
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
                      Match #{item.id.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--chart-warn)' }}>
                      {Math.round((item.confidence_score ?? 0.75) * 100)}% Match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Extracted task needs planner validation against schedule baseline.
                  </p>
                  <Link
                    to={`/projects/${projectId}/review/${item.id}`}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-blue)',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    <Eye size={12} /> Review & Approve
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
                <span>All matches verified! No items awaiting human review.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              to={`/projects/${projectId}/review`}
              style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              Go to Full Review Queue <ArrowRight size={13} />
            </Link>
          </div>
        </article>

        {/* Live Field Observations Feed */}
        <article className="bionis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--metric-sleep)',
                  color: '#fff',
                }}
              >
                <CalendarRange size={16} />
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Recent Field Updates
              </h3>
            </div>
            <Link
              to={`/projects/${projectId}/reports`}
              style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none' }}
            >
              All Reports ({reports.length})
            </Link>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
            <FieldUpdateFeed updates={fieldUpdates} />
          </div>
        </article>
      </section>
    </div>
  );
};
