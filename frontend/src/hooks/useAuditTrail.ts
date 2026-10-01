import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { AuditTrailEntry } from '../lib/types';

export function useAuditTrail(projectId: string, action?: string) {
  const [data, setData] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await apiClient.getAudit({
        project_id: projectId,
        action: action && action !== 'all' ? action : undefined,
      });
      setData(records || []);
    } catch (err: any) {
      console.error('Failed to fetch audit trail from API', err);
      setError(err?.message || 'Failed to fetch audit trail from backend.');
    } finally {
      setLoading(false);
    }
  }, [action, projectId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return { data, loading, error, refetch: fetchAudit };
}
