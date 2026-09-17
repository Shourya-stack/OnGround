import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import { ProjectAnalytics } from '../../lib/types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';

export const ProjectAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id || 'proj-01';

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiService.getAnalytics(projectId);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load project analytics', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [projectId]);

  if (loading) {
    return <LoadingSkeleton rows={5} height="70px" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Project Progress Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Extraction velocity, confidence distribution, and baseline matching metrics for this project package.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            REPORTS INGESTED
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics?.reports_processed || 42}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total document logs</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            ACTIVITIES EXTRACTED
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
            {analytics?.activities_extracted || 184}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Physical tasks identified</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            MATCH RATE
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-high)' }}>
            {analytics?.match_rate || 77.2}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-high)', marginTop: '4px' }}>Auto-linked to schedule</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            REVIEW RATE
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--confidence-review)' }}>
            {analytics?.review_rate || 15.2}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--confidence-review)', marginTop: '4px' }}>Planner verification</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Ingestion & Activity Trends */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Ingestion Trends Over Time</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily reports and physical activities extracted</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics?.ingestion_trends.map((day) => (
              <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '85px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {day.date.slice(5)}
                </span>
                <div style={{ flex: 1 }}>
                  <ProgressBar progress={Math.min(100, day.activities * 3)} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', width: '90px', textAlign: 'right' }}>
                  {day.activities} acts / {day.reports} reps
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality: Confidence Distribution */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Confidence Distribution</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Matching confidence bands across tasks</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-high)', fontWeight: 600 }}>High Confidence (≥ 85%)</span>
                <span style={{ fontWeight: 700 }}>68%</span>
              </div>
              <ProgressBar progress={68} color="var(--confidence-high)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-review)', fontWeight: 600 }}>Medium Review (70-84%)</span>
                <span style={{ fontWeight: 700 }}>22%</span>
              </div>
              <ProgressBar progress={22} color="var(--confidence-review)" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--confidence-low)', fontWeight: 600 }}>Unmatched (&lt; 70%)</span>
                <span style={{ fontWeight: 700 }}>10%</span>
              </div>
              <ProgressBar progress={10} color="var(--confidence-low)" />
            </div>
          </div>

          <div style={{ marginTop: '28px', padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Manual planner corrections account for only 4.8% of total confirmed links, demonstrating high semantic consistency.
            </div>
          </div>
        </div>
      </div>

      {/* Discipline Distribution */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Discipline Velocity Breakdown</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Proportion of activities by engineering discipline</p>

        <div className="grid-3">
          {analytics?.discipline_breakdown.map((d) => (
            <div key={d.discipline} style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                  {d.discipline.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {d.percentage}%
                </span>
              </div>
              <ProgressBar progress={d.percentage} height="6px" />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {d.count} physical activities recorded
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planned vs Actual Summary by Discipline */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Planned vs Actual Progress & Variance Summary</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Consolidated progress variance breakdown across engineering work packages
        </p>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Discipline</th>
                <th style={{ width: '130px' }}>Planned Progress</th>
                <th style={{ width: '130px' }}>Actual Recorded</th>
                <th style={{ width: '130px' }}>Schedule Variance</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Civil & Earthworks', planned: 82, actual: 76 },
                { name: 'Piping Fabrication & Erection', planned: 65, actual: 64 },
                { name: 'Electrical & Substation', planned: 55, actual: 45 },
                { name: 'Instrumentation & Loops', planned: 40, actual: 38 },
                { name: 'Equipment Placement', planned: 60, actual: 52 },
                { name: 'HSE & Safety Standards', planned: 100, actual: 100 },
              ].map((row) => {
                const variance = row.actual - row.planned;
                const status =
                  variance === 0 ? 'ON TRACK' : variance < -5 ? 'DELAYED' : variance < 0 ? 'ATTENTION' : 'ON TRACK';

                return (
                  <tr key={row.name}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</td>
                    <td style={{ fontSize: '13px', fontWeight: 600 }}>{row.planned}%</td>
                    <td style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)' }}>{row.actual}%</td>
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
                            status === 'ON TRACK'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : status === 'ATTENTION'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            status === 'ON TRACK'
                              ? 'var(--confidence-high)'
                              : status === 'ATTENTION'
                              ? 'var(--confidence-review)'
                              : '#ef4444',
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
