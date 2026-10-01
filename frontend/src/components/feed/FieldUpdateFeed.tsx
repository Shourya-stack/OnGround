import React from 'react';
import { FieldUpdateRecord } from '../../lib/types';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight } from 'lucide-react';

interface FieldUpdateFeedProps {
  updates: FieldUpdateRecord[];
  projectId: string;
  limit?: number;
}

export const FieldUpdateFeed: React.FC<FieldUpdateFeedProps> = ({ updates, projectId, limit = 5 }) => {
  const displayUpdates = limit ? updates.slice(0, limit) : updates;

  if (!displayUpdates || displayUpdates.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
        No field updates captured yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {displayUpdates.map((item) => {
        const isLinked = item.state === 'LINKED';

        return (
          <div
            key={item.id}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Header: Source, Time, Discipline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--accent-blue)',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.source}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  • {item.discipline}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Clock size={11} />
                <span>{item.time} ({item.date.slice(5)})</span>
              </div>
            </div>

            {/* Body: Observation text */}
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.45 }}>
              "{item.text}"
            </div>

            {/* Footer: Location, Link state, Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <MapPin size={11} style={{ color: 'var(--accent-blue)' }} /> {item.location}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isLinked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: isLinked ? 'var(--confidence-high)' : 'var(--confidence-review)',
                    textTransform: 'uppercase',
                  }}
                >
                  {isLinked ? 'LINKED' : 'AWAITING REVIEW'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Conf: {item.confidence}%
                </span>
              </div>

              <Link
                to={isLinked ? `/projects/${projectId}/reconciliation` : `/projects/${projectId}/review`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                }}
              >
                <span>{isLinked ? 'Inspect' : 'Review Match'}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};
