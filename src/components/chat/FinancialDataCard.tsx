'use client';

import React from 'react';
import { Box, Typography, Table, TableBody, TableRow, TableCell } from '@mui/material';
import {
    AccountBalance as BalanceIcon,
    TrendingUp as PnlIcon,
    Savings as CashIcon,
    Receipt as TaxIcon,
    Analytics as RatiosIcon,
    Leaderboard as TopIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import type {
    FinancialDataCard as DataCardType,
    BalanceCardData,
    PnlCardData,
    IvaCardData,
    RatiosCardData,
} from '@/types';
import { palette, fonts, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

const CARD_META: Record<string, { icon: React.ReactNode; accent: string; label: string }> = {
    balance: {
        icon: <BalanceIcon sx={{ fontSize: 14 }} />,
        accent: palette.accent,
        label: 'BALANCE',
    },
    pnl: { icon: <PnlIcon sx={{ fontSize: 14 }} />, accent: palette.success, label: 'PYG' },
    cashflow: { icon: <CashIcon sx={{ fontSize: 14 }} />, accent: palette.amber, label: 'FLUJO' },
    iva: { icon: <TaxIcon sx={{ fontSize: 14 }} />, accent: palette.pink, label: 'IVA' },
    withholdings: {
        icon: <TaxIcon sx={{ fontSize: 14 }} />,
        accent: palette.pink,
        label: 'RETENCIONES',
    },
    ratios: {
        icon: <RatiosIcon sx={{ fontSize: 14 }} />,
        accent: palette.chartreuse,
        label: 'RATIOS',
    },
    top_accounts: {
        icon: <TopIcon sx={{ fontSize: 14 }} />,
        accent: palette.accent,
        label: 'TOP CUENTAS',
    },
    dashboard: {
        icon: <DashboardIcon sx={{ fontSize: 14 }} />,
        accent: palette.chartreuse,
        label: 'DASHBOARD',
    },
    analysis: {
        icon: <RatiosIcon sx={{ fontSize: 14 }} />,
        accent: palette.chartreuse,
        label: 'ANÁLISIS',
    },
};

function formatCOP(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Brutalist row helper
// ---------------------------------------------------------------------------

function DataRow({
    label,
    value,
    color,
    highlight,
}: {
    label: string;
    value: string;
    color?: string;
    highlight?: boolean;
}) {
    return (
        <TableRow>
            <TableCell
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.62rem',
                    color: palette.paperFaint,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: highlight ? 700 : 500,
                    border: 0,
                    py: 0.6,
                    pl: 0,
                }}
            >
                {label}
            </TableCell>
            <TableCell
                align="right"
                sx={{
                    fontFamily: highlight ? fonts.display : fonts.mono,
                    fontSize: highlight ? '1rem' : '0.85rem',
                    fontWeight: highlight ? 700 : 600,
                    color: color ?? palette.paper,
                    letterSpacing: highlight ? '-0.01em' : '0.01em',
                    border: 0,
                    py: 0.6,
                    pr: 0,
                }}
            >
                {value}
            </TableCell>
        </TableRow>
    );
}

function renderBalanceData(data: BalanceCardData) {
    return (
        <Table size="small">
            <TableBody>
                <DataRow label="Activos" value={formatCOP(data.activos)} color={palette.success} />
                <DataRow label="Pasivos" value={formatCOP(data.pasivos)} color={palette.error} />
                <DataRow
                    label="Patrimonio"
                    value={formatCOP(data.patrimonio_total)}
                    color={palette.accent}
                />
                {data.cuadre !== undefined && (
                    <TableRow>
                        <TableCell
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: palette.paperFaint,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                border: 0,
                                py: 0.6,
                                pl: 0,
                            }}
                        >
                            Cuadre
                        </TableCell>
                        <TableCell align="right" sx={{ border: 0, py: 0.6, pr: 0 }}>
                            <Box
                                component="span"
                                sx={{
                                    display: 'inline-block',
                                    px: 0.75,
                                    py: 0.25,
                                    border: `1px solid ${hexAlpha(data.cuadre ? palette.success : palette.error, 0.4)}`,
                                    bgcolor: hexAlpha(
                                        data.cuadre ? palette.success : palette.error,
                                        0.1
                                    ),
                                    fontFamily: fonts.mono,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    color: data.cuadre ? palette.success : palette.error,
                                    letterSpacing: '0.18em',
                                    borderRadius: 0.5,
                                }}
                            >
                                {data.cuadre ? 'OK' : 'DESCUADRE'}
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function renderPnlData(data: PnlCardData) {
    return (
        <Table size="small">
            <TableBody>
                <DataRow
                    label="Ingresos"
                    value={formatCOP(data.total_ingresos)}
                    color={palette.success}
                />
                <DataRow
                    label="Costo ventas"
                    value={formatCOP(data.total_costo_ventas)}
                    color={palette.amber}
                />
                <DataRow
                    label="Gastos"
                    value={formatCOP(data.total_gastos)}
                    color={palette.error}
                />
                <DataRow
                    label="Utilidad neta"
                    value={formatCOP(data.utilidad_neta)}
                    color={data.utilidad_neta >= 0 ? palette.success : palette.error}
                    highlight
                />
            </TableBody>
        </Table>
    );
}

function renderIvaData(data: IvaCardData) {
    return (
        <Table size="small">
            <TableBody>
                <DataRow label="IVA Generado" value={formatCOP(data.iva_generado)} />
                <DataRow label="IVA Descontable" value={formatCOP(data.iva_descontable)} />
                <DataRow
                    label="A pagar"
                    value={formatCOP(data.iva_a_pagar)}
                    color={data.iva_a_pagar > 0 ? palette.error : palette.success}
                    highlight
                />
            </TableBody>
        </Table>
    );
}

function renderRatiosData(data: RatiosCardData) {
    const ratios = [
        {
            label: 'Razón corriente',
            value: data.razon_corriente,
            fmt: (v: number) => v?.toFixed(2),
            good: (v: number) => v > 1.5,
        },
        {
            label: 'Prueba ácida',
            value: data.prueba_acida,
            fmt: (v: number) => v?.toFixed(2),
            good: (v: number) => v > 1.0,
        },
        {
            label: 'Margen neto',
            value: data.margen_neto,
            fmt: (v: number) => `${v?.toFixed(1)}%`,
            good: (v: number) => v > 0,
        },
        {
            label: 'ROA',
            value: data.roa,
            fmt: (v: number) => `${v?.toFixed(1)}%`,
            good: (v: number) => v > 0,
        },
        {
            label: 'Endeudamiento',
            value: data.razon_endeudamiento,
            fmt: (v: number) => formatPercent(v),
            good: (v: number) => v < 0.7,
        },
    ];
    return (
        <Table size="small">
            <TableBody>
                {ratios.map((r) => (
                    <DataRow
                        key={r.label}
                        label={r.label}
                        value={r.value != null ? r.fmt(r.value) : '—'}
                        color={
                            r.value != null
                                ? r.good(r.value)
                                    ? palette.success
                                    : palette.amber
                                : palette.paperGhost
                        }
                    />
                ))}
            </TableBody>
        </Table>
    );
}

function renderGenericData(data: Record<string, unknown>) {
    const entries = Object.entries(data).filter(
        ([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
    );
    if (entries.length === 0) return null;
    const visible = entries.slice(0, 8);
    const remaining = entries.length - visible.length;

    return (
        <Table size="small">
            <TableBody>
                {visible.map(([key, value]) => (
                    <DataRow
                        key={key}
                        label={key.replace(/_/g, ' ')}
                        value={typeof value === 'number' ? formatCOP(value) : String(value)}
                    />
                ))}
                {remaining > 0 && (
                    <TableRow>
                        <TableCell
                            colSpan={2}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                color: palette.paperGhost,
                                letterSpacing: '0.15em',
                                textAlign: 'center',
                                border: 0,
                                py: 0.6,
                                textTransform: 'uppercase',
                            }}
                        >
                            +{remaining} CAMPOS ADICIONALES
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

interface FinancialDataCardProps {
    card: DataCardType;
}

export default function FinancialDataCard({ card }: FinancialDataCardProps) {
    const meta = CARD_META[card.card_type] ?? {
        icon: <DashboardIcon sx={{ fontSize: 14 }} />,
        accent: palette.chartreuse,
        label: card.card_type.toUpperCase(),
    };

    const renderers: Record<string, (data: Record<string, unknown>) => React.ReactNode> = {
        balance: (d) => renderBalanceData(d as unknown as BalanceCardData),
        pnl: (d) => renderPnlData(d as unknown as PnlCardData),
        iva: (d) => renderIvaData(d as unknown as IvaCardData),
        ratios: (d) => renderRatiosData(d as unknown as RatiosCardData),
    };
    const renderFn = renderers[card.card_type] || renderGenericData;

    return (
        <Box
            sx={{
                position: 'relative',
                border: `1px solid ${palette.line}`,
                borderRadius: 0.5,
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.015)',
            }}
        >
            {/* Top accent stripe */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 2,
                    width: 28,
                    bgcolor: meta.accent,
                    boxShadow: `0 0 6px ${meta.accent}`,
                }}
            />

            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1.25,
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                <Box sx={{ color: meta.accent, display: 'flex' }}>{meta.icon}</Box>
                <Typography sx={{ ...sxLabelSmall, color: meta.accent }}>
                    {`// ${meta.label}`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {card.title}
                </Typography>
            </Box>

            {/* Body */}
            <Box sx={{ px: 1.5, py: 1 }}>{renderFn(card.data)}</Box>
        </Box>
    );
}
