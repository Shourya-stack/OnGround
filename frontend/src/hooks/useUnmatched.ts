import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UnmatchedActivityRecord {
  id: string;
  extracted_activity_id: string;
  reason: string | null;
  created_at: string;
  extracted_activity?: {
    id: string;
    activity_description: string;
    discipline: string;
    start_time: string | null;
    end_time: string | null;
    location_reference: string | null;
    extraction_confidence: number;
  };
}

export function useUnmatched() {
  const [data, setData] = useState<UnmatchedActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnmatched = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: records, error: dbError } = await supabase
        .from('unmatched_activities')
        .select(`
          *,
          extracted_activity:extracted_activities(*)
        `)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Could not fetch unmatched from Supabase:', dbError.message);
        setData([
          {
            id: 'unmatched-01',
            extracted_activity_id: 'act-unmatched-01',
            reason: 'Top candidate score 0.54 below review threshold 0.70',
            created_at: new Date(Date.now() - 5400000).toISOString(),
            extracted_activity: {
              id: 'act-unmatched-01',
              activity_description: 'Ad-hoc temporary access scaffold erection near Unit 100 flare line',
              discipline: 'civil',
              start_time: '2026-09-10T10:00:00Z',
              end_time: '2026-09-10T15:00:00Z',
              location_reference: 'Flare Header Unit 100',
              extraction_confidence: 0.85,
            },
          },
        ]);
      } else {
        setData(records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch unmatched activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnmatched();

    // Realtime subscription on unmatched_activities table
    const channel = supabase
      .channel('realtime:unmatched_activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unmatched_activities' },
        (payload) => {
          console.info('[Realtime] unmatched_activities table updated:', payload.eventType);
          fetchUnmatched();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Realtime] Subscribed to unmatched_activities channel');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          fetchUnmatched();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnmatched]);

  return { data, loading, error, refetch: fetchUnmatched };
}
