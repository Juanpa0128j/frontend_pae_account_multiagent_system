'use client';

import { Box, Paper, Alert, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { moduleAccents } from '@/styles/brutalist';
import TransactionDetailView from '@/components/transactions/TransactionDetail';
import { TransactionDetail } from '@/types';
import { useTransactionDetail } from '@/hooks/useTransactions';

export default function TransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { data: backendTx, isLoading, isError, error } = useTransactionDetail(id, !!id);

    const data: TransactionDetail | null = backendTx
        ? {
              id: backendTx.id,
              raw: {
                  id: backendTx.id,
                  fecha: backendTx.fecha,
                  nit_emisor: backendTx.nit_emisor,
                  nit_receptor: '',
                  concepto: backendTx.concepto,
                  subtotal: 0,
                  iva: 0,
                  total: backendTx.total,
                  tipo_documento: 'otro',
                  archivo_origen: '',
                  status: (String(backendTx.status || 'PENDING').toUpperCase() as TransactionDetail['raw']['status']),
                  created_at: '',
              },
              // clasificacion, impuestos, asiento, agent_trace intentionally omitted —
              // backend does not return them yet.
          }
        : null;

    return (
        <Box>
            <BrutalistPageHero
                eyebrow={`// TX // ${String(id).slice(0, 12).toUpperCase()}`}
                title={<>Detalle<br />transacción.</>}
                subtitle={`#${id}`}
                lede="Datos de la transacción tal como están almacenados en la base de datos."
                accent={moduleAccents.transactions}
                ghostNumber="3"
                action={
                    <BrutalistButton
                        variant="outline"
                        accent={moduleAccents.transactions}
                        size="md"
                        icon={<BackIcon sx={{ fontSize: 16 }} />}
                        onClick={() => router.back()}
                    >
                        Volver
                    </BrutalistButton>
                }
            />

            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
                </Box>
            )}

            {!isLoading && isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    No se pudo cargar la transacción: {error instanceof Error ? error.message : 'error desconocido'}
                </Alert>
            )}

            {!isLoading && !isError && !data && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Transacción no encontrada.
                </Alert>
            )}

            {!isLoading && !isError && data && (
                <TransactionDetailView detail={data} />
            )}
        </Box>
    );
}
