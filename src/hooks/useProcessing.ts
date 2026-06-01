'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { ingestApiClient, processApiClient } from '@/lib/api/clients';

/**
 * Hook to poll the status of an asynchronous processing job
 * @param processId - The process ID to monitor
 * @param enabled - Whether to enable polling (default: true)
 * @param refetchInterval - Polling interval in ms (default: 2000)
 * @param timeoutMs - Max elapsed time before giving up on polling (default: 10 min)
 */
export function useProcessStatus(
    processId: string | null | undefined,
    enabled = true,
    refetchInterval = 2000,
    timeoutMs = 10 * 60 * 1000
) {
    const startTimeRef = useRef<Map<string, number>>(new Map());

    return useQuery({
        queryKey: ['processStatus', processId],
        queryFn: () => processApiClient.getProcessStatus(processId!),
        enabled: enabled && !!processId,
        refetchInterval: (query: { state: { data?: { status?: string } } }) => {
            // Stop polling if status is terminal or awaiting user action
            const status = String(query.state.data?.status || '').toLowerCase();
            if (
                status === 'completed' ||
                status === 'failed' ||
                status === 'cancelled' ||
                status === 'pending_audit_review'
            ) {
                return false;
            }

            // Track elapsed time for this processId
            if (processId) {
                const startTimes = startTimeRef.current;
                if (!startTimes.has(processId)) {
                    startTimes.set(processId, Date.now());
                }

                const elapsedMs = Date.now() - (startTimes.get(processId) ?? Date.now());
                if (elapsedMs > timeoutMs) {
                    return false;
                }
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
export function useProcessResult(processId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['processResult', processId],
        queryFn: () => processApiClient.getProcessResult(processId!),
        enabled: enabled && !!processId,
        retry: false,
    });
}

/**
 * Hook to fetch structured process trace information
 * @param processId - The process ID to inspect
 * @param enabled - Whether to enable the query
 */
export function useProcessTrace(processId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['processTrace', processId],
        queryFn: () => processApiClient.getProcessTrace(processId!),
        enabled: enabled && !!processId,
        retry: false,
    });
}

/**
 * Hook to fetch structured ingest trace information
 * @param ingestId - The ingest ID to inspect
 * @param enabled - Whether to enable the query
 */
export function useIngestTrace(ingestId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['ingestTrace', ingestId],
        queryFn: () => ingestApiClient.getIngestTrace(ingestId!),
        enabled: enabled && !!ingestId,
        retry: false,
    });
}

/**
 * Hook to fetch detailed information about an ingest job
 * @param ingestId - The ingest ID to retrieve
 * @param enabled - Whether to enable the query
 */
export function useIngestDetail(ingestId: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['ingestDetail', ingestId],
        queryFn: () => ingestApiClient.getIngestDetail(ingestId!),
        enabled: enabled && !!ingestId,
    });
}

/**
 * Hook to confirm an audit review, force-continuing a paused process job
 */
export function useConfirmAuditReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (processId: string) => ingestApiClient.confirmAuditReview(processId),
        onSuccess: (_, processId) => {
            // Reset instead of invalidate: the query was stopped (refetchInterval=false)
            // because status was pending_audit_review. resetQueries clears the cached
            // status so the refetchInterval callback re-evaluates and resumes polling.
            queryClient.resetQueries({ queryKey: ['processStatus', processId] });
        },
    });
}

/**
 * Polls for process jobs awaiting HITL audit review for the active company.
 * Polls every 15s — low-frequency since this is a background signal.
 */
export function usePendingReviewJobs(companyNit: string | null | undefined) {
    return useQuery({
        queryKey: ['pendingReviewJobs', companyNit],
        queryFn: () => ingestApiClient.getPendingReviewJobs(companyNit!),
        enabled: !!companyNit,
        refetchInterval: 15_000,
        staleTime: 10_000,
    });
}
