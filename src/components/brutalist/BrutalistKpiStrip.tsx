'use client';

import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { palette, fonts, typeScale, sxLabel, motion } from '@/styles/brutalist';

export interface BrutalistKpi {
    label: string;
    value: ReactNode;
    /** Optional trend / sublabel */
    sub?: string;
    /** Override accent color for this specific KPI */
    accent?: string;
    /** Optional icon */
    icon?: ReactNode;
}

interface BrutalistKpiStripProps {
    kpis: BrutalistKpi[];
    /** Default accent for all KPIs */
    accent?: string;
    /** Variant: row (default) shows them in a flex row, grid in a 3/4-col grid */
    variant?: 'row' | 'grid';
    /** Border style */
    bordered?: boolean;
}

export default function BrutalistKpiStrip({
    kpis,
    accent = palette.accent,
    variant = 'row',
    bordered = true,
}: BrutalistKpiStripProps) {
    const containerSx =
        variant === 'grid'
            ? {
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${kpis.length}, 1fr)` },
                  gap: { xs: 2.5, md: 4 },
              }
            : {
                  display: 'flex',
                  gap: { xs: 3, md: 6 },
                  flexWrap: 'wrap' as const,
              };

    return (
        <Box
            sx={{
                py: 2.5,
                ...containerSx,
                borderTop: bordered ? `1px solid ${palette.line}` : 'none',
                borderBottom: bordered ? `1px solid ${palette.line}` : 'none',
            }}
        >
            {kpis.map((kpi) => {
                const c = kpi.accent ?? accent;
                return (
                    <Box
                        key={kpi.label}
                        sx={{
                            position: 'relative',
                            transition: `all ${motion.duration.sm} ${motion.snap}`,
                            '&:hover .kpi-bar': {
                                width: 24,
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            {kpi.icon && (
                                <Box sx={{ color: c, mt: 0.5, flexShrink: 0 }}>{kpi.icon}</Box>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        ...sxLabel,
                                        color: palette.paperFaint,
                                        mb: 0.5,
                                    }}
                                >
                                    {kpi.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.display,
                                        fontSize: typeScale.kpiNumber,
                                        fontWeight: 700,
                                        lineHeight: 0.95,
                                        color: c,
                                        letterSpacing: '-0.03em',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {kpi.value}
                                </Typography>
                                {kpi.sub && (
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.65rem',
                                            color: palette.paperGhost,
                                            mt: 0.5,
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        {kpi.sub}
                                    </Typography>
                                )}
                                {/* Hover bar */}
                                <Box
                                    className="kpi-bar"
                                    sx={{
                                        mt: 1,
                                        width: 12,
                                        height: 2,
                                        bgcolor: c,
                                        transition: `width ${motion.duration.md} ${motion.snap}`,
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
