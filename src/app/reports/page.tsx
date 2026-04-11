'use client';

import { useState } from 'react';
import {
    Box, Paper, Typography, Button, Divider, Alert, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Skeleton, Tooltip, LinearProgress, Grid, Stack,
    Accordion, AccordionSummary, AccordionDetails, Drawer,
} from '@mui/material';
import {
    Refresh as RefreshIcon, Visibility as ViewIcon,
    Close as CloseIcon, FileDownload as DownloadIcon,
    AccountBalance as BalanceIcon, TrendingUp as PnLIcon,
    Waves as CashFlowIcon, HourglassEmpty as ProcessingIcon,
    BarChart as ChartIcon, ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import FinancialChart from '@/components/reports/FinancialChart';
import { useBalance, useProfitAndLoss, useCashFlow, useStatements, useInvalidateStatements } from '@/hooks/useReports';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import { formatCOP } from '@/lib/formatters';
import type { FinancialStatementResponse } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
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
// Report summary card
// ---------------------------------------------------------------------------

function ReportSummaryCard({ title, icon, accentColor, hasData, isLoading, onViewChart, onDownload }: {
    title: string; icon: React.ReactNode; accentColor: string;
    hasData: boolean; isLoading: boolean; onViewChart: () => void; onDownload?: () => void;
}) {
    return (
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: hasData ? `${accentColor}40` : 'rgba(255,255,255,0.06)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: accentColor } }} />}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ color: accentColor, mt: 0.25 }}>{icon}</Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {isLoading ? 'Cargando…' : hasData ? 'Datos disponibles' : 'Sin datos para esta empresa'}
                    </Typography>
                </Box>
                <Chip size="small" label={isLoading ? 'Cargando' : hasData ? 'Disponible' : 'Sin datos'}
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: hasData ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                        color: hasData ? accentColor : 'text.disabled' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" variant={hasData ? 'contained' : 'outlined'} startIcon={<ChartIcon />}
                    onClick={onViewChart} disabled={!hasData || isLoading}
                    sx={{ flex: 1, bgcolor: hasData ? accentColor : undefined, '&:hover': { bgcolor: hasData ? `${accentColor}CC` : undefined }, fontSize: '0.78rem' }}>
                    Ver gráfico
                </Button>
                {onDownload && (
                    <Tooltip title="Descargar JSON">
                        <IconButton size="small" onClick={onDownload} disabled={!hasData}><DownloadIcon fontSize="small" /></IconButton>
                    </Tooltip>
                )}
            </Box>
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Financial statement structured viewer
// ---------------------------------------------------------------------------

function LineItemTable({ title, items, accentColor = '#6366F1' }: {
    title: string;
    items: { codigo: string; nombre: string; saldo: number }[];
    accentColor?: string;
}) {
    if (!items?.length) return null;
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5, display: 'block' }}>
                {title}
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.5 }}>PUC</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.5 }}>Nombre</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.72rem', py: 0.5 }}>Saldo</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, i) => (
                            <TableRow key={i} hover>
                                <TableCell sx={{ fontSize: '0.72rem', py: 0.4, color: 'text.secondary', fontFamily: 'monospace' }}>{item.codigo}</TableCell>
                                <TableCell sx={{ fontSize: '0.78rem', py: 0.4 }}>{item.nombre}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.78rem', py: 0.4, fontWeight: 600, color: item.saldo >= 0 ? 'success.main' : 'error.main' }}>
                                    {formatCOP(item.saldo)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: highlight ? 1 : 0.5, borderTop: highlight ? '1px solid rgba(255,255,255,0.1)' : 'none', mt: highlight ? 1 : 0 }}>
            <Typography variant={highlight ? 'subtitle2' : 'body2'} fontWeight={highlight ? 700 : 400} color={highlight ? 'text.primary' : 'text.secondary'}>
                {label}
            </Typography>
            <Typography variant={highlight ? 'subtitle1' : 'body2'} fontWeight={highlight ? 800 : 500} color={value >= 0 ? 'success.main' : 'error.main'}>
                {formatCOP(value)}
            </Typography>
        </Box>
    );
}

