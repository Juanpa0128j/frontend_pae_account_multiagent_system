'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/api';
import { useCompany } from '@/context/CompanyContext';

export function useDashboardStats(enabled = true) {
  const { activeNit } = useCompany();
  return useQuery({
    queryKey: ['dashboard', 'stats', activeNit],
    queryFn: () => getDashboardStats(activeNit!),
    staleTime: 60 * 1000,
    enabled: enabled && !!activeNit,
  });
}
