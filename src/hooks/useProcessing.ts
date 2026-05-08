'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    confirmAuditReview,
    getProcessStatus,
    getProcessResult,
    getIngestDetail,
    getProcessTrace,
    getIngestTrace,
} from '@/lib/api';

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
        queryFn: () => getProcessResult(processId!),
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
        queryFn: () => getProcessTrace(processId!),
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
        queryFn: () => getIngestTrace(ingestId!),
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
        queryFn: () => getIngestDetail(ingestId!),
        enabled: enabled && !!ingestId,
    });
}

/**
 * Hook to confirm an audit review, force-continuing a paused process job
 */
export function useConfirmAuditReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (processId: string) => confirmAuditReview(processId),
        onSuccess: (_, processId) => {
            // Reset instead of invalidate: the query was stopped (refetchInterval=false)
            // because status was pending_audit_review. resetQueries clears the cached
            // status so the refetchInterval callback re-evaluates and resumes polling.
            queryClient.resetQueries({ queryKey: ['processStatus', processId] });
        },
    });
}
