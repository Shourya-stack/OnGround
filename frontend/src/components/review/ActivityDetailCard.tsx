import React from 'react';
import { ExtractedActivity } from '../../lib/types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { Clock, MapPin, Tag } from 'lucide-react';

interface ActivityDetailCardProps {
  activity: ExtractedActivity;
}

export const ActivityDetailCard: React.FC<ActivityDetailCardProps> = ({ activity }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Extracted Physical Activity
          </span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.25rem' }}>
            {activity.activity_description}
          </h3>
        </div>
        <ConfidenceBadge score={activity.extraction_confidence} type="extraction" size="md" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Tag size={16} color="var(--color-primary)" />
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Discipline</div>
            <div style={{ fontWeight: 500, color: 'var(--color-text)', textTransform: 'capitalize' }}>
              {activity.discipline}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <MapPin size={16} color="var(--color-primary)" />
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Location Ref</div>
            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {activity.location_reference || 'Not specified'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Clock size={16} color="var(--color-primary)" />
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Work Window</div>
            <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {activity.start_time ? new Date(activity.start_time).toLocaleTimeString() : 'N/A'} -{' '}
              {activity.end_time ? new Date(activity.end_time).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
