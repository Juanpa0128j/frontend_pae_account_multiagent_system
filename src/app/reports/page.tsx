'use client';

import { useState } from 'react';
import { Box, Grid, Paper, Typography, Button, Divider, Alert } from '@mui/material';
import {
    AccountBalance as BalanceIcon,
    TrendingUp as PnLIcon,
    Waves as CashFlowIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import ReportCard from '@/components/reports/ReportCard';
import FinancialChart from '@/components/reports/FinancialChart';
import { useBalance, useProfitAndLoss, useCashFlow } from '@/hooks/useReports';
import { formatCOP } from '@/lib/formatters';

// Fallback chart data used when backend is unavailable
const BALANCE_CHART_DATA = [
    { name: 'Activos Ctes.', activos: 18_500_000, pasivos: 0 },
    { name: 'Activos NC', activos: 26_700_000, pasivos: 0 },
    { name: 'Pasivos Ctes.', activos: 0, pasivos: 12_300_000 },
    { name: 'Pasivos NC', activos: 0, pasivos: 8_400_000 },
    { name: 'Patrimonio', activos: 0, pasivos: 24_500_000 },
];

const PNL_CHART_DATA = [
    { name: 'Sep', ingresos: 85_000_000, costos: 62_000_000, utilidad: 23_000_000 },
    { name: 'Oct', ingresos: 92_000_000, costos: 71_000_000, utilidad: 21_000_000 },
    { name: 'Nov', ingresos: 78_000_000, costos: 59_000_000, utilidad: 19_000_000 },
    { name: 'Dic', ingresos: 110_000_000, costos: 88_000_000, utilidad: 22_000_000 },
    { name: 'Ene', ingresos: 95_000_000, costos: 67_000_000, utilidad: 28_000_000 },
    { name: 'Feb', ingresos: 102_000_000, costos: 74_000_000, utilidad: 28_000_000 },
];

const CASHFLOW_DATA = [
    { name: 'Sep', entradas: 90_000_000, salidas: 70_000_000 },
    { name: 'Oct', entradas: 85_000_000, salidas: 78_000_000 },
    { name: 'Nov', entradas: 72_000_000, salidas: 65_000_000 },
    { name: 'Dic', entradas: 115_000_000, salidas: 95_000_000 },
    { name: 'Ene', entradas: 88_000_000, salidas: 71_000_000 },
    { name: 'Feb', entradas: 105_000_000, salidas: 78_000_000 },
];

type ActiveReport = 'balance' | 'pnl' | 'cashflow' | null;

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ActiveReport>(null);
    const { data: balData, isLoading: balLoading } = useBalance(activeReport === 'balance');
    const { data: pnlData, isLoading: pnlLoading } = useProfitAndLoss(activeReport === 'pnl');
    const { data: cfData, isLoading: cfLoading } = useCashFlow(activeReport === 'cashflow');

    // Build chart data from API response when available, otherwise fall back to mock
    const balanceChartData = balData
        ? [
              { name: 'Activos Ctes.', activos: Object.values(balData.assets.current).reduce((s, v) => s + v, 0), pasivos: 0 },
              { name: 'Activos NC', activos: Object.values(balData.assets.non_current).reduce((s, v) => s + v, 0), pasivos: 0 },
              { name: 'Pasivos Ctes.', activos: 0, pasivos: Object.values(balData.liabilities.current).reduce((s, v) => s + v, 0) },
              { name: 'Pasivos NC', activos: 0, pasivos: Object.values(balData.liabilities.non_current).reduce((s, v) => s + v, 0) },
              { name: 'Patrimonio', activos: 0, pasivos: balData.equity.total },
          ]
        : BALANCE_CHART_DATA;

    const pnlChartData = pnlData
        ? Object.entries(pnlData.revenue).map(([name, ingresos]) => ({
              name,
              ingresos,
              costos: pnlData.expenses[name] ?? 0,
              utilidad: (ingresos as number) - ((pnlData.expenses[name] as number) ?? 0),
          }))
        : PNL_CHART_DATA;

    const cfChartData = cfData
        ? Object.entries(cfData.operating_activities).map(([name, entradas]) => ({
              name,
              entradas: entradas as number,
              salidas: 0,
          }))
        : CASHFLOW_DATA;

    const handleDownload = () => {
        if (activeReport === 'balance' && balData) downloadJson(balData, 'balance_general.json');
        else if (activeReport === 'pnl' && pnlData) downloadJson(pnlData, 'estado_resultados.json');
        else if (activeReport === 'cashflow' && cfData) downloadJson(cfData, 'flujo_caja.json');
    };

    return (
        <Box>
            <PageHeader
                title="Reportes Financieros"
                subtitle="Genera y visualiza los estados financieros del período seleccionado."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reportes financieros' }]}
            />

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <ReportCard
                        title="Balance General"
                        description="Activos, pasivos y patrimonio. Vista del estado financiero en un punto del tiempo."
                        icon={<BalanceIcon />}
                        accentColor="#6366F1"
                        onGenerate={() => setActiveReport('balance')}
                        onDownload={activeReport === 'balance' ? handleDownload : undefined}
                        loading={balLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportCard
                        title="Estado de Resultados"
                        description="Ingresos, costos y utilidad neta. Tendencia mensual del período seleccionado."
                        icon={<PnLIcon />}
                        accentColor="#10B981"
                        onGenerate={() => setActiveReport('pnl')}
                        onDownload={activeReport === 'pnl' ? handleDownload : undefined}
                        loading={pnlLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <ReportCard
                        title="Flujo de Caja"
                        description="Entradas y salidas de efectivo. Análisis de liquidez operativa, inversión y financiación."
                        icon={<CashFlowIcon />}
                        accentColor="#F59E0B"
                        onGenerate={() => setActiveReport('cashflow')}
                        onDownload={activeReport === 'cashflow' ? handleDownload : undefined}
                        loading={cfLoading}
                    />
                </Grid>
            </Grid>

            {/* Chart area */}
            {activeReport && (
                <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {activeReport === 'balance' && 'Balance General — Febrero 2026'}
                            {activeReport === 'pnl' && 'Estado de Resultados — Últimos 6 meses'}
                            {activeReport === 'cashflow' && 'Flujo de Caja — Últimos 6 meses'}
                        </Typography>
                        <Button size="small" onClick={() => setActiveReport(null)} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            Cerrar
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2.5 }} />

                    {activeReport === 'balance' && (
                        <FinancialChart
                            type="bar"
                            data={balanceChartData}
                            series={[
                                { key: 'activos', label: 'Activos', color: '#6366F1' },
                                { key: 'pasivos', label: 'Pasivos + Patrimonio', color: '#10B981' },
                            ]}
                            height={300}
                        />
                    )}
                    {activeReport === 'pnl' && (
                        <FinancialChart
                            type="line"
                            data={pnlChartData}
                            series={[
                                { key: 'ingresos', label: 'Ingresos', color: '#10B981' },
                                { key: 'costos', label: 'Costos', color: '#EF4444' },
                                { key: 'utilidad', label: 'Utilidad', color: '#6366F1' },
                            ]}
                            height={300}
                        />
                    )}
                    {activeReport === 'cashflow' && (
                        <FinancialChart
                            type="area"
                            data={cfChartData}
                            series={[
                                { key: 'entradas', label: 'Entradas', color: '#10B981' },
                                { key: 'salidas', label: 'Salidas', color: '#F59E0B' },
                            ]}
                            height={300}
                        />
                    )}

                    {balLoading || pnlLoading || cfLoading ? (
                        <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem', borderRadius: 2 }}>
                            Cargando datos desde el backend...
                        </Alert>
                    ) : !balData && !pnlData && !cfData ? (
                        <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem', borderRadius: 2 }}>
                            Backend no disponible — mostrando datos de referencia. Conecta el backend en{' '}
                            <code>NEXT_PUBLIC_API_URL</code> para datos reales.
                        </Alert>
                    ) : null}
                </Paper>
            )}
        </Box>
    );
}
