'use client';

import { useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Chip,
    Divider,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Skeleton,
    Stack,
} from '@mui/material';
import {
    Warning as AlertIcon,
    CheckCircle as OkIcon,
    Schedule as ScheduleIcon,
    ExpandMore as ExpandMoreIcon,
    AccountBalance as ICAIcon,
    Receipt as RentaIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import DataTable, { Column } from '@/components/common/DataTable';
import { useIVA, useWithholdings, useICA, useRentaProvision } from '@/hooks/useTax';
import { formatDate } from '@/lib/formatters';

// NIT comes from CompanyContext via useICA / useRentaProvision hooks

interface WithholdingRow {
    date: string;
    type: string;
    amount: number;
    description: string;
}

const MOCK_WITHHOLDINGS: WithholdingRow[] = [
    { date: '2026-02-15', type: 'Retefuente', amount: 52500, description: 'Factura Proveedor XYZ' },
    { date: '2026-02-14', type: 'ReteICA', amount: 10350, description: 'Servicios consultoría' },
    { date: '2026-02-13', type: 'Retefuente', amount: 26250, description: 'Compra insumos' },
    { date: '2026-02-12', type: 'ReteIVA', amount: 15000, description: 'Factura arriendo' },
];

const FISCAL_ALERTS = [
    { tipo: 'IVA bimestral', descripcion: 'Declaración IVA período Ene-Feb 2026', vencimiento: '2026-03-12', urgencia: 'alta' as const },
    { tipo: 'Retención en la fuente', descripcion: 'Declaración mensual Retefuente Feb 2026', vencimiento: '2026-03-18', urgencia: 'media' as const },
    { tipo: 'ICA municipal', descripcion: 'Declaración ReteICA Medellín Q1 2026', vencimiento: '2026-04-15', urgencia: 'baja' as const },
];

const withholdingColumns: Column<WithholdingRow>[] = [
    { key: 'date', label: 'Fecha', width: 100, render: (v) => formatDate(String(v)) },
    {
        key: 'type',
        label: 'Tipo',
        width: 120,
        render: (v) => (
            <Chip size="small" label={String(v)} sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(245,158,11,0.1)', color: 'warning.main' }} />
        ),
    },
    { key: 'description', label: 'Descripción' },
    {
        key: 'amount',
        label: 'Monto',
        align: 'right',
        render: (v) => <MoneyDisplay value={Number(v)} variant="caption" />,
    },
];

// ---------------------------------------------------------------------------
// Tax detail row helper
// ---------------------------------------------------------------------------

function TaxRow({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: highlight ? 0.75 : 0.5,
                borderTop: highlight ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
        >
            <Typography variant="body2" color={highlight ? 'text.primary' : 'text.secondary'} fontWeight={highlight ? 700 : 400}>
                {label}
            </Typography>
            {value}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// ICA card
// ---------------------------------------------------------------------------

function ICACard() {
    const { data, isLoading, isError } = useICA('');

    return (
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ICAIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                <Typography variant="subtitle1" fontWeight={700}>
                    ICA Municipal
                </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {isLoading && (
                <Stack spacing={1}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="text" height={24} />
                    ))}
                </Stack>
            )}

            {isError && (
                <Alert severity="warning" sx={{ fontSize: '0.78rem', borderRadius: 1.5 }}>
                    No se pudo cargar la declaración ICA. Verifica que haya transacciones procesadas.
                </Alert>
            )}

            {data && (
                <>
                    <Stack spacing={0.5}>
                        <TaxRow
                            label="Ingresos brutos"
                            value={<MoneyDisplay value={data.ingresos_brutos} variant="body2" />}
                        />
                        <TaxRow
                            label="Tasa ICA"
                            value={
                                <Typography variant="body2" color="text.secondary">
                                    {(data.tasa_ica * 1000).toFixed(1)}‰
                                </Typography>
                            }
                        />
                        <TaxRow
                            label="ICA a pagar"
                            value={<MoneyDisplay value={data.ica_a_pagar} variant="body1" sx={{ fontWeight: 800 }} />}
                            highlight
                        />
                    </Stack>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Gasto: PUC ${data.cuenta_gasto_puc}`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                        <Chip label={`Pasivo: PUC ${data.cuenta_pasivo_puc}`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                    </Box>

                    <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                            mt: 2,
                            bgcolor: 'transparent',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px !important',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 36, py: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                                Referencias legales ({data.referencias.length})
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {data.referencias.map((ref, i) => (
                                <Typography key={i} variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                    • {ref}
                                </Typography>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                </>
            )}

            {!isLoading && !isError && !data && (
                <Alert severity="info" sx={{ fontSize: '0.78rem', borderRadius: 1.5 }}>
                    Configura el NIT de empresa en <code>NEXT_PUBLIC_COMPANY_NIT</code> para ver este reporte.
                </Alert>
            )}
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Renta provision card
// ---------------------------------------------------------------------------

function RentaProvisionCard() {
    const { data, isLoading, isError } = useRentaProvision('');

    return (
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <RentaIcon sx={{ fontSize: 18, color: '#10B981' }} />
                <Typography variant="subtitle1" fontWeight={700}>
                    Provisión Impuesto de Renta
                </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {isLoading && (
                <Stack spacing={1}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="text" height={24} />
                    ))}
                </Stack>
            )}

            {isError && (
                <Alert severity="warning" sx={{ fontSize: '0.78rem', borderRadius: 1.5 }}>
                    No se pudo cargar la provisión de renta. Verifica que haya transacciones procesadas.
                </Alert>
            )}

            {data && (
                <>
                    <Stack spacing={0.5}>
                        <TaxRow
                            label="Utilidad antes de impuestos"
                            value={<MoneyDisplay value={data.utilidad_antes_impuestos} variant="body2" />}
                        />
                        <TaxRow
                            label="Tasa de renta"
                            value={
                                <Typography variant="body2" color="text.secondary">
                                    {(data.tasa_renta * 100).toFixed(0)}%
                                </Typography>
                            }
                        />
                        <TaxRow
                            label="Provisión renta"
                            value={<MoneyDisplay value={data.provision_renta} variant="body1" sx={{ fontWeight: 800 }} />}
                            highlight
                        />
                    </Stack>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Gasto: PUC ${data.cuenta_gasto_puc}`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                        <Chip label={`Pasivo: PUC ${data.cuenta_pasivo_puc}`} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                    </Box>

                    <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                            mt: 2,
                            bgcolor: 'transparent',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px !important',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 36, py: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                                Referencias legales ({data.referencias.length})
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {data.referencias.map((ref, i) => (
                                <Typography key={i} variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                    • {ref}
                                </Typography>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                </>
            )}

            {!isLoading && !isError && !data && (
                <Alert severity="info" sx={{ fontSize: '0.78rem', borderRadius: 1.5 }}>
                    Configura el NIT de empresa en <code>NEXT_PUBLIC_COMPANY_NIT</code> para ver este reporte.
                </Alert>
            )}
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TaxPage() {
    const { data: ivaData, isLoading: ivaLoading } = useIVA();
    const { data: whData, isLoading: whLoading } = useWithholdings();

    const ivaGenerado = ivaData?.vat_collected ?? 2_483_720;
    const ivaDescontable = ivaData?.vat_paid ?? 892_560;
    const ivaSaldo = ivaData?.vat_balance ?? 1_591_160;

    // Map backend withholdings details to our display rows, fallback to mock
    const withholdingRows: WithholdingRow[] = whData?.details?.length
        ? whData.details.map((d) => ({
              date: d.date,
              type: d.type,
              amount: d.amount,
              description: d.description ?? '',
          }))
        : MOCK_WITHHOLDINGS;

    const URGENCY_COLOR = { alta: '#EF4444', media: '#F59E0B', baja: '#10B981' };

    return (
        <Box>
            <PageHeader
                title="Módulo Tributario"
                subtitle="Consulta el estado de las obligaciones fiscales, retenciones y alertas de vencimiento."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Tributario' }]}
            />

            <Grid container spacing={2.5}>
                {/* IVA Summary */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Resumen IVA — Período actual
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">IVA Generado</Typography>
                                <MoneyDisplay value={ivaGenerado} variant="body2" />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">IVA Descontable</Typography>
                                <MoneyDisplay value={-ivaDescontable} variant="body2" showSign />
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={700} color="text.primary">Saldo a pagar</Typography>
                                <MoneyDisplay value={ivaSaldo} variant="body1" sx={{ fontWeight: 800 }} />
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                mt: 2.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(239,68,68,0.06)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <AlertIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            <Typography variant="caption" color="error.main" fontWeight={600}>
                                Vence 12 Mar 2026 — Queda 21 días
                            </Typography>
                        </Box>

                        {(ivaLoading || whLoading) && (
                            <Alert severity="info" sx={{ mt: 2, fontSize: '0.78rem', borderRadius: 2 }}>
                                Conectando con el backend…
                            </Alert>
                        )}
                    </Paper>
                </Grid>

                {/* Fiscal Alerts */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Alertas Fiscales
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {FISCAL_ALERTS.map((alert) => (
                                <Box
                                    key={alert.tipo}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: `1px solid ${URGENCY_COLOR[alert.urgencia]}30`,
                                        bgcolor: `${URGENCY_COLOR[alert.urgencia]}06`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" fontWeight={700} display="block" color="text.primary">
                                            {alert.tipo}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {alert.descripcion}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                        <Chip
                                            size="small"
                                            label={alert.urgencia.toUpperCase()}
                                            sx={{
                                                height: 18,
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                letterSpacing: '0.08em',
                                                bgcolor: `${URGENCY_COLOR[alert.urgencia]}15`,
                                                color: URGENCY_COLOR[alert.urgencia],
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <ScheduleIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.disabled">
                                                {formatDate(alert.vencimiento)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* ICA Municipal */}
                <Grid item xs={12} md={6}>
                    <ICACard />
                </Grid>

                {/* Provisión Renta */}
                <Grid item xs={12} md={6}>
                    <RentaProvisionCard />
                </Grid>

                {/* Withholdings Table */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <OkIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                                Retenciones practicadas
                            </Typography>
                        </Box>
                        <DataTable
                            columns={withholdingColumns}
                            rows={withholdingRows}
                            rowKey={(_, i) => i}
                            pagination={false}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
