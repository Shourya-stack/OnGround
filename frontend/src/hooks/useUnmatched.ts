import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { UnmatchedActivity } from '../lib/types';

export function useUnmatched() {
  const [data, setData] = useState<UnmatchedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnmatched = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await apiClient.getUnmatched();
      setData(records || []);
    } catch (err: any) {
      console.error('Failed to fetch unmatched activities from API', err);
      setError(err?.message || 'Failed to fetch unmatched activities from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnmatched();
  }, [fetchUnmatched]);

  return { data, loading, error, refetch: fetchUnmatched };
}