function StatementViewer({ stmt, onClose }: { stmt: FinancialStatementResponse; onClose: () => void }) {
    const label = STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type;
    const d = stmt.data as Record<string, any>;
    const period = `${stmt.period_start?.split('T')[0] ?? '?'} → ${stmt.period_end?.split('T')[0] ?? '?'}`;

    const renderContent = () => {
        switch (stmt.statement_type) {
            case 'balance_general':
                return (
                    <Stack spacing={2}>
                        {d.activos_corrientes && <LineItemTable title="Activos Corrientes" items={d.activos_corrientes} accentColor="#6366F1" />}
                        {d.activos_no_corrientes && <LineItemTable title="Activos No Corrientes" items={d.activos_no_corrientes} accentColor="#6366F1" />}
                        {(d.total_activos != null) && <SummaryRow label="Total Activos" value={d.total_activos} highlight />}
                        {d.pasivos_corrientes && <LineItemTable title="Pasivos Corrientes" items={d.pasivos_corrientes} accentColor="#EF4444" />}
                        {d.pasivos_no_corrientes && <LineItemTable title="Pasivos No Corrientes" items={d.pasivos_no_corrientes} accentColor="#EF4444" />}
                        {(d.total_pasivos != null) && <SummaryRow label="Total Pasivos" value={d.total_pasivos} highlight />}
                        {d.patrimonio_items && <LineItemTable title="Patrimonio" items={d.patrimonio_items} accentColor="#10B981" />}
                        {(d.patrimonio_total != null || d.total_patrimonio != null) && <SummaryRow label="Total Patrimonio" value={d.patrimonio_total ?? d.total_patrimonio} highlight />}
                        <FallbackJson data={d} />
                    </Stack>
                );
            case 'estado_resultados':
                return (
                    <Stack spacing={2}>
                        {d.ingresos && <LineItemTable title="Ingresos" items={d.ingresos} accentColor="#10B981" />}
                        {d.costo_ventas && <LineItemTable title="Costo de Ventas" items={d.costo_ventas} accentColor="#F59E0B" />}
                        {(d.utilidad_bruta != null) && <SummaryRow label="Utilidad Bruta" value={d.utilidad_bruta} highlight />}
                        {d.gastos && <LineItemTable title="Gastos Operacionales" items={d.gastos} accentColor="#EF4444" />}
                        {(d.utilidad_neta != null || d.utilidad_operacional != null) && <SummaryRow label="Utilidad Neta" value={d.utilidad_neta ?? d.utilidad_operacional} highlight />}
                        <FallbackJson data={d} />
                    </Stack>
                );
            case 'flujo_de_caja':
                return (
                    <Stack spacing={2}>
                        {d.actividades_operacionales && <LineItemTable title="Actividades Operacionales" items={d.actividades_operacionales} accentColor="#6366F1" />}
                        {d.actividades_inversion && <LineItemTable title="Actividades de Inversión" items={d.actividades_inversion} accentColor="#F59E0B" />}
                        {d.actividades_financiacion && <LineItemTable title="Actividades de Financiación" items={d.actividades_financiacion} accentColor="#10B981" />}
                        {(d.efectivo_fin_periodo != null) && <SummaryRow label="Efectivo fin de período" value={d.efectivo_fin_periodo} highlight />}
                        <FallbackJson data={d} />
                    </Stack>
                );
            case 'cambios_patrimonio':
                return (
                    <Stack spacing={1}>
                        {Array.isArray(d.componentes) && d.componentes.map((comp: any, i: number) => (
                            <Box key={i} sx={{ p: 1.5, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">{comp.concepto_patrimonio?.replace(/_/g, ' ').toUpperCase()}</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.disabled">Saldo inicial: {formatCOP(comp.saldo_inicial ?? 0)}</Typography>
                                    <Typography variant="caption" fontWeight={700} color={comp.saldo_final >= 0 ? 'success.main' : 'error.main'}>Saldo final: {formatCOP(comp.saldo_final ?? 0)}</Typography>
                                </Box>
                            </Box>
                        ))}
                        {(d.total_patrimonio_fin != null) && <SummaryRow label="Total Patrimonio Final" value={d.total_patrimonio_fin} highlight />}
                        <FallbackJson data={d} />
                    </Stack>
                );
            case 'notas_estados_financieros':
                return (
                    <Stack spacing={1}>
                        {Array.isArray(d.notas) && d.notas.map((nota: any, i: number) => (
                            <Accordion key={i} disableGutters elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 40 }}>
                                    <Typography variant="caption" fontWeight={700}>Nota {nota.numero_nota}: {nota.titulo}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{nota.contenido_resumido}</Typography>
                                    {Array.isArray(nota.cifras_relevantes) && nota.cifras_relevantes.map((c: any, j: number) => (
                                        <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" color="text.disabled">{c.concepto}</Typography>
                                            <Typography variant="caption" fontWeight={600}>{formatCOP(c.valor)}</Typography>
                                        </Box>
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                        <FallbackJson data={d} />
                    </Stack>
                );
            default:
                return <FallbackJson data={d} />;
        }
    };

    return (
        <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: { xs: '100vw', sm: 520 }, p: 3, bgcolor: 'background.default' } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{period}</Typography>
                    {stmt.entity_nit && <Typography variant="caption" color="text.disabled" display="block">NIT {stmt.entity_nit}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Descargar JSON">
                        <IconButton size="small" onClick={() => downloadJson(d, `${stmt.statement_type}_${stmt.id}.json`)}><DownloadIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {renderContent()}
        </Drawer>
    );
}

function FallbackJson({ data }: { data: unknown }) {
    const [open, setOpen] = useState(false);
    return (
        <Box>
            <Button size="small" variant="text" sx={{ fontSize: '0.7rem', color: 'text.disabled' }} onClick={() => setOpen(!open)}>
                {open ? 'Ocultar JSON' : 'Ver JSON completo'}
            </Button>
            {open && (
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, p: 1.5, mt: 1, overflow: 'auto', maxHeight: 300 }}>
                    <pre style={{ fontSize: '0.7rem', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
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
    const invalidate = useInvalidateStatements();
    const [selectedStmt, setSelectedStmt] = useState<FinancialStatementResponse | null>(null);

    return (
        <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Documentos Financieros</Typography>
                    <Typography variant="caption" color="text.secondary">Estados financieros almacenados — Via A y Via B</Typography>
                </Box>
                <Tooltip title="Actualizar lista">
                    <IconButton size="small" onClick={() => invalidate()} disabled={isLoading}><RefreshIcon fontSize="small" /></IconButton>
                </Tooltip>
            </Box>

            {isLoading && [1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />)}
            {isError && <Alert severity="warning" sx={{ borderRadius: 2 }}>No se pudo cargar la lista de documentos financieros.</Alert>}
            {!isLoading && !isError && (!stmts || stmts.length === 0) && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No hay documentos financieros. Usa <strong>Cargar documentos → Via B</strong> para subirlos.</Alert>
            )}

            {stmts && stmts.length > 0 && (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
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
                            {stmts.map(stmt => {
                                const cfg = SOURCE_MODE_CONFIG[stmt.source_mode] ?? { label: stmt.source_mode, color: 'default' as const };
                                const start = stmt.period_start?.split('T')[0];
                                const end = stmt.period_end?.split('T')[0];
                                return (
                                    <TableRow key={stmt.id} hover>
                                        <TableCell><Typography variant="body2" fontWeight={600}>{STATEMENT_LABELS[stmt.statement_type] ?? stmt.statement_type}</Typography></TableCell>
                                        <TableCell><Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} /></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{start ? `${start} → ${end}` : end}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{stmt.entity_nit ?? '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{stmt.created_at ? stmt.created_at.split('T')[0] : '—'}</Typography></TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Ver documento"><IconButton size="small" onClick={() => setSelectedStmt(stmt)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {selectedStmt && <StatementViewer stmt={selectedStmt} onClose={() => setSelectedStmt(null)} />}
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

    const isProcessing = transactions?.some(t => t.status === 'PROCESSING') ?? false;

    // Balance chart: activos vs pasivos
    const balanceChartData = balData ? [
        { name: 'Activos', valor: Math.abs(balData.activos) },
        { name: 'Pasivos', valor: Math.abs(balData.pasivos) },
        { name: 'Patrimonio', valor: Math.abs(balData.patrimonio_total) },
    ] : [];

    // PnL chart: ingresos vs costos vs gastos
    const pnlChartData = pnlData ? [
        { name: 'Ingresos', valor: pnlData.total_ingresos },
        { name: 'Costos', valor: pnlData.total_costo_ventas },
        { name: 'Gastos', valor: pnlData.total_gastos },
        { name: 'Utilidad Neta', valor: pnlData.utilidad_neta },
    ] : [];

    // Cashflow chart: cuentas de efectivo
    const cfChartData = cfData?.cuentas_efectivo?.map(c => ({
        name: c.nombre.length > 20 ? c.nombre.slice(0, 20) + '…' : c.nombre,
        valor: c.saldo,
    })) ?? [];

    return (
        <Box>
            <PageHeader
                title="Reportes Financieros"
                subtitle={activeCompany ? `${activeCompany.nombre ?? activeCompany.nit} — ${activeCompany.ciudad ?? ''}` : 'Selecciona una empresa'}
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reportes financieros' }]}
            />

            {isProcessing && (
                <Alert icon={<ProcessingIcon />} severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Hay documentos procesándose. Los reportes se actualizarán al completar.
                </Alert>
            )}

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard title="Balance General" icon={<BalanceIcon />} accentColor="#6366F1"
                        hasData={!!balData} isLoading={balLoading}
                        onViewChart={() => setActiveChart(activeChart === 'balance' ? null : 'balance')}
                        onDownload={balData ? () => downloadJson(balData, 'balance_general.json') : undefined} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard title="Estado de Resultados" icon={<PnLIcon />} accentColor="#10B981"
                        hasData={!!pnlData} isLoading={pnlLoading}
                        onViewChart={() => setActiveChart(activeChart === 'pnl' ? null : 'pnl')}
                        onDownload={pnlData ? () => downloadJson(pnlData, 'estado_resultados.json') : undefined} />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportSummaryCard title="Flujo de Caja" icon={<CashFlowIcon />} accentColor="#F59E0B"
                        hasData={!!cfData} isLoading={cfLoading}
                        onViewChart={() => setActiveChart(activeChart === 'cashflow' ? null : 'cashflow')}
                        onDownload={cfData ? () => downloadJson(cfData, 'flujo_caja.json') : undefined} />
                </Grid>
            </Grid>

            {/* KPI summary row when balance is available */}
            {balData && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <Grid container spacing={2} textAlign="center">
                        {[
                            { label: 'Activos', value: balData.activos, color: '#6366F1' },
                            { label: 'Pasivos', value: balData.pasivos, color: '#EF4444' },
                            { label: 'Utilidad Neta', value: balData.utilidad_neta, color: balData.utilidad_neta >= 0 ? '#10B981' : '#EF4444' },
                        ].map(({ label, value, color }) => (
                            <Grid item xs={4} key={label}>
                                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>{formatCOP(value)}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Chart panel */}
            {activeChart && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {activeChart === 'balance' && 'Balance General'}
                            {activeChart === 'pnl' && 'Estado de Resultados'}
                            {activeChart === 'cashflow' && 'Flujo de Caja — Cuentas de efectivo'}
                        </Typography>
                        <Button size="small" onClick={() => setActiveChart(null)} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Cerrar</Button>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />
                    {activeChart === 'balance' && balanceChartData.length > 0 && (
                        <FinancialChart type="bar" data={balanceChartData} height={280}
                            series={[{ key: 'valor', label: 'COP', color: '#6366F1' }]} />
                    )}
                    {activeChart === 'pnl' && pnlChartData.length > 0 && (
                        <FinancialChart type="bar" data={pnlChartData} height={280}
                            series={[{ key: 'valor', label: 'COP', color: '#10B981' }]} />
                    )}
                    {activeChart === 'cashflow' && cfChartData.length > 0 && (
                        <FinancialChart type="bar" data={cfChartData} height={280}
                            series={[{ key: 'valor', label: 'COP', color: '#F59E0B' }]} />
                    )}
                </Paper>
            )}

            {/* Financial statements (Via B) */}
            <FinancialStatementsSection />
        </Box>
    );
}
