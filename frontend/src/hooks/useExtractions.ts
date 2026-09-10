import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ExtractionRecord } from '../lib/types';

export function useExtractions() {
  const [data, setData] = useState<ExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExtractions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: records, error: dbError } = await supabase
        .from('extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Could not fetch extractions from Supabase:', dbError.message);
        setData([
          {
            id: 'ext-demo-01',
            project_id: 'proj-demo',
            file_url: '/storage/v1/object/reports/piping_daily_01.pdf',
            file_type: 'daily_report',
            status: 'complete',
            uploaded_by: 'Supervisor Dave',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'ext-demo-02',
            project_id: 'proj-demo',
            file_url: '/storage/v1/object/reports/electrical_shift_02.txt',
            file_type: 'daily_report',
            status: 'complete',
            uploaded_by: 'Supervisor Dave',
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      } else {
        setData(records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch extractions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtractions();

    // Setup Supabase Realtime subscription
    const channel = supabase
      .channel('realtime:extractions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'extractions' },
        (payload) => {
          console.info('[Realtime] extractions table updated:', payload.eventType);
          fetchExtractions();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Realtime] Subscribed to extractions channel');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          // Auto recover stale data on reconnection
          fetchExtractions();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExtractions]);

  return { data, loading, error, refetch: fetchExtractions };
}
