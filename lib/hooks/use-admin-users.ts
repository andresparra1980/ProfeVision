'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  stats: {
    entities: number;
    subjects: number;
    groups: number;
    exams: number;
    scans: number;
  };
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UseAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
}

export function useAdminUsers(params: UseAdminUsersParams = {}) {
  const { page = 1, limit = 20, search = '', tier = '' } = params;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminUsersPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No authenticated');
        return;
      }

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(tier && { tier }),
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tier]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, pagination, loading, error, refetch: fetchUsers };
}
