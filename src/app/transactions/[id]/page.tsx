'use client';

import { Box, Button, Paper, Alert, Skeleton, Typography } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { moduleAccents } from '@/styles/brutalist';
import TransactionDetailView from '@/components/transactions/TransactionDetail';
import { TransactionDetail } from '@/types';
import { useTransactionDetail } from '@/hooks/useTransactions';

// Mock detail for demo purposes — replace with real API call when available
const MOCK_DETAIL: TransactionDetail = {
    id: '1042',
    raw: {
        id: '1042',
        fecha: '2026-02-15',
        nit_emisor: '9001234561',
        nit_receptor: '8002345672',
        concepto: 'Factura Proveedor XYZ — Servicios de mantenimiento',
        subtotal: 1260504,
        iva: 239496,
        total: 1500000,
        tipo_documento: 'factura',
        archivo_origen: 'factura_proveedor_xyz_20260215.pdf',
        status: 'POSTED',
        created_at: '2026-02-15T10:30:00Z',
    },
    clasificacion: {
        cuenta_puc: '5195',
        nombre_cuenta: 'Gastos diversos',
        justificacion: 'Clasifiqué como cuenta 5195 "Gastos Diversos" basado en el historial de transacciones similares con este proveedor (NIT 900.123.456) y la naturaleza del concepto: servicios de mantenimiento que no corresponden a una cuenta más específica del plan PUC.',
        fuente: 'historico',
    },
    impuestos: {
        retefuente: 52500,
        reteica: 10350,
        iva_generado: 239496,
        iva_descontable: 0,
        referencia_normativa: 'Art. 383 ET',
    },
    asiento: [
        { cuenta_puc: '5195', nombre_cuenta: 'Gastos diversos', debito: 1260504, credito: 0, tercero_nit: '900.123.456-1' },
        { cuenta_puc: '2408', nombre_cuenta: 'IVA por pagar', debito: 0, credito: 239496, tercero_nit: '900.123.456-1' },
        { cuenta_puc: '2365', nombre_cuenta: 'Retefuente por pagar', debito: 0, credito: 52500, tercero_nit: '900.123.456-1' },
        { cuenta_puc: '2368', nombre_cuenta: 'ReteICA por pagar', debito: 0, credito: 10350, tercero_nit: '900.123.456-1' },
        { cuenta_puc: '2205', nombre_cuenta: 'Cuentas por pagar proveedores', debito: 0, credito: 1197654, tercero_nit: '900.123.456-1' },
    ],
    partida_doble_ok: true,
    agent_trace: [
        { agente: 'Supervisor', accion: 'Asignar tarea al Agente de Ingesta', resultado: 'success', duracion_ms: 120, detalle: 'Documento recibido. Asignando al pipeline de ingesta para extracción de datos estructurados.' },
        { agente: 'Ingesta', accion: 'Extraer datos del PDF con OCR', resultado: 'success', duracion_ms: 840, detalle: 'Extracción completada. NIT emisor: 900.123.456-1, Fecha: 2026-02-15, Total: $1.500.000. Confianza OCR: 98.3%' },
        { agente: 'Contador', accion: 'Clasificar cuenta PUC y generar asiento', resultado: 'success', duracion_ms: 1200, detalle: 'Clasifiqué como 5195 "Gastos Diversos" usando el historial de 12 transacciones previas con este proveedor. Generé 5 líneas de asiento contable.' },
        { agente: 'Tributario', accion: 'Calcular Retefuente, ReteICA e IVA', resultado: 'success', duracion_ms: 950, detalle: 'Apliqué Art. 383 ET para Retefuente (3.5% sobre base $1.500.000 = $52.500). ReteICA según municipio Medellín (8.2‰). IVA generado: $239.496.' },
        { agente: 'Auditor', accion: 'Verificar partida doble y compliance', resultado: 'success', duracion_ms: 310, detalle: 'Verificación completada. Débitos ($1.260.504) = Créditos ($1.260.504). Partida doble cuadra. Asiento aprobado para posting.' },
    ],
};

export default function TransactionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { data: backendTx, isLoading, isError } = useTransactionDetail(id, !!id);

    const data: TransactionDetail = backendTx
        ? {
              ...MOCK_DETAIL,
              id: backendTx.id,
              raw: {
                  ...MOCK_DETAIL.raw,
                  id: backendTx.id,
                  fecha: backendTx.fecha,
                  nit_emisor: backendTx.nit_emisor,
                  concepto: backendTx.concepto,
                  total: backendTx.total,
                  status: (String(backendTx.status || 'PENDING').toUpperCase() as TransactionDetail['raw']['status']),
              },
          }
        : { ...MOCK_DETAIL, id };

    return (
        <Box>
            <BrutalistPageHero
                eyebrow={`// TX // ${String(id).slice(0, 12).toUpperCase()}`}
                title={<>Detalle<br />transacción.</>}
                subtitle={`#${id}`}
                lede="Datos crudos del documento, clasificación PUC con justificación, cálculos tributarios y log cronológico de los agentes."
                accent={moduleAccents.transactions}
                ghostNumber="04"
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

            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }} />
                </Box>
            ) : data ? (
                <TransactionDetailView detail={data} />
            ) : (
                <Alert severity="warning">Transacción no encontrada</Alert>
            )}

            {isError && (
                <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)', bgcolor: 'rgba(245,158,11,0.06)' }}>
                    <Alert severity="warning">No se pudo cargar el detalle real del backend. Mostrando datos de referencia.</Alert>
                </Paper>
            )}
        </Box>
    );
}
