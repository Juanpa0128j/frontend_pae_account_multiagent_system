'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationApiClient } from '@/lib/api/clients';

/**
 * Hook to fetch evaluation metrics
 */
export function useEvaluationRun(enabled: boolean = false) {
    return useQuery({
        queryKey: ['evaluation', 'run'],
        queryFn: () => evaluationApiClient.getRun(),
        enabled,
    });
}

/**
 * Hook to fetch detailed schema compliance metrics
 */
export function useSchemaCompliance() {
    return useQuery({
        queryKey: ['evaluation', 'schema-compliance'],
        queryFn: () => evaluationApiClient.getSchemaCompliance(),
    });
}

/**
 * Hook to reset validation metrics (for testing)
 */
export function useResetMetrics() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => evaluationApiClient.resetMetrics(),
        onSuccess: () => {
            // Invalidate evaluation queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['evaluation'] });
        },
    });
}

/**
 * Hook to fetch RAG (vector database) status
 * @param refetchInterval - Optional polling interval in ms
 */
export function useRagStatus(refetchInterval?: number) {
    return useQuery({
        queryKey: ['evaluation', 'rag-status'],
        queryFn: () => evaluationApiClient.getRagStatus(),
        refetchInterval,
    });
}
