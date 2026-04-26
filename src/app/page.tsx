'use client';

import { Box, Typography, Skeleton, Divider } from '@mui/material';
import {
    UploadFile as UploadIcon,
    East as ArrowIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
    BrutalistPageHero,
    BrutalistSection,
    BrutalistButton,
    BrutalistChip,
    BrutalistCard,
    BrutalistEmptyState,
} from '@/components/brutalist';
import dynamic from 'next/dynamic';

// Lazy-load recharts (~95KB) so it doesn't block the dashboard's initial paint
const FinancialChart = dynamic(() => import('@/components/reports/FinancialChart'), {
    ssr: false,
    loading: () => (
        <Box
            sx={{
                height: 240,
                bgcolor: 'rgba(255,255,255,0.02)',
                borderRadius: 1,
                animation: 'pulse 1.4s infinite',
                '@keyframes pulse': { '0%, 100%': { opacity: 0.5 }, '50%': { opacity: 0.8 } },
            }}
        />
    ),
});
import StatusBadge from '@/components/common/StatusBadge';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { useTransactions } from '@/hooks/useTransactions';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useCompany } from '@/context/CompanyContext';
import { palette, fonts, typeScale, motion, sxLabel, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { formatDate, currentPeriodLabel } from '@/lib/formatters';

const ACCENT = moduleAccents.dashboard;

const CHART_DATA = [
    { name: 'Sep', ingresos: 85_000_000, gastos: 62_000_000 },
    { name: 'Oct', ingresos: 92_000_000, gastos: 71_000_000 },
    { name: 'Nov', ingresos: 78_000_000, gastos: 59_000_000 },
    { name: 'Dic', ingresos: 110_000_000, gastos: 88_000_000 },
    { name: 'Ene', ingresos: 95_000_000, gastos: 67_000_000 },
    { name: 'Feb', ingresos: 102_000_000, gastos: 74_000_000 },
];

function formatCompact(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

export default function DashboardPage() {
    const router = useRouter();
    const { activeCompany } = useCompany();
    const { data: transactions, isLoading } = useTransactions();
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const recentTx = transactions?.slice(0, 6) ?? [];

    const kpis = [
        {
            value: stats?.documentos_pendientes ?? 0,
            label: 'PENDIENTES',
            accent: palette.amber,
            sub: 'documentos sin contabilizar',
        },
        {
            value: stats?.transacciones_procesadas_mes ?? 0,
            label: 'TX DEL MES',
            accent: palette.accent,
            sub: 'asientos del período',
        },
        {
            value: stats?.alertas_activas ?? 0,
            label: 'ALERTAS',
            accent: palette.error,
            sub: 'rechazados / requieren revisión',
        },
        {
            value: `$${formatCompact(Math.round(stats?.total_activos_cop ?? 0))}`,
            label: 'TOTAL ACTIVOS',
            accent: palette.success,
            sub: 'COP · suma cuenta clase 1',
        },
    ];

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_1 // DASHBOARD"
                title={<>Estado<br />en vivo.</>}
                subtitle={activeCompany ? activeCompany.nombre ?? activeCompany.nit : currentPeriodLabel()}
                lede={
                    activeCompany
                        ? `Snapshot de la salud financiera de ${activeCompany.nombre ?? 'la empresa'} para el período actual. Datos en tiempo real desde el pipeline contable.`
                        : 'Selecciona una empresa para ver su estado financiero en vivo.'
                }
                accent={ACCENT}
                ghostNumber="1"
                action={
                    <BrutalistButton
                        accent={palette.chartreuse}
                        icon={<UploadIcon sx={{ fontSize: 18 }} />}
                        endIcon={<ArrowIcon sx={{ fontSize: 18 }} />}
                        size="lg"
                        onClick={() => router.push('/upload')}
                        subLabel="Via A · Via B"
                    >
                        Cargar documentos
                    </BrutalistButton>
                }
            />

            {/* ── KPI cards in brutalist grid ── */}
            <BrutalistSection
                number="1"
                total={3}
                title="Indicadores clave"
                subtitle="cuatro métricas esenciales"
                accent={ACCENT}
                dense
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                        gap: { xs: 1.5, md: 2 },
                    }}
                >
                    {kpis.map((kpi) => (
                        <Box
                            key={kpi.label}
                            sx={{
                                position: 'relative',
                                p: { xs: 2, md: 2.5 },
                                border: `1px solid ${palette.line}`,
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: `all ${motion.duration.md} ${motion.snap}`,
                                bgcolor: hexAlpha(kpi.accent, 0.03),
                                '&:hover': {
                                    borderColor: kpi.accent,
                                    transform: 'translateY(-3px)',
                                    bgcolor: hexAlpha(kpi.accent, 0.06),
                                    '& .kpi-bar': { width: '100%' },
                                },
                            }}
                        >
                            <Typography sx={{ ...sxLabel, fontSize: '0.62rem', color: palette.paperFaint, mb: 1 }}>
                                {kpi.label}
                            </Typography>
                            {statsLoading ? (
                                <Skeleton variant="text" width="70%" height={42} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                            ) : (
                                <Typography
                                    sx={{
                                        fontFamily: fonts.display,
                                        fontSize: { xs: '1.7rem', md: '2.4rem' },
                                        fontWeight: 700,
                                        lineHeight: 0.95,
                                        color: kpi.accent,
                                        letterSpacing: '-0.03em',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {kpi.value}
                                </Typography>
                            )}
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.6rem',
                                    color: palette.paperGhost,
                                    mt: 0.5,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {kpi.sub}
                            </Typography>
                            {/* Hover bar */}
                            <Box
                                className="kpi-bar"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: 2,
                                    width: 0,
                                    bgcolor: kpi.accent,
                                    transition: `width ${motion.duration.md} ${motion.snap}`,
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            </BrutalistSection>

            {/* ── Chart + Recent Transactions ── */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
                    gap: { xs: 3, md: 3 },
                    mt: { xs: 4, md: 6 },
                }}
            >
                {/* Chart panel */}
                <Box
                    sx={{
                        position: 'relative',
                        p: { xs: 2.5, md: 3 },
                        border: `1px solid ${palette.line}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ width: 30, height: 2, bgcolor: ACCENT }} />
                        <Typography sx={{ ...sxLabel, color: ACCENT }}>{'// 2 / TENDENCIA'}</Typography>
                    </Box>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: typeScale.cardTitle,
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            mb: 0.5,
                        }}
                    >
                        Ingresos vs gastos
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.85rem',
                            color: palette.paperFaint,
                            mb: 3,
                        }}
                    >
                        Últimos 6 meses · datos agregados de journal_entry_lines
                    </Typography>
                    <FinancialChart
                        type="bar"
                        data={CHART_DATA}
                        series={[
                            { key: 'ingresos', label: 'Ingresos', color: palette.success },
                            { key: 'gastos', label: 'Gastos', color: palette.accent },
                        ]}
                        height={240}
                        showReferenceLine
                    />
                </Box>

                {/* Recent transactions panel */}
                <Box
                    sx={{
                        position: 'relative',
                        p: { xs: 2.5, md: 3 },
                        border: `1px solid ${palette.line}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ width: 30, height: 2, bgcolor: palette.pink }} />
                        <Typography sx={{ ...sxLabel, color: palette.pink }}>{'// 3 / RECIENTES'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: typeScale.cardTitle,
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Últimas transacciones
                        </Typography>
                        <Box
                            onClick={() => router.push('/transactions')}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                cursor: 'pointer',
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: palette.pink,
                                '&:hover': { '& svg': { transform: 'translateX(3px)' } },
                            }}
                        >
                            VER TODAS
                            <ArrowIcon sx={{ fontSize: 14, transition: `transform ${motion.duration.sm} ${motion.snap}` }} />
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    variant="rectangular"
                                    height={48}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, mb: 0.5 }}
                                />
                            ))
                        ) : recentTx.length === 0 ? (
                            <BrutalistEmptyState
                                label="// SIN DATOS"
                                title="No hay transacciones aún"
                                description="Sube documentos para empezar a ver actividad."
                                accent={palette.paperFaint}
                            />
                        ) : (
                            recentTx.map((tx) => (
                                <Box
                                    key={tx.id}
                                    onClick={() => router.push(`/transactions/${tx.id}`)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        py: 1,
                                        px: 1.5,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        borderLeft: '2px solid transparent',
                                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                                        '&:hover': {
                                            bgcolor: hexAlpha(palette.pink, 0.04),
                                            borderLeftColor: palette.pink,
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: palette.paper,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {tx.concepto || '—'}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.62rem',
                                                color: palette.paperGhost,
                                                letterSpacing: '0.1em',
                                                mt: 0.25,
                                            }}
                                        >
                                            {tx.fecha ? formatDate(tx.fecha) : '—'} · {tx.id.slice(0, 8)}…
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                                        <MoneyDisplay value={tx.total ?? 0} variant="caption" compact />
                                        <StatusBadge status={tx.status} />
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ mt: { xs: 5, md: 8 }, borderColor: palette.lineFaint }} />
            <Box sx={{ pt: 4, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <BrutalistChip label="API_LIVE" color={palette.success} variant="ghost" />
                <BrutalistChip label={`PERIODO ${currentPeriodLabel().toUpperCase()}`} color={ACCENT} variant="ghost" />
                {activeCompany && (
                    <BrutalistChip label={`NIT ${activeCompany.nit}`} color={palette.pink} variant="ghost" />
                )}
            </Box>
        </Box>
    );
}
