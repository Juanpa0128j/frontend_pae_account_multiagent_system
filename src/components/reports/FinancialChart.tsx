'use client';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { formatCOP } from '@/lib/formatters';

type ChartType = 'bar' | 'line' | 'area';

interface DataPoint {
    name: string;
    [key: string]: number | string;
}

interface SeriesConfig {
    key: string;
    label: string;
    color: string;
}

interface FinancialChartProps {
    type: ChartType;
    data: DataPoint[];
    series: SeriesConfig[];
    height?: number;
    showGrid?: boolean;
    showReferenceLine?: boolean;
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <Box
            sx={{
                bgcolor: '#1F2937',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                p: 1.5,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
        >
            <Typography
                variant="caption"
                fontWeight={700}
                display="block"
                sx={{ mb: 0.5, color: 'text.secondary' }}
            >
                {label}
            </Typography>
            {payload.map((entry) => (
                <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: entry.color,
                            flexShrink: 0,
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {entry.name}:
                    </Typography>
                    <Typography variant="caption" fontWeight={700} fontFamily="monospace">
                        {formatCOP(entry.value, { compact: true })}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

export default function FinancialChart({
    type,
    data,
    series,
    height = 280,
    showGrid = true,
    showReferenceLine = false,
}: FinancialChartProps) {
    const axisStyle = { fontSize: 11, fill: '#6B7280', fontFamily: 'monospace' };

    const commonProps = {
        data,
        margin: { top: 8, right: 8, left: 8, bottom: 8 },
    };

    const renderChart = () => {
        if (type === 'bar') {
            return (
                <BarChart {...commonProps}>
                    {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    )}
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCOP(v, { compact: true })}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                    {showReferenceLine && <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />}
                    {series.map((s) => (
                        <Bar
                            key={s.key}
                            dataKey={s.key}
                            name={s.label}
                            fill={s.color}
                            radius={[4, 4, 0, 0]}
                            opacity={0.9}
                        />
                    ))}
                </BarChart>
            );
        }

        if (type === 'line') {
            return (
                <LineChart {...commonProps}>
                    {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    )}
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCOP(v, { compact: true })}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                    {series.map((s) => (
                        <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.key}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: s.color }}
                            activeDot={{ r: 5 }}
                        />
                    ))}
                </LineChart>
            );
        }

        return (
            <AreaChart {...commonProps}>
                {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                )}
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCOP(v, { compact: true })}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                {series.map((s, i) => (
                    <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        fill={`${s.color}20`}
                        strokeWidth={2.5}
                        fillOpacity={0.6}
                        stackId={String(i)}
                    />
                ))}
            </AreaChart>
        );
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: { xs: Math.round(height * 0.78), sm: Math.round(height * 0.9), md: height },
            }}
        >
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </Box>
    );
}
