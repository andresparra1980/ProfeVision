'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface AdminStats {
  users: {
    total: number;
    new_this_month: number;
    by_tier: {
      free: number;
      plus: number;
      admin: number;
      grandfathered: number;
    };
  };
  exams: {
    total: number;
    created_this_month: number;
    with_results: number;
  };
  scans: {
    total: number;
    this_month: number;
  };
  institutions: {
    total: number;
  };
  groups: {
    total: number;
    active: number;
    archived: number;
  };
  students: {
    total: number;
  };
  ai_jobs: {
    total: number;
    completed: number;
    failed: number;
  };
  trends: {
    users_by_month: Array<{ month: string; count: number }>;
    exams_by_month: Array<{ month: string; count: number }>;
    scans_by_month: Array<{ month: string; count: number }>;
  };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No authenticated');
        return;
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
