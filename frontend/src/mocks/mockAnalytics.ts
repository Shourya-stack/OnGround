import { ProjectAnalytics } from '../lib/types';

export const initialProjectAnalytics: Record<string, ProjectAnalytics> = {
  'proj-01': {
    project_id: 'proj-01',
    reports_processed: 42,
    activities_extracted: 184,
    matched_count: 142,
    review_count: 28,
    unmatched_count: 14,
    match_rate: 77.2,
    review_rate: 15.2,
    confidence_distribution: {
      high: 68,
      medium: 22,
      low: 10,
    },
    ingestion_trends: [
      { date: '2026-09-08', reports: 3, activities: 14 },
      { date: '2026-09-09', reports: 5, activities: 22 },
      { date: '2026-09-10', reports: 4, activities: 18 },
      { date: '2026-09-11', reports: 6, activities: 28 },
      { date: '2026-09-12', reports: 7, activities: 34 },
      { date: '2026-09-13', reports: 5, activities: 24 },
      { date: '2026-09-14', reports: 8, activities: 31 },
      { date: '2026-09-15', reports: 4, activities: 13 },
    ],
    discipline_breakdown: [
      { discipline: 'piping', count: 64, percentage: 35 },
      { discipline: 'electrical', count: 42, percentage: 23 },
      { discipline: 'civil', count: 36, percentage: 20 },
      { discipline: 'instrumentation', count: 24, percentage: 13 },
      { discipline: 'static_rotating_equipment', count: 12, percentage: 6 },
      { discipline: 'hse', count: 6, percentage: 3 },
    ],
  },
};
