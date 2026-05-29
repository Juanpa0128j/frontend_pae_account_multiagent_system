'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApiClient } from '@/lib/api/clients';
import type { CuentaPUC, CuentaPUCRequest } from '@/types';

export const usePucList = (params?: {
    search?: string;
    include_inactive?: boolean;
    limit?: number;
}) =>
    useQuery({
        queryKey: ['puc', params],
        queryFn: () => companyApiClient.getPucList(params),
    });

export const usePuc = (codigo: string) =>
    useQuery({
        queryKey: ['puc', codigo],
        queryFn: () => companyApiClient.getPuc(codigo),
    });

export const useCreatePuc = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CuentaPUCRequest) => companyApiClient.createPuc(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puc'] });
        },
    });
};

export const useUpdatePuc = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ codigo, payload }: { codigo: string; payload: CuentaPUCRequest }) =>
            companyApiClient.updatePuc(codigo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['puc'] });
        },
    });
};
