'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Skeleton,
    Tooltip,
    Grid,
    Stack,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Drawer,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    FileDownload as DownloadIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    AccountBalance as BalanceIcon,
    TrendingUp as PnLIcon,
    Waves as CashFlowIcon,
    HourglassEmpty as ProcessingIcon,
    BarChart as ChartIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { BrutalistPageHero } from '@/components/brutalist';
import { palette, fonts, sxLabel, hexAlpha, moduleAccents } from '@/styles/brutalist';
import dynamic from 'next/dynamic';

const FinancialChart = dynamic(() => import('@/components/reports/FinancialChart'), {
    ssr: false,
    loading: () => (
        <Box
            sx={{
                height: 280,
                bgcolor: 'rgba(255,255,255,0.02)',
                borderRadius: 1,
            }}
        />
    ),
});
import {
    useBalance,
    useProfitAndLoss,
    useCashFlow,
    useStatements,
    useInvalidateStatements,
} from '@/hooks/useReports';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import { formatCOP } from '@/lib/formatters';
import { downloadReportExport, downloadStatementExport } from '@/lib/api';
import type { FinancialStatementResponse, ReportExportFormat } from '@/lib/api';
import { downloadBlob, downloadJson } from '@/lib/downloadFile';

const SOURCE_MODE_CONFIG: Record<
    string,
    { label: string; color: 'primary' | 'success' | 'secondary' | 'default' }
> = {
    direct: { label: 'Directo', color: 'primary' },
    derived: { label: 'Derivado', color: 'success' },
    derived_from_journal: { label: 'Desde diario', color: 'secondary' },
};

const STATEMENT_LABELS: Record<string, string> = {
    balance_general: 'Balance General',
    estado_resultados: 'Estado de Resultados',
    libro_auxiliar: 'Libro Auxiliar',
    libro_diario: 'Libro Diario',
    flujo_de_caja: 'Flujo de Caja',
    cambios_patrimonio: 'Cambios en el Patrimonio',
    notas_estados_financieros: 'Notas a los EEFF',
};

type StatementExportType =
    | 'balance'
    | 'pnl'
    | 'cashflow'
    | 'libro_diario'
    | 'libro_auxiliar'
    | 'cambios_patrimonio'
    | 'notas_estados_financieros';

const EXPORTABLE_STATEMENT_TYPES: Partial<
    Record<FinancialStatementResponse['statement_type'], StatementExportType>
> = {
    balance_general: 'balance',
    estado_resultados: 'pnl',
    flujo_de_caja: 'cashflow',
    libro_diario: 'libro_diario',
    libro_auxiliar: 'libro_auxiliar',
    cambios_patrimonio: 'cambios_patrimonio',
    notas_estados_financieros: 'notas_estados_financieros',
};

// ---------------------------------------------------------------------------
// Report summary card — brutalist
// ---------------------------------------------------------------------------

