'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Divider,
    Chip,
    Skeleton,
} from '@mui/material';
import {
    UploadFile as UploadIcon,
    TrendingUp as TrendingIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import FinancialChart from '@/components/reports/FinancialChart';
import { useTransactions } from '@/hooks/useTransactions';
import { formatDate, currentPeriodLabel } from '@/lib/formatters';

// ---------------------------------------------------------------------------
// Antigravity Counter Card
// ---------------------------------------------------------------------------

interface CounterCardProps {
    label: string;
    value: number;
    unit?: string;
    accent: string;
    icon: React.ReactNode;
    prefix?: string;
    isLoading?: boolean;
    compact?: boolean;
    suffix?: string;
    highlight?: boolean;
}

function useCountUp(target: number, duration = 1200, enabled = true) {
    const [current, setCurrent] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const start = performance.now();
        const startValue = 0;

        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(startValue + (target - startValue) * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration, enabled]);

    return current;
}

function CounterDigits({ value, compact }: { value: number; compact?: boolean }) {
    const formatted = compact
        ? value >= 1_000_000_000
            ? `${(value / 1_000_000_000).toFixed(1)}B`
            : value >= 1_000_000
                ? `${(value / 1_000_000).toFixed(1)}M`
                : value >= 1_000
                    ? `${(value / 1_000).toFixed(0)}K`
                    : String(value)
        : String(value);

    return (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            {formatted.split('').map((char, i) => (
                <Box
                    key={i}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: /\d/.test(char) ? { xs: '0.7em', sm: '0.75em' } : '0.35em',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {char}
                </Box>
            ))}
        </Box>
    );
}

function AntigravityCounterCard({
    label,
    value,
    accent,
    icon,
    prefix = '',
    isLoading = false,
    compact = false,
    suffix = '',
    highlight = false,
}: CounterCardProps) {
    const animated = useCountUp(value, 1400, !isLoading);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 2.5 },
                border: `1px solid ${accent}30`,
                borderRadius: 3,
                bgcolor: `${accent}07`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                '&:hover': {
                    border: `1px solid ${accent}55`,
                    bgcolor: `${accent}10`,
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 32px ${accent}20`,
                },
                // Glow effect
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    bgcolor: `${accent}10`,
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                },
                ...(highlight && {
                    border: `1px solid ${accent}50`,
                    boxShadow: `0 0 0 1px ${accent}20, 0 8px 24px ${accent}15`,
                }),
            }}
        >
            {/* Icon chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: `${accent}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accent,
                        boxShadow: `0 0 12px ${accent}25`,
                    }}
                >
                    {icon}
                </Box>
                {highlight && (
                    <Chip
                        size="small"
                        icon={<BoltIcon sx={{ fontSize: '10px !important', color: `${accent} !important` }} />}
                        label="LIVE"
                        sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            bgcolor: `${accent}15`,
                            color: accent,
                            border: `1px solid ${accent}30`,
                        }}
                    />
                )}
            </Box>

            {/* Counter value */}
            {isLoading ? (
                <Skeleton variant="text" width="60%" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
            ) : (
                <Typography
                    component="div"
                    sx={{
                        fontSize: { xs: '1.8rem', sm: '2.2rem' },
                        fontWeight: 800,
                        fontFamily: '"SF Mono", "Roboto Mono", "Courier New", monospace',
                        color: accent,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        mb: 0.5,
                        textShadow: `0 0 24px ${accent}50`,
                    }}
                >
                    {prefix}
                    <CounterDigits value={animated} compact={compact} />
                    {suffix}
                </Typography>
            )}

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                {label}
            </Typography>
        </Paper>
    );
}

// ---------------------------------------------------------------------------
// Mock chart data
// ---------------------------------------------------------------------------
const CHART_DATA = [
    { name: 'Sep', ingresos: 85_000_000, gastos: 62_000_000 },
    { name: 'Oct', ingresos: 92_000_000, gastos: 71_000_000 },
    { name: 'Nov', ingresos: 78_000_000, gastos: 59_000_000 },
    { name: 'Dic', ingresos: 110_000_000, gastos: 88_000_000 },
    { name: 'Ene', ingresos: 95_000_000, gastos: 67_000_000 },
    { name: 'Feb', ingresos: 102_000_000, gastos: 74_000_000 },
];

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
    const router = useRouter();
    const { data: transactions, isLoading } = useTransactions();
    const recentTx = transactions?.slice(0, 5) ?? [];

    return (
        <Box>
            <PageHeader
                title="Dashboard"
                subtitle={`Período actual: ${currentPeriodLabel()}`}
                action={
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={() => router.push('/upload')}
                        id="btn-upload-documents"
                        size="large"
                        sx={{ px: 3 }}
                    >
                        Cargar documentos
                    </Button>
                }
            />

            {/* ── Antigravity Counters ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <BoltIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            Agregados del sistema — Antigravity
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                    </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                    <AntigravityCounterCard
                        label="Documentos pendientes"
                        value={12}
                        accent="#F59E0B"
                        icon={<TrendingIcon fontSize="small" />}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <AntigravityCounterCard
                        label="Transacciones del mes"
                        value={84}
                        accent="#6366F1"
                        icon={<BoltIcon fontSize="small" />}
                        highlight
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <AntigravityCounterCard
                        label="Alertas activas"
                        value={3}
                        accent="#EF4444"
                        icon={<UploadIcon fontSize="small" />}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <AntigravityCounterCard
                        label="Total activos COP"
                        value={45_200_000}
                        accent="#10B981"
                        icon={<TrendingIcon fontSize="small" />}
                        prefix="$"
                        compact
                        highlight
                    />
                </Grid>
            </Grid>

            {/* ── Charts + Recent Transactions ── */}
            <Grid container spacing={2.5}>
                {/* Chart */}
                <Grid item xs={12} md={7}>
                    <Paper
                        elevation={0}
                        sx={{ p: 2.5, height: '100%', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Ingresos vs Gastos
                            </Typography>
                            <Chip size="small" label="Últimos 6 meses" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(255,255,255,0.05)' }} />
                        </Box>
                        <FinancialChart
                            type="bar"
                            data={CHART_DATA}
                            series={[
                                { key: 'ingresos', label: 'Ingresos', color: '#10B981' },
                                { key: 'gastos', label: 'Gastos', color: '#6366F1' },
                            ]}
                            height={240}
                            showReferenceLine
                        />
                    </Paper>
                </Grid>

                {/* Recent Transactions */}
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={0}
                        sx={{ p: 2.5, height: '100%', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Últimas transacciones
                            </Typography>
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => router.push('/transactions')}
                                sx={{ fontSize: '0.75rem', color: 'primary.light', px: 1, py: 0.25 }}
                            >
                                Ver todas →
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                                        <Skeleton width="50%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                                        <Skeleton width="30%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                                    </Box>
                                ))
                                : recentTx.map((tx, i) => (
                                    <Box
                                        key={tx.id}
                                        onClick={() => router.push(`/transactions/${tx.id}`)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            py: 0.75,
                                            px: 1,
                                            borderRadius: 1.5,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                                            borderBottom: i < recentTx.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="caption" fontWeight={600} color="text.primary" display="block" noWrap sx={{ maxWidth: 180 }}>
                                                {tx.concepto}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(tx.fecha)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                            <MoneyDisplay value={tx.total} variant="caption" compact />
                                            <StatusBadge status={tx.status} />
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
