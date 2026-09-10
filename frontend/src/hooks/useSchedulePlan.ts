import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SchedulePlanItem } from '../lib/types';

export function useSchedulePlan(disciplineFilter?: string) {
  const [data, setData] = useState<SchedulePlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('schedule_plan').select('*').order('activity_code', { ascending: true });

      if (disciplineFilter && disciplineFilter !== 'all') {
        query = query.eq('discipline', disciplineFilter);
      }

      const { data: records, error: dbError } = await query;

      if (dbError) {
        console.warn('Could not fetch schedule_plan from Supabase:', dbError.message);
        setData([
          {
            id: 'plan-01',
            project_id: 'proj-demo',
            activity_code: 'PIP-200-WLD',
            activity_description: 'Piping welding and spool installation Unit 200 cooling system',
            discipline: 'piping',
            planned_start: '2026-09-08',
            planned_end: '2026-09-15',
            created_at: new Date().toISOString(),
          },
          {
            id: 'plan-02',
            project_id: 'proj-demo',
            activity_code: 'ELE-SUB3-CAB',
            activity_description: 'Cable tray routing and main power cable pulling in Substation 3',
            discipline: 'electrical',
            planned_start: '2026-09-09',
            planned_end: '2026-09-18',
            created_at: new Date().toISOString(),
          },
          {
            id: 'plan-03',
            project_id: 'proj-demo',
            activity_code: 'CIV-PMP-FND',
            activity_description: 'Foundation excavation and concrete rebar cage for main pump house',
            discipline: 'civil',
            planned_start: '2026-09-05',
            planned_end: '2026-09-12',
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        setData(records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schedule plan');
    } finally {
      setLoading(false);
    }
  }, [disciplineFilter]);

  useEffect(() => {
    fetchPlan();

    // Realtime subscription on schedule_plan table
    const channel = supabase
      .channel('realtime:schedule_plan')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedule_plan' },
        (payload) => {
          console.info('[Realtime] schedule_plan table updated:', payload.eventType);
          fetchPlan();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Realtime] Subscribed to schedule_plan channel');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          fetchPlan();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlan]);

  return { data, loading, error, refetch: fetchPlan };
}
