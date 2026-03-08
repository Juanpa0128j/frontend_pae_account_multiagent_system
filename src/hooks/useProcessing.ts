'use client';

import { useQuery } from '@tanstack/react-query';
import { getProcessStatus, getProcessResult, getIngestDetail } from '@/lib/api';

/**
 * Hook to poll the status of an asynchronous processing job
 * @param processId - The process ID to monitor
 * @param enabled - Whether to enable polling (default: true)
 * @param refetchInterval - Polling interval in ms (default: 2000)
 */
export function useProcessStatus(
  processId: string | null | undefined,
  enabled = true,
  refetchInterval = 2000
) {
  return useQuery({
    queryKey: ['processStatus', processId],
    queryFn: () => getProcessStatus(processId!),
    enabled: enabled && !!processId,
    refetchInterval: (query: { state: { data?: { status?: string } } }) => {
      // Stop polling if status is completed or failed
      const status = String(query.state.data?.status || '').toLowerCase();
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return false;
      }
      return refetchInterval;
    },
  });
}

/**
 * Hook to fetch the final result of a completed processing job
 * @param processId - The process ID to get results for
 * @param enabled - Whether to enable the query
 */
export function useProcessResult(
  processId: string | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ['processResult', processId],
    queryFn: () => getProcessResult(processId!),
    enabled: enabled && !!processId,
    retry: false,
  });
}

/**
 * Hook to fetch detailed information about an ingest job
 * @param ingestId - The ingest ID to retrieve
 * @param enabled - Whether to enable the query
 */
export function useIngestDetail(
  ingestId: string | null | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ['ingestDetail', ingestId],
    queryFn: () => getIngestDetail(ingestId!),
    enabled: enabled && !!ingestId,
  });
}
