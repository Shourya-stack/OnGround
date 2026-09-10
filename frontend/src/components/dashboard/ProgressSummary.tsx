import { FileText, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

import { KPICard } from '../common/KPICard';
import { ScheduleMatch, ExtractionRecord } from '../../lib/types';

interface ProgressSummaryProps {
  matches: ScheduleMatch[];
  extractions: ExtractionRecord[];
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ matches, extractions }) => {
  const totalMatches = matches.length;
  const autoLinkedCount = matches.filter((m) => m.status === 'auto_linked' || m.status === 'confirmed').length;
  const pendingReviewCount = matches.filter((m) => m.status === 'pending_review').length;
  const autoMatchRate = totalMatches > 0 ? Math.round((autoLinkedCount / totalMatches) * 100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
      <KPICard
        title="Total Reports"
        value={extractions.length}
        subtitle="Ingested this week"
        icon={FileText}
        variant="primary"
      />
      <KPICard
        title="Matched Activities"
        value={totalMatches}
        subtitle="Across all active baselines"
        icon={Layers}
        variant="default"
      />
      <KPICard
        title="Auto-Link Rate"
        value={`${autoMatchRate}%`}
        subtitle="Confidence score ≥ 85%"
        icon={CheckCircle}
        variant="success"
        trend={{ value: '12% vs last cycle', isPositive: true }}
      />
      <KPICard
        title="Needs Review"
        value={pendingReviewCount}
        subtitle="Planner verification required"
        icon={AlertTriangle}
        variant="warning"
      />
    </div>
  );
};
