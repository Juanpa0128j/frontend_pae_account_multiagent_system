'use client';

import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Divider,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Skeleton,
    Tooltip,
    LinearProgress,
    Grid,
    Stack,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    FileDownload as DownloadIcon,
    AccountBalance as BalanceIcon,
    TrendingUp as PnLIcon,
    Waves as CashFlowIcon,
    HourglassEmpty as ProcessingIcon,
    BarChart as ChartIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import FinancialChart from '@/components/reports/FinancialChart';
import { useBalance, useProfitAndLoss, useCashFlow, useStatements, useInvalidateStatements } from '@/hooks/useReports';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import type { FinancialStatementResponse } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

const SOURCE_MODE_CONFIG: Record<string, { label: string; color: 'primary' | 'success' | 'secondary' | 'default' }> = {
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

// ---------------------------------------------------------------------------
// Report summary card (auto-loaded, no generate button)
// ---------------------------------------------------------------------------

function ReportSummaryCard({
    title,
    icon,
    accentColor,
    hasData,
    isLoading,
    onViewChart,
    onDownload,
}: {
    title: string;
    icon: React.ReactNode;
    accentColor: string;
    hasData: boolean;
    isLoading: boolean;
    onViewChart: () => void;
    onDownload?: () => void;
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                border: `1px solid`,
                borderColor: hasData ? `${accentColor}40` : 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {isLoading && (
                <LinearProgress
                    sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: 'transparent',
                        '& .MuiLinearProgress-bar': { bgcolor: accentColor } }}
                />
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ color: accentColor, mt: 0.25 }}>{icon}</Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {isLoading ? 'Cargando…' : hasData ? 'Datos disponibles' : 'Sin datos para esta empresa'}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={isLoading ? 'Cargando' : hasData ? 'Disponible' : 'Sin datos'}
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: isLoading ? 'rgba(255,255,255,0.05)' : hasData ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                        color: isLoading ? 'text.disabled' : hasData ? accentColor : 'text.disabled',
                    }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                    size="small"
                    variant={hasData ? 'contained' : 'outlined'}
                    startIcon={<ChartIcon />}
                    onClick={onViewChart}
                    disabled={!hasData || isLoading}
                    sx={{
                        flex: 1,
                        bgcolor: hasData ? accentColor : undefined,
                        '&:hover': { bgcolor: hasData ? `${accentColor}CC` : undefined },
                        fontSize: '0.78rem',
                    }}
                >
                    Ver gráfico
                </Button>
                {onDownload && (
                    <Tooltip title="Descargar JSON">
                        <IconButton size="small" onClick={onDownload} disabled={!hasData}>
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Statement detail dialog
// ---------------------------------------------------------------------------

function StatementDetailDialog({ stmt, onClose }: { stmt: FinancialStatementResponse | null; onClose: () => void }) {
    if (!stmt) return null;
    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">ID: {stmt.id}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <pre style={{ fontSize: '0.78rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {JSON.stringify(stmt.data, null, 2)}
                </pre>
            </DialogContent>
            <DialogActions>
                <Button size="small" startIcon={<DownloadIcon />}
                    onClick={() => downloadJson(stmt.data, `${stmt.statement_type}_${stmt.id}.json`)}>
                    Descargar JSON
                </Button>
                <Button onClick={onClose} size="small">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Financial statements section
// ---------------------------------------------------------------------------

function FinancialStatementsSection() {
    const { data: stmts, isLoading, isError } = useStatements();
    const invalidate = useInvalidateStatements();
    const [selectedStmt, setSelectedStmt] = useState<FinancialStatementResponse | null>(null);

    const formatPeriod = (start: string | null, end: string) => {
        const fmt = (d: string) => d.split('T')[0];
        return start ? `${fmt(start)} → ${fmt(end)}` : fmt(end);
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Documentos Financieros</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Estados financieros almacenados — Via A y Via B
                    </Typography>
                </Box>
                <Tooltip title="Actualizar lista">
                    <IconButton size="small" onClick={() => invalidate()} disabled={isLoading}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {isLoading && [1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
            ))}

            {isError && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    No se pudo cargar la lista de documentos financieros.
                </Alert>
            )}

            {!isLoading && !isError && (!stmts || stmts.length === 0) && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No hay documentos financieros. Usa <strong>Cargar documentos → Via B</strong> para subirlos.
                </Alert>
            )}

            {stmts && stmts.length > 0 && (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Documento</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>NIT</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Creado</TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stmts.map((stmt) => {
                                const cfg = SOURCE_MODE_CONFIG[stmt.source_mode] ?? { label: stmt.source_mode, color: 'default' as const };
                                return (
                                    <TableRow key={stmt.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined"
                                                sx={{ fontSize: '0.68rem', height: 20 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatPeriod(stmt.period_start, stmt.period_end)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {stmt.entity_nit ?? '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {stmt.created_at ? stmt.created_at.split('T')[0] : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Ver JSON">
                                                <IconButton size="small" onClick={() => setSelectedStmt(stmt)}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <StatementDetailDialog stmt={selectedStmt} onClose={() => setSelectedStmt(null)} />
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

    const { data: balData, isLoading: balLoading } = useBalance();
    const { data: pnlData, isLoading: pnlLoading } = useProfitAndLoss();
    const { data: cfData, isLoading: cfLoading } = useCashFlow();
    const { data: transactions } = useTransactions();

    const isProcessing = transactions?.some((t) => t.status === 'PROCESSING') ?? false;

    // Build chart data
    const balanceChartData = balData ? [
        { name: 'Activos Ctes.', activos: Object.values(balData.assets.current).reduce((s: number, v) => s + (v as number), 0), pasivos: 0 },
        { name: 'Activos NC', activos: Object.values(balData.assets.non_current).reduce((s: number, v) => s + (v as number), 0), pasivos: 0 },
        { name: 'Pasivos Ctes.', activos: 0, pasivos: Object.values(balData.liabilities.current).reduce((s: number, v) => s + (v as number), 0) },
        { name: 'Pasivos NC', activos: 0, pasivos: Object.values(balData.liabilities.non_current).reduce((s: number, v) => s + (v as number), 0) },
        { name: 'Patrimonio', activos: 0, pasivos: balData.equity.total },
    ] : [];

    const pnlChartData = pnlData ? Object.entries(pnlData.revenue).map(([name, ingresos]) => ({
        name,
        ingresos: ingresos as number,
        costos: (pnlData.expenses[name] as number) ?? 0,
        utilidad: (ingresos as number) - ((pnlData.expenses[name] as number) ?? 0),
    })) : [];

    const cfChartData = cfData ? Object.entries(cfData.operating_activities).map(([name, entradas]) => ({
        name, entradas: entradas as number, salidas: 0,
    })) : [];

    return (
        <Box>
            <PageHeader
                title="Reportes Financieros"
                subtitle={activeCompany ? `${activeCompany.nombre ?? activeCompany.nit} — ${activeCompany.ciudad ?? ''}` : 'Selecciona una empresa'}
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reportes financieros' }]}
            />

            {/* Processing banner */}
            {isProcessing && (
                <Alert
                    icon={<ProcessingIcon />}
                    severity="info"
                    sx={{ mb: 3, borderRadius: 2 }}
                >
                    Hay documentos procesándose. Los reportes se actualizarán al completar.
                </Alert>
            )}

            {/* Report cards — auto-loaded */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Balance General"
                        icon={<BalanceIcon />}
                        accentColor="#6366F1"
                        hasData={!!balData}
                        isLoading={balLoading}
                        onViewChart={() => setActiveChart(activeChart === 'balance' ? null : 'balance')}
                        onDownload={balData ? () => downloadJson(balData, 'balance_general.json') : undefined}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Estado de Resultados"
                        icon={<PnLIcon />}
                        accentColor="#10B981"
                        hasData={!!pnlData}
                        isLoading={pnlLoading}
                        onViewChart={() => setActiveChart(activeChart === 'pnl' ? null : 'pnl')}
                        onDownload={pnlData ? () => downloadJson(pnlData, 'estado_resultados.json') : undefined}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard
                        title="Flujo de Caja"
                        icon={<CashFlowIcon />}
                        accentColor="#F59E0B"
                        hasData={!!cfData}
                        isLoading={cfLoading}
                        onViewChart={() => setActiveChart(activeChart === 'cashflow' ? null : 'cashflow')}
                        onDownload={cfData ? () => downloadJson(cfData, 'flujo_caja.json') : undefined}
                    />
                </Grid>
            </Grid>

            {/* Chart panel */}
            {activeChart && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {activeChart === 'balance' && 'Balance General'}
                            {activeChart === 'pnl' && 'Estado de Resultados'}
                            {activeChart === 'cashflow' && 'Flujo de Caja'}
                        </Typography>
                        <Button size="small" onClick={() => setActiveChart(null)} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            Cerrar
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    {activeChart === 'balance' && balanceChartData.length > 0 && (
                        <FinancialChart type="bar" data={balanceChartData} height={300}
                            series={[
                                { key: 'activos', label: 'Activos', color: '#6366F1' },
                                { key: 'pasivos', label: 'Pasivos + Patrimonio', color: '#10B981' },
                            ]} />
                    )}
                    {activeChart === 'pnl' && pnlChartData.length > 0 && (
                        <FinancialChart type="line" data={pnlChartData} height={300}
                            series={[
                                { key: 'ingresos', label: 'Ingresos', color: '#10B981' },
                                { key: 'costos', label: 'Costos', color: '#EF4444' },
                                { key: 'utilidad', label: 'Utilidad', color: '#6366F1' },
                            ]} />
                    )}
                    {activeChart === 'cashflow' && cfChartData.length > 0 && (
                        <FinancialChart type="area" data={cfChartData} height={300}
                            series={[
                                { key: 'entradas', label: 'Entradas', color: '#10B981' },
                                { key: 'salidas', label: 'Salidas', color: '#F59E0B' },
                            ]} />
                    )}
                </Paper>
            )}

            {/* Financial statements (Via B) */}
            <FinancialStatementsSection />
        </Box>
    );
}
