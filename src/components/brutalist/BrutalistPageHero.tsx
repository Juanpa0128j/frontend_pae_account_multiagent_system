'use client';

import { ReactNode } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { palette, fonts, typeScale, motion, sxLabel } from '@/styles/brutalist';

const slideInUp = keyframes`
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
`;

const flicker = keyframes`
    0%, 100% { opacity: 1; }
    97% { opacity: 1; }
    98% { opacity: 0.2; }
    99% { opacity: 1; }
`;

interface BrutalistPageHeroProps {
    /** Mono prefix label, e.g. "// REPORTES // FINANCIEROS" */
    eyebrow: string;
    /** Big display title — split with <br /> for line control */
    title: ReactNode;
    /** Optional italic subtitle (gradient or plain) */
    subtitle?: ReactNode;
    /** Lede paragraph */
    lede?: ReactNode;
    /** Accent color (use moduleAccents.x) */
    accent: string;
    /** Optional KPI strip below */
    kpis?: { value: string; label: string }[];
    /** Optional ghost number on right */
    ghostNumber?: string;
    /** Right-side action area */
    action?: ReactNode;
}

export default function BrutalistPageHero({
    eyebrow,
    title,
    subtitle,
    lede,
    accent,
    kpis,
    ghostNumber,
    action,
}: BrutalistPageHeroProps) {
    return (
        <Box
            sx={{
                position: 'relative',
                pt: { xs: 4, md: 6 },
                pb: { xs: 5, md: 7 },
                mb: { xs: 4, md: 6 },
                borderBottom: `1px solid ${palette.line}`,
                overflow: 'hidden',
            }}
        >
            {/* Ghost number */}
            {ghostNumber && (
                <Typography
                    sx={{
                        position: 'absolute',
                        top: -30,
                        right: { xs: -20, md: -10 },
                        fontFamily: fonts.display,
                        fontSize: { xs: '10rem', md: '18rem' },
                        fontWeight: 800,
                        lineHeight: 0.8,
                        letterSpacing: '-0.08em',
                        color: 'transparent',
                        WebkitTextStroke: `1px ${accent}22`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 0,
                    }}
                >
                    {ghostNumber}
                </Typography>
            )}

            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 3,
                }}
            >
                <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                    {/* Eyebrow with pulsing dot */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: { xs: 1.5, md: 2.5 },
                            animation: `${slideInUp} 0.6s ${motion.snap} 0.05s both`,
                        }}
                    >
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                bgcolor: accent,
                                borderRadius: '50%',
                                animation: `${flicker} 2.5s infinite`,
                                boxShadow: `0 0 12px ${accent}`,
                            }}
                        />
                        <Typography sx={{ ...sxLabel, color: accent }}>{eyebrow}</Typography>
                    </Box>

                    {/* Title */}
                    <Typography
                        component="h1"
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: typeScale.pageTitle,
                            fontWeight: 800,
                            lineHeight: 0.95,
                            letterSpacing: '-0.04em',
                            color: palette.paper,
                            textTransform: 'uppercase',
                            pt: '0.05em',
                            animation: `${slideInUp} 0.8s ${motion.snap} 0.15s both`,
                        }}
                    >
                        {title}
                    </Typography>

                    {/* Subtitle */}
                    {subtitle && (
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: typeScale.subtitle,
                                fontStyle: 'italic',
                                fontWeight: 400,
                                color: palette.paperFaint,
                                mt: 1,
                                letterSpacing: '-0.01em',
                                animation: `${slideInUp} 0.7s ${motion.snap} 0.3s both`,
                            }}
                        >
                            — {subtitle}
                        </Typography>
                    )}

                    {/* Lede */}
                    {lede && (
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: typeScale.body,
                                lineHeight: 1.65,
                                color: palette.paperDim,
                                fontWeight: 300,
                                maxWidth: 680,
                                mt: { xs: 2, md: 3 },
                                animation: `${slideInUp} 0.7s ${motion.snap} 0.4s both`,
                            }}
                        >
                            {lede}
                        </Typography>
                    )}
                </Box>

                {/* Right action area */}
                {action && (
                    <Box sx={{ flexShrink: 0, animation: `${slideInUp} 0.7s ${motion.snap} 0.5s both` }}>
                        {action}
                    </Box>
                )}
            </Box>

            {/* KPI strip */}
            {kpis && kpis.length > 0 && (
                <Box
                    sx={{
                        mt: { xs: 4, md: 5 },
                        display: 'flex',
                        gap: { xs: 3, md: 6 },
                        flexWrap: 'wrap',
                        py: 2.5,
                        borderTop: `1px solid ${palette.line}`,
                        borderBottom: `1px solid ${palette.line}`,
                        position: 'relative',
                        zIndex: 1,
                        animation: `${slideInUp} 0.7s ${motion.snap} 0.55s both`,
                    }}
                >
                    {kpis.map((kpi) => (
                        <Box key={kpi.label}>
                            <Typography
                                sx={{
                                    fontFamily: fonts.display,
                                    fontSize: typeScale.kpiNumber,
                                    fontWeight: 700,
                                    lineHeight: 0.95,
                                    color: accent,
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {kpi.value}
                            </Typography>
                            <Typography
                                sx={{
                                    ...sxLabel,
                                    fontSize: typeScale.monoTiny,
                                    color: palette.paperFaint,
                                    mt: 0.5,
                                }}
                            >
                                {kpi.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
