import React from 'react';
import { ScheduleMatch } from '../../lib/types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';

interface DisciplineBreakdownProps {
  matches: ScheduleMatch[];
}

export const DisciplineBreakdown: React.FC<DisciplineBreakdownProps> = ({ matches }) => {
  const disciplines = ['piping', 'electrical', 'civil', 'instrumentation', 'static_rotating_equipment'];

  const stats = disciplines.map((disc) => {
    const discMatches = matches.filter(
      (m) =>
        m.extracted_activity?.discipline?.toLowerCase() === disc ||
        m.schedule_plan?.discipline?.toLowerCase() === disc
    );
    const count = discMatches.length;
    const avgScore =
      count > 0 ? discMatches.reduce((acc, m) => acc + (m.confidence_score || 0), 0) / count : 0;

    return {
      discipline: disc,
      count,
      avgScore,
      percentage: matches.length > 0 ? Math.round((count / matches.length) * 100) : 0,
    };
  });

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
          Discipline Breakdown
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {matches.length} Total Matched
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {stats.map((s) => (
          <div key={s.discipline} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 500, color: 'var(--color-text)' }}>
                {s.discipline.replace('_', ' ')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  {s.count} activities ({s.percentage}%)
                </span>
                {s.count > 0 && <ConfidenceBadge score={s.avgScore} size="sm" />}
              </div>
            </div>
            <div style={{ height: '6px', background: 'var(--color-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${s.percentage}%`,
                  background: 'var(--color-primary)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
