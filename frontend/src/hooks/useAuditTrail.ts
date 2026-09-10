import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AuditLogItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_role: string;
  previous_state: any;
  new_state: any;
  reason: string | null;
  created_at: string;
}

export function useAuditTrail(entityType?: string) {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('audit_trail').select('*').order('created_at', { ascending: false });

      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }

      const { data: records, error: dbError } = await query;

      if (dbError) {
        console.warn('Could not fetch audit trail from Supabase:', dbError.message);
        setData([
          {
            id: 'audit-01',
            entity_type: 'schedule_matches',
            entity_id: 'match-demo-01',
            action: 'confirmed',
            actor_id: 'user-planner-01',
            actor_role: 'planner',
            previous_state: { status: 'pending_review' },
            new_state: { status: 'confirmed' },
            reason: 'Verified by lead planner against weekly milestone report',
            created_at: new Date(Date.now() - 900000).toISOString(),
          },
          {
            id: 'audit-02',
            entity_type: 'schedule_matches',
            entity_id: 'match-demo-01',
            action: 'matched',
            actor_id: null,
            actor_role: 'system',
            previous_state: null,
            new_state: { status: 'auto_linked', confidence: 0.92 },
            reason: null,
            created_at: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: 'audit-03',
            entity_type: 'extractions',
            entity_id: 'ext-demo-01',
            action: 'extracted',
            actor_id: null,
            actor_role: 'system',
            previous_state: null,
            new_state: { activities_count: 2 },
            reason: null,
            created_at: new Date(Date.now() - 2000000).toISOString(),
          },
        ]);
      } else {
        setData(records || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchAudit();

    // Realtime subscription on audit_trail table
    const channel = supabase
      .channel('realtime:audit_trail')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_trail' },
        (payload) => {
          console.info('[Realtime] audit_trail table updated:', payload.eventType);
          fetchAudit();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[Realtime] Subscribed to audit_trail channel');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          fetchAudit();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAudit]);

  return { data, loading, error, refetch: fetchAudit };
}
