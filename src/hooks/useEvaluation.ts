'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/clients';
import type { RunResponse, SchemaComplianceMetrics, RAGStatusResponse } from '@/types/api';

const getRun = async (): Promise<RunResponse> => {
    const response = await apiClient.get<RunResponse>('/api/v1/evaluation/run');
    return response.data;
};

const getSchemaCompliance = async (): Promise<SchemaComplianceMetrics> => {
    const response = await apiClient.get<SchemaComplianceMetrics>(
        '/api/v1/evaluation/schema-compliance'
    );
    return response.data;
};

const resetMetrics = async (): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>('/api/v1/evaluation/reset-metrics');
    return response.data;
};

const getRagStatus = async (): Promise<RAGStatusResponse> => {
    const response = await apiClient.get<RAGStatusResponse>('/api/v1/evaluation/rag-status');
    return response.data;
};

/**
 * Hook to fetch evaluation metrics
 */
export function useEvaluationRun(enabled: boolean = false) {
    return useQuery({
        queryKey: ['evaluation', 'run'],
        queryFn: getRun,
        enabled,
    });
}

/**
 * Hook to fetch detailed schema compliance metrics
 */
export function useSchemaCompliance() {
    return useQuery({
        queryKey: ['evaluation', 'schema-compliance'],
        queryFn: getSchemaCompliance,
    });
}

/**
 * Hook to reset validation metrics (for testing)
 */
export function useResetMetrics() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: resetMetrics,
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
        queryFn: getRagStatus,
        refetchInterval,
    });
}