function ReportSummaryCard({
    title,
    icon,
    accentColor,
    hasData,
    isLoading,
    isError,
    onViewChart,
    onDownload,
    cardIndex,
}: {
    title: string;
    icon: React.ReactNode;
    accentColor: string;
    hasData: boolean;
    isLoading: boolean;
    isError?: boolean;
    onViewChart: () => void;
    onDownload?: () => void;
    cardIndex: number;
}) {
    const statusTag = isLoading
        ? '// CARGANDO'
        : isError
          ? '// ERROR'
          : hasData
            ? '// DISPONIBLE'
            : '// SIN DATOS';
    const statusColor = isError ? palette.error : hasData ? accentColor : palette.paperFaint;

    return (
        <Box
            sx={{
                position: 'relative',
                border: `1px solid ${isError ? hexAlpha(palette.error, 0.35) : hasData ? hexAlpha(accentColor, 0.35) : palette.line}`,
                p: 2.5,
                overflow: 'hidden',
            }}
        >
            {/* Loading top bar */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        bgcolor: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`,
                        opacity: 0.85,
                    }}
                />
            )}

            {/* Section label */}
            <Typography sx={{ ...sxLabel, fontSize: '0.62rem', color: palette.paperFaint, mb: 1 }}>
                // {cardIndex} / REPORTE
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                <Box sx={{ color: isError ? palette.error : accentColor, mt: 0.25 }}>{icon}</Box>
                <Box sx={{ flex: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: palette.paper,
                            lineHeight: 1.2,
                        }}
                    >
                        {title}
                    </Typography>
                    {/* Monospace status badge */}
                    <Typography
                        sx={{
                            ...sxLabel,
                            fontSize: '0.62rem',
                            color: statusColor,
                            mt: 0.5,
                        }}
                    >
                        {statusTag}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {/* Ver gráfico — flat monospace button */}
                <Box
                    component="button"
                    type="button"
                    onClick={onViewChart}
                    disabled={!hasData || isLoading || Boolean(isError)}
                    sx={{
                        flex: 1,
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: hasData && !isError ? accentColor : palette.paperFaint,
                        bgcolor: 'transparent',
                        border: `1px solid ${hasData && !isError ? hexAlpha(accentColor, 0.4) : palette.line}`,
                        py: 0.9,
                        px: 1.5,
                        cursor: hasData && !isLoading && !isError ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        transition: 'all 0.18s',
                        '&:hover:not(:disabled)': {
                            borderColor: accentColor,
                            boxShadow: `0 0 8px ${accentColor}`,
                        },
                    }}
                >
                    <ChartIcon sx={{ fontSize: 14 }} />
                    VER GRÁFICO
                </Box>

                {onDownload && (
                    <Tooltip title="Descargar JSON">
                        <IconButton
                            size="small"
                            onClick={onDownload}
                            disabled={!hasData || isLoading || Boolean(isError)}
                            sx={{ color: palette.paperFaint, '&:hover': { color: accentColor } }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Financial statement structured viewer
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared rendering primitives
// ---------------------------------------------------------------------------

const CELL = { fontSize: '0.78rem', py: 0.5 };
const PUC_CELL = { fontSize: '0.7rem', py: 0.5, color: 'text.secondary', fontFamily: 'monospace' };

function SectionHeader({
    children,
    color = '#6366F1',
}: {
    children: React.ReactNode;
    color?: string;
}) {
    return (
        <Typography
            variant="caption"
            fontWeight={700}
            sx={{
                color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                mt: 2,
                mb: 0.5,
            }}
        >
            {children}
        </Typography>
    );
}

function SummaryRow({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: number | null | undefined;
    highlight?: boolean;
}) {
    const v = Number(value ?? 0);
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: highlight ? 0.75 : 0.4,
                borderTop: highlight ? '1px solid rgba(255,255,255,0.1)' : 'none',
                mt: highlight ? 1 : 0,
            }}
        >
            <Typography
                variant={highlight ? 'subtitle2' : 'body2'}
                fontWeight={highlight ? 700 : 400}
                color={highlight ? 'text.primary' : 'text.secondary'}
            >
                {label}
            </Typography>
            <Typography
                variant={highlight ? 'subtitle1' : 'body2'}
                fontWeight={highlight ? 800 : 500}
                color={v >= 0 ? 'success.main' : 'error.main'}
            >
                {formatCOP(v)}
            </Typography>
        </Box>
    );
}

/** Generic table for accounts[] / lines[] — detects available columns automatically */
function AccountsTable({ items }: { items: Record<string, any>[] }) {
    if (!items?.length) return null;
    const first = items[0];
    const hasPUC = 'cuenta_puc' in first || 'account' in first;
    const hasNombre = 'nombre' in first || 'name' in first;
    const hasSaldo = 'saldo' in first || 'net_balance' in first;
    const hasDebito = 'debito' in first || 'total_debit' in first;
    const hasCredito = 'credito' in first || 'total_credit' in first;
    const hasFecha = 'fecha' in first;
    const hasDetalle = 'detalle' in first || 'descripcion' in first;

    return (
        <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        {hasFecha && (
                            <TableCell
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Fecha
                            </TableCell>
                        )}
                        {hasPUC && (
                            <TableCell
                                sx={{ ...PUC_CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                PUC
                            </TableCell>
                        )}
                        {hasNombre && (
                            <TableCell
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Nombre
                            </TableCell>
                        )}
                        {hasDetalle && (
                            <TableCell
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Concepto
                            </TableCell>
                        )}
                        {hasDebito && (
                            <TableCell
                                align="right"
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Débito
                            </TableCell>
                        )}
                        {hasCredito && (
                            <TableCell
                                align="right"
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Crédito
                            </TableCell>
                        )}
                        {hasSaldo && (
                            <TableCell
                                align="right"
                                sx={{ ...CELL, fontWeight: 700, bgcolor: 'background.paper' }}
                            >
                                Saldo
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((row, i) => {
                        const saldo = Number(row.saldo ?? row.net_balance ?? 0);
                        const debito = Number(row.debito ?? row.total_debit ?? 0);
                        const credito = Number(row.credito ?? row.total_credit ?? 0);
                        const puc = row.cuenta_puc ?? row.account ?? '';
                        const nombre = row.nombre ?? row.name ?? '';
                        const fecha = row.fecha ? String(row.fecha).split('T')[0] : '';
                        const detalle = row.detalle ?? row.descripcion ?? '';
                        return (
                            <TableRow key={i} hover>
                                {hasFecha && <TableCell sx={CELL}>{fecha}</TableCell>}
                                {hasPUC && <TableCell sx={PUC_CELL}>{puc}</TableCell>}
                                {hasNombre && <TableCell sx={CELL}>{nombre}</TableCell>}
                                {hasDetalle && (
                                    <TableCell sx={{ ...CELL, color: 'text.secondary' }}>
                                        {detalle}
                                    </TableCell>
                                )}
                                {hasDebito && (
                                    <TableCell
                                        align="right"
                                        sx={{
                                            ...CELL,
                                            color: debito ? 'text.primary' : 'text.disabled',
                                        }}
                                    >
                                        {debito ? formatCOP(debito) : '—'}
                                    </TableCell>
                                )}
                                {hasCredito && (
                                    <TableCell
                                        align="right"
                                        sx={{
                                            ...CELL,
                                            color: credito ? 'text.primary' : 'text.disabled',
                                        }}
                                    >
                                        {credito ? formatCOP(credito) : '—'}
                                    </TableCell>
                                )}
                                {hasSaldo && (
                                    <TableCell
                                        align="right"
                                        sx={{
                                            ...CELL,
                                            fontWeight: 600,
                                            color: saldo >= 0 ? 'success.main' : 'error.main',
                                        }}
                                    >
                                        {formatCOP(saldo)}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

/** Renders {valor, cuenta_puc} arrays (derived_from_journal style) */
function ValorTable({ items }: { items: { valor: number; cuenta_puc: string }[] }) {
    if (!items?.length) return null;
    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...PUC_CELL, fontWeight: 700 }}>PUC</TableCell>
                        <TableCell align="right" sx={{ ...CELL, fontWeight: 700 }}>
                            Valor
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((row, i) => (
                        <TableRow key={i} hover>
                            <TableCell sx={PUC_CELL}>{row.cuenta_puc}</TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    ...CELL,
                                    fontWeight: 600,
                                    color: Number(row.valor) >= 0 ? 'success.main' : 'error.main',
                                }}
                            >
                                {formatCOP(Number(row.valor))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

// ---------------------------------------------------------------------------
// Statement viewer — auto-detects data format by source_mode + type
// ---------------------------------------------------------------------------

function StatementViewer({
    stmt,
    onClose,
}: {
    stmt: FinancialStatementResponse;
    onClose: () => void;
}) {
    const label = STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type;
    const d = stmt.data as Record<string, any>;
    const period = `${stmt.period_start?.split('T')[0] ?? '?'} → ${stmt.period_end?.split('T')[0] ?? '?'}`;

    // Detect data format
    const hasAccounts = Array.isArray(d.accounts) && d.accounts.length > 0;
    const hasLines = Array.isArray(d.lines) && d.lines.length > 0;
    const hasAsientos = Array.isArray(d.asientos) && d.asientos.length > 0;

    const renderContent = () => {
        // ---- NOTAS (all source modes) ----
        if (stmt.statement_type === 'notas_estados_financieros' && Array.isArray(d.notas)) {
            return (
                <Stack spacing={1}>
                    {d.notas.map((nota: any, i: number) => (
                        <Accordion
                            key={i}
                            disableGutters
                            elevation={0}
                            sx={{
                                bgcolor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px !important',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                                sx={{ minHeight: 40 }}
                            >
                                <Typography variant="caption" fontWeight={700}>
                                    Nota {nota.numero_nota}: {nota.titulo}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ mb: 1 }}
                                >
                                    {nota.contenido_resumido}
                                </Typography>
                                {Array.isArray(nota.cifras_relevantes) &&
                                    nota.cifras_relevantes.map((c: any, j: number) => (
                                        <Box
                                            key={j}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                py: 0.25,
                                            }}
                                        >
                                            <Typography variant="caption" color="text.disabled">
                                                {c.concepto?.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                color={
                                                    Number(c.valor) >= 0
                                                        ? 'success.main'
                                                        : 'error.main'
                                                }
                                            >
                                                {formatCOP(Number(c.valor))}
                                            </Typography>
                                        </Box>
                                    ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Stack>
            );
        }

        // ---- CAMBIOS PATRIMONIO ----
        if (stmt.statement_type === 'cambios_patrimonio' && Array.isArray(d.componentes)) {
            return (
                <Stack spacing={1}>
                    {d.componentes.map((comp: any, i: number) => (
                        <Box
                            key={i}
                            sx={{
                                p: 1.5,
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 1.5,
                            }}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                color="text.secondary"
                                display="block"
                            >
                                {comp.concepto_patrimonio?.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            {Array.isArray(comp.movimientos) &&
                                comp.movimientos.map((m: any, j: number) => (
                                    <Box
                                        key={j}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mt: 0.5,
                                        }}
                                    >
                                        <Typography variant="caption" color="text.disabled">
                                            {m.concepto?.replace(/_/g, ' ')}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            color={
                                                Number(m.valor) >= 0 ? 'success.main' : 'error.main'
                                            }
                                        >
                                            {formatCOP(Number(m.valor))}
                                        </Typography>
                                    </Box>
                                ))}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 1,
                                    pt: 0.5,
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <Typography variant="caption" color="text.disabled">
                                    Saldo inicial: {formatCOP(comp.saldo_inicial ?? 0)}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    color={comp.saldo_final >= 0 ? 'success.main' : 'error.main'}
                                >
                                    Saldo final: {formatCOP(comp.saldo_final ?? 0)}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    <SummaryRow
                        label="Total Patrimonio Final"
                        value={d.total_patrimonio_fin}
                        highlight
                    />
                </Stack>
            );
        }

        // ---- FLUJO DE CAJA (flat numeric fields) ----
        if (stmt.statement_type === 'flujo_de_caja') {
            return (
                <Stack spacing={0.5}>
                    <SummaryRow
                        label="Efectivo inicio de período"
                        value={d.efectivo_inicio_periodo}
                    />
                    <SummaryRow label="Flujo neto operación" value={d.flujo_neto_operacion} />
                    <SummaryRow label="Flujo neto inversión" value={d.flujo_neto_inversion} />
                    <SummaryRow label="Flujo neto financiación" value={d.flujo_neto_financiacion} />
                    <SummaryRow
                        label="Aumento / Disminución neto"
                        value={d.aumento_disminucion_neto}
                        highlight
                    />
                    <SummaryRow
                        label="Efectivo fin de período"
                        value={d.efectivo_fin_periodo}
                        highlight
                    />
                    {d.metodo && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                            Método: {d.metodo}
                        </Typography>
                    )}
                </Stack>
            );
        }

        // ---- DIRECT: accounts[] flat list (balance_general, estado_resultados direct) ----
        if (hasAccounts) {
            return <AccountsTable items={d.accounts} />;
        }

        // ---- DIRECT: lines[] (libro_auxiliar direct) ----
        if (hasLines) {
            return <AccountsTable items={d.lines} />;
        }

        // ---- asientos[] (libro_diario) ----
        if (hasAsientos) {
            return <AccountsTable items={d.asientos} />;
        }

        // ---- derived_from_journal: balance with flat numbers ----
        if (stmt.statement_type === 'balance_general' && d.total_activos != null) {
            return (
                <Stack spacing={0.5}>
                    <SummaryRow
                        label="Total Activos"
                        value={d.total_activos ?? d.activos}
                        highlight
                    />
                    <SummaryRow
                        label="Total Pasivos"
                        value={d.total_pasivos ?? d.pasivos}
                        highlight
                    />
                    <SummaryRow label="Patrimonio" value={d.patrimonio} />
                    <SummaryRow label="Total Patrimonio" value={d.total_patrimonio} highlight />
                </Stack>
            );
        }

        // ---- derived_from_journal: estado_resultados with {valor, cuenta_puc} arrays ----
        if (
            stmt.statement_type === 'estado_resultados' &&
            (Array.isArray(d.ingresos) || Array.isArray(d.gastos))
        ) {
            return (
                <Stack spacing={1}>
                    {Array.isArray(d.ingresos) && d.ingresos.length > 0 && (
                        <>
                            <SectionHeader color="#10B981">Ingresos</SectionHeader>
                            <ValorTable items={d.ingresos} />
                        </>
                    )}
                    {Array.isArray(d.costo_ventas) && d.costo_ventas.length > 0 && (
                        <>
                            <SectionHeader color="#F59E0B">Costo de Ventas</SectionHeader>
                            <ValorTable items={d.costo_ventas} />
                        </>
                    )}
                    {Array.isArray(d.gastos) && d.gastos.length > 0 && (
                        <>
                            <SectionHeader color="#EF4444">Gastos</SectionHeader>
                            <ValorTable items={d.gastos} />
                        </>
                    )}
                    {d.utilidad_neta != null && (
                        <SummaryRow label="Utilidad Neta" value={d.utilidad_neta} highlight />
                    )}
                </Stack>
            );
        }

        // ---- derived_from_journal: libro_auxiliar with accounts[] ----
        if (stmt.statement_type === 'libro_auxiliar' && Array.isArray(d.accounts)) {
            return <AccountsTable items={d.accounts} />;
        }

        // ---- Fallback: show all numeric top-level fields ----
        const numericFields = Object.entries(d).filter(
            ([, v]) =>
                typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v !== '')
        );
        if (numericFields.length > 0) {
            return (
                <Stack spacing={0.5}>
                    {numericFields.map(([key, val]) => (
                        <SummaryRow key={key} label={key.replace(/_/g, ' ')} value={Number(val)} />
                    ))}
                </Stack>
            );
        }

        return (
            <Typography variant="body2" color="text.disabled">
                Sin datos estructurados para mostrar.
            </Typography>
        );
    };

    return (
        <Drawer
            anchor="right"
            open
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100vw', sm: 560 },
                    p: 3,
                    bgcolor: 'background.default',
                    overflow: 'auto',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {period}
                    </Typography>
                    {stmt.entity_nit && (
                        <Typography variant="caption" color="text.disabled" display="block">
                            NIT {stmt.entity_nit}
                        </Typography>
                    )}
                    <Chip
                        label={stmt.source_mode}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Descargar JSON">
                        <IconButton
                            size="small"
                            onClick={() =>
                                downloadJson(d, `${stmt.statement_type}_${stmt.id}.json`)
                            }
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {/* Brutalist close button */}
                    <Box
                        component="button"
                        type="button"
                        onClick={onClose}
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: palette.paperFaint,
                            bgcolor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.5,
                            '&:hover': { color: palette.paper },
                            transition: 'color 0.15s',
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                        CERRAR
                    </Box>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {renderContent()}
            <Box sx={{ mt: 3 }}>
                <FallbackJson data={d} />
            </Box>
        </Drawer>
    );
}

function FallbackJson({ data }: { data: unknown }) {
    const [open, setOpen] = useState(false);
    return (
        <Box>
            <Box
                component="button"
                type="button"
                onClick={() => setOpen(!open)}
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.65rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: palette.paperFaint,
                    bgcolor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    '&:hover': { color: palette.paper },
                    transition: 'color 0.15s',
                }}
            >
                {open ? '// OCULTAR JSON' : '// VER JSON COMPLETO'}
            </Box>
            {open && (
                <Box
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 1,
                        p: 1.5,
                        mt: 1,
                        overflow: 'auto',
                        maxHeight: 300,
                    }}
                >
                    <pre
                        style={{
                            fontSize: '0.7rem',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </Box>
            )}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Financial statements section
// ---------------------------------------------------------------------------

function FinancialStatementsSection() {
    const { data: stmts, isLoading, isError } = useStatements();
    const { activeNit, activeCompany } = useCompany();
    const invalidate = useInvalidateStatements();
    const [selectedStmt, setSelectedStmt] = useState<FinancialStatementResponse | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<{
        id: string;
        format: ReportExportFormat;
    } | null>(null);

    const handleDownloadExport = async (
        stmt: FinancialStatementResponse,
        format: ReportExportFormat
    ) => {
        const exportType = EXPORTABLE_STATEMENT_TYPES[stmt.statement_type];
        if (!exportType) {
            setDownloadError(`El tipo ${stmt.statement_type} aún no tiene exportación habilitada.`);
            return;
        }

        if (!activeNit || activeNit.trim().length === 0) {
            setDownloadError('Selecciona una empresa activa antes de descargar el reporte.');
            return;
        }

        setDownloadError(null);
        setDownloading({ id: stmt.id, format });
        try {
            const companyName = activeCompany?.nombre ?? activeNit ?? 'Empresa';

            let result;
            if (exportType === 'balance' || exportType === 'pnl' || exportType === 'cashflow') {
                result = await downloadReportExport({
                    report_type: exportType,
                    format,
                    statement_id: stmt.id,
                    company_name: companyName,
                    company_nit: activeNit,
                });
            } else {
                result = await downloadStatementExport(
                    exportType,
                    format,
                    stmt.id,
                    companyName,
                    activeNit
                );
            }

            downloadBlob(result.blob, result.filename);
        } catch (error) {
            console.error(error);
            setDownloadError(
                'No fue posible descargar el reporte. Verifica la API de exportación y vuelve a intentar.'
            );
        } finally {
            setDownloading(null);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            {/* Section header — brutalist */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                    sx={{
                        width: 30,
                        height: 2,
                        bgcolor: moduleAccents.reports,
                        boxShadow: `0 0 8px ${moduleAccents.reports}`,
                    }}
                />
                <Typography sx={{ ...sxLabel, fontSize: '0.65rem', color: moduleAccents.reports }}>
                    // 2 / ESTADOS FINANCIEROS
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontWeight: 700,
                            fontSize: { xs: '1.4rem', md: '1.8rem' },
                            color: palette.paper,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.1,
                        }}
                    >
                        Documentos Financieros.
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.88rem',
                            color: palette.paperFaint,
                            mt: 0.4,
                        }}
                    >
                        Estados financieros almacenados — Via A y Via B
                    </Typography>
                </Box>
                <Tooltip title="Actualizar lista">
                    <IconButton
                        size="small"
                        onClick={() => invalidate()}
                        disabled={isLoading}
                        sx={{
                            color: palette.paperFaint,
                            '&:hover': { color: moduleAccents.reports },
                        }}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {isLoading &&
                [1, 2, 3].map((i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        height={44}
                        sx={{ mb: 1, borderRadius: 1 }}
                    />
                ))}
            {isError && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    No se pudo cargar la lista de documentos financieros.
                </Alert>
            )}
            {downloadError && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>
                    {downloadError}
                </Alert>
            )}
            {!isLoading && !isError && (!stmts || stmts.length === 0) && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No hay documentos financieros. Usa <strong>Cargar documentos → Via B</strong>{' '}
                    para subirlos.
                </Alert>
            )}

            {stmts && stmts.length > 0 && (
                <Box
                    sx={{
                        border: `1px solid ${palette.line}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Documento
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Origen
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Período
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    NIT
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 700,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Creado
                                </TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stmts.map((stmt) => {
                                const cfg = SOURCE_MODE_CONFIG[stmt.source_mode] ?? {
                                    label: stmt.source_mode,
                                    color: 'default' as const,
                                };
                                const start = stmt.period_start?.split('T')[0];
                                const end = stmt.period_end?.split('T')[0];
                                return (
                                    <TableRow key={stmt.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {STATEMENT_LABELS[stmt.statement_type] ??
                                                    stmt.statement_type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={cfg.label}
                                                size="small"
                                                color={cfg.color}
                                                variant="outlined"
                                                sx={{ fontSize: '0.68rem', height: 20 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {start ? `${start} → ${end}` : end}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {stmt.entity_nit ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {stmt.created_at
                                                    ? stmt.created_at.split('T')[0]
                                                    : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 0.5,
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <Tooltip title="Descargar PDF">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                handleDownloadExport(stmt, 'pdf')
                                                            }
                                                            disabled={downloading?.id === stmt.id}
                                                            aria-busy={
                                                                downloading?.id === stmt.id &&
                                                                downloading.format === 'pdf'
                                                            }
                                                        >
                                                            {downloading?.id === stmt.id &&
                                                            downloading.format === 'pdf' ? (
                                                                <CircularProgress size={14} />
                                                            ) : (
                                                                <PdfIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Descargar Excel">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                                handleDownloadExport(stmt, 'excel')
                                                            }
                                                            disabled={downloading?.id === stmt.id}
                                                            aria-busy={
                                                                downloading?.id === stmt.id &&
                                                                downloading.format === 'excel'
                                                            }
                                                        >
                                                            {downloading?.id === stmt.id &&
                                                            downloading.format === 'excel' ? (
                                                                <CircularProgress size={14} />
                                                            ) : (
                                                                <ExcelIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Ver documento">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setSelectedStmt(stmt)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            )}

            {selectedStmt && (
                <StatementViewer stmt={selectedStmt} onClose={() => setSelectedStmt(null)} />
            )}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ActiveChart = 'balance' | 'pnl' | 'cashflow' | null;

export default function ReportsPage() {
    const { activeCompany } = useCompany();
    const [activeChart, setActiveChart] = useState<ActiveChart>(null);

    const { data: balData, isLoading: balLoading, isError: balError } = useBalance();
    const { data: pnlData, isLoading: pnlLoading, isError: pnlError } = useProfitAndLoss();
    const { data: cfData, isLoading: cfLoading, isError: cfError } = useCashFlow();
    const { data: transactions } = useTransactions();

    const isProcessing = transactions?.some((t) => t.status === 'PROCESSING') ?? false;

    // Balance chart: activos vs pasivos
    const balanceChartData = balData
        ? [
              { name: 'Activos', valor: Math.abs(balData.activos) },
              { name: 'Pasivos', valor: Math.abs(balData.pasivos) },
              { name: 'Patrimonio', valor: Math.abs(balData.patrimonio_total) },
          ]
        : [];

    // PnL chart: ingresos vs costos vs gastos
    const pnlChartData = pnlData
        ? [
              { name: 'Ingresos', valor: pnlData.total_ingresos },
              { name: 'Costos', valor: pnlData.total_costo_ventas },
              { name: 'Gastos', valor: pnlData.total_gastos },
              { name: 'Utilidad Neta', valor: pnlData.utilidad_neta },
          ]
        : [];

    // Cashflow chart: cuentas de efectivo + total
    const cfChartData = cfData?.cuentas_efectivo
        ? [
              ...cfData.cuentas_efectivo.map((c) => ({
                  name: c.nombre.length > 18 ? c.nombre.slice(0, 18) + '…' : c.nombre,
                  valor: c.saldo,
              })),
              { name: 'TOTAL', valor: cfData.total_efectivo },
          ]
        : [];

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_5 // REPORTES"
                title={
                    <>
                        Estados
                        <br />
                        financieros.
                    </>
                }
                subtitle={
                    activeCompany ? (activeCompany.nombre ?? activeCompany.nit) : 'sin empresa'
                }
                lede="Tres reportes principales (Balance, Estado de Resultados, Flujo de Caja) más los 7 documentos del pipeline Via B. Generados automáticamente desde el libro diario."
                accent={moduleAccents.reports}
                ghostNumber="5"
            />

            {isProcessing && (
                <Alert icon={<ProcessingIcon />} severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Hay documentos procesándose. Los reportes se actualizarán al completar.
                </Alert>
            )}

            {/* Section 1 header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                    sx={{
                        width: 30,
                        height: 2,
                        bgcolor: moduleAccents.reports,
                        boxShadow: `0 0 8px ${moduleAccents.reports}`,
                    }}
                />
                <Typography sx={{ ...sxLabel, fontSize: '0.65rem', color: moduleAccents.reports }}>
                    // 1 / INFORMES PRINCIPALES
                </Typography>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Balance General"
                        icon={<BalanceIcon />}
                        accentColor="#6366F1"
                        hasData={!!balData}
                        isLoading={balLoading}
                        isError={balError}
                        cardIndex={1}
                        onViewChart={() =>
                            setActiveChart(activeChart === 'balance' ? null : 'balance')
                        }
                        onDownload={
                            balData
                                ? () => downloadJson(balData, 'balance_general.json')
                                : undefined
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Estado de Resultados"
                        icon={<PnLIcon />}
                        accentColor="#10B981"
                        hasData={!!pnlData}
                        isLoading={pnlLoading}
                        isError={pnlError}
                        cardIndex={2}
                        onViewChart={() => setActiveChart(activeChart === 'pnl' ? null : 'pnl')}
                        onDownload={
                            pnlData
                                ? () => downloadJson(pnlData, 'estado_resultados.json')
                                : undefined
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Flujo de Caja"
                        icon={<CashFlowIcon />}
                        accentColor="#F59E0B"
                        hasData={!!cfData}
                        isLoading={cfLoading}
                        isError={cfError}
                        cardIndex={3}
                        onViewChart={() =>
                            setActiveChart(activeChart === 'cashflow' ? null : 'cashflow')
                        }
                        onDownload={
                            cfData ? () => downloadJson(cfData, 'flujo_caja.json') : undefined
                        }
                    />
                </Grid>
            </Grid>

            {/* KPI summary row when balance is available */}
            {balData && (
                <Box sx={{ p: 2, mb: 3, border: `1px solid ${palette.line}` }}>
                    <Grid container spacing={2} textAlign="center">
                        {[
                            { label: 'Activos', value: balData.activos, color: palette.accent },
                            { label: 'Pasivos', value: balData.pasivos, color: palette.error },
                            {
                                label: 'Utilidad Neta',
                                value: balData.utilidad_neta,
                                color: balData.utilidad_neta >= 0 ? palette.success : palette.error,
                            },
                        ].map(({ label, value, color }) => (
                            <Grid item xs={4} key={label}>
                                <Typography
                                    sx={{
                                        ...sxLabel,
                                        fontSize: '0.62rem',
                                        color: palette.paperFaint,
                                        display: 'block',
                                        mb: 0.5,
                                    }}
                                >
                                    {label.toUpperCase()}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontWeight: 700,
                                        fontSize: { xs: '1rem', md: '1.25rem' },
                                        color,
                                    }}
                                >
                                    {formatCOP(value)}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Chart panel */}
            {activeChart && (
                <Box sx={{ p: 3, border: `1px solid ${palette.line}`, mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                color: palette.paper,
                            }}
                        >
                            {activeChart === 'balance' && 'Balance General'}
                            {activeChart === 'pnl' && 'Estado de Resultados'}
                            {activeChart === 'cashflow' && 'Flujo de Caja — Cuentas de efectivo'}
                        </Typography>
                        {/* Brutalist close link */}
                        <Box
                            component="button"
                            type="button"
                            onClick={() => setActiveChart(null)}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: palette.paperFaint,
                                bgcolor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                '&:hover': { color: palette.paper },
                                transition: 'color 0.15s',
                            }}
                        >
                            // CERRAR
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    {activeChart === 'balance' && balanceChartData.length > 0 && (
                        <FinancialChart
                            type="bar"
                            data={pnlChartData}
                            height={280}
                            series={[{ key: 'valor', label: 'COP', color: palette.accent }]}
                        />
                    )}
                    {activeChart === 'pnl' && pnlChartData.length > 0 && (
                        <FinancialChart
                            type="bar"
                            data={pnlChartData}
                            height={280}
                            series={[{ key: 'valor', label: 'COP', color: palette.success }]}
                        />
                    )}
                    {activeChart === 'cashflow' && (
                        <>
                            {cfChartData.length === 0 || cfData?.total_efectivo === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    Esta empresa no tiene movimientos en cuentas de efectivo (clase
                                    11) registrados en el período.
                                </Alert>
                            ) : (
                                <FinancialChart
                                    type="bar"
                                    data={cfChartData}
                                    height={280}
                                    showReferenceLine
                                    series={[
                                        { key: 'valor', label: 'Saldo COP', color: palette.amber },
                                    ]}
                                />
                            )}
                            {cfData?.nota && (
                                <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    sx={{ mt: 1, display: 'block' }}
                                >
                                    {cfData.nota}
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            )}

            {/* Financial statements (Via B) */}
            <FinancialStatementsSection />
        </Box>
    );
}
