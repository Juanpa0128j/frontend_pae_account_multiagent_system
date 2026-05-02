'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CuentaPUC, CuentaPUCRequest, createPuc, getPuc, getPucList, updatePuc } from '@/lib/api';

export const usePucList = (params?: { search?: string; include_inactive?: boolean; limit?: number }) =>
  useQuery({
    queryKey: ['puc', params],
    queryFn: () => getPucList(params),
  });

export const usePuc = (codigo: string) =>
  useQuery({
    queryKey: ['puc', codigo],
    queryFn: () => getPuc(codigo),
  });

export const useCreatePuc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CuentaPUCRequest) => createPuc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puc'] });
    },
  });
};

export const useUpdatePuc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigo, payload }: { codigo: string; payload: CuentaPUCRequest }) =>
      updatePuc(codigo, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puc'] });
    },
  });
};
