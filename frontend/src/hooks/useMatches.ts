import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ScheduleMatch } from '../lib/types';

export function useMatches(disciplineFilter?: string, statusFilter?: string) {
  const [data, setData] = useState<ScheduleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('schedule_matches')
        .select(`
          *,
          extracted_activity:extracted_activities(*),
          schedule_plan:schedule_plan(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: matches, error: dbError } = await query;

      if (dbError) {
        console.warn('Could not fetch matches from Supabase:', dbError.message);
        // Fallback demo mock matches for visual testing
        setData([
          {
            id: 'match-demo-01',
            extracted_activity_id: 'act-01',
            plan_activity_id: 'plan-01',
            confidence_score: 0.92,
            status: 'auto_linked',
            resolved_by: null,
            candidates: null,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            extracted_activity: {
              id: 'act-01',
              extraction_id: 'ext-demo-01',
              activity_description: 'Fit-up and root pass welding of 12-inch CS cooling water line, Unit 200',
              discipline: 'piping',
              start_time: '2026-09-10T08:00:00Z',
              end_time: '2026-09-10T14:30:00Z',
              location_reference: 'Unit 200 - Area B',
              extraction_confidence: 0.95,
              created_at: new Date(Date.now() - 1800000).toISOString(),
            },
            schedule_plan: {
              id: 'plan-01',
              project_id: 'proj-demo',
              activity_code: 'PIP-200-WLD',
              activity_description: 'Piping welding and spool installation Unit 200 cooling system',
              discipline: 'piping',
              planned_start: '2026-09-08',
              planned_end: '2026-09-15',
              created_at: new Date().toISOString(),
            },
          },
          {
            id: 'match-demo-02',
            extracted_activity_id: 'act-02',
            plan_activity_id: 'plan-02',
            confidence_score: 0.78,
            status: 'pending_review',
            resolved_by: null,
            candidates: [
              {
                plan_activity_id: 'plan-02',
                activity_code: 'ELE-SUB3-CAB',
                activity_description: 'Cable tray routing and main power cable pulling in Substation 3',
                score: 0.78,
              },
              {
                plan_activity_id: 'plan-03',
                activity_code: 'ELE-SUB3-TRN',
                activity_description: 'Secondary transformer bus duct cable terminations Substation 3',
                score: 0.74,
              },
            ],
            created_at: new Date(Date.now() - 3600000).toISOString(),
            extracted_activity: {
              id: 'act-02',
              extraction_id: 'ext-demo-02',
              activity_description: 'Cable pulling and tray fitting in Substation 3',
              discipline: 'electrical',
              start_time: '2026-09-10T09:00:00Z',
              end_time: '2026-09-10T17:00:00Z',
              location_reference: 'Substation 3',
              extraction_confidence: 0.88,
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            schedule_plan: {
              id: 'plan-02',
              project_id: 'proj-demo',
              activity_code: 'ELE-SUB3-CAB',
              activity_description: 'Cable tray routing and main power cable pulling in Substation 3',
              discipline: 'electrical',
              planned_start: '2026-09-09',
              planned_end: '2026-09-18',
              created_at: new Date().toISOString(),
            },
          },
        ]);
      } else {
        let filtered: ScheduleMatch[] = (matches as any) || [];
        if (disciplineFilter && disciplineFilter !== 'all') {
          filtered = filtered.filter(
            (m: ScheduleMatch) =>
              m.extracted_activity?.discipline?.toLowerCase() === disciplineFilter.toLowerCase() ||
              m.schedule_plan?.discipline?.toLowerCase() === disciplineFilter.toLowerCase()
          );
        }
        setData(filtered);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedule matches');
    } finally {
      setLoading(false);
    }
  }, [disciplineFilter, statusFilter]);

  useEffect(() => {
    fetchMatches();

    // Setup Supabase Realtime subscription on schedule_matches and extracted_activities
    const channel = supabase
      .channel('realtime:schedule_matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_matches' },
        (payload) => {
          console.info('[Realtime] schedule_matches table updated:', payload.eventType);
          fetchMatches();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'extracted_activities' },
        (payload) => {
          console.info('[Realtime] extracted_activities table updated:', payload.eventType);
          fetchMatches();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Realtime] Subscribed to schedule_matches channel');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          fetchMatches();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  return { data, loading, error, refetch: fetchMatches };
}
