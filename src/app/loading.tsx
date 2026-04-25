/**
 * Global loading skeleton for all App Router pages.
 * Renders instantly while the route bundle/component tree is loading,
 * so navigation feels snappy even on first cold-compile in dev.
 *
 * Brutalist style: massive ghost number + pulse bar — no spinners,
 * no shimmer placeholders. Visual continuity with the rest of the app.
 */

import { Box, Typography } from '@mui/material';
import { palette, fonts, sxLabel } from '@/styles/brutalist';

export default function Loading() {
    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                pt: { xs: 4, md: 8 },
                pb: { xs: 5, md: 7 },
                overflow: 'hidden',
            }}
        >
            {/* Eyebrow with pulsing dot */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: { xs: 2, md: 3 },
                }}
            >
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        bgcolor: palette.chartreuse,
                        borderRadius: '50%',
                        boxShadow: `0 0 12px ${palette.chartreuse}`,
                        animation: 'pulse 1s infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.3 },
                        },
                    }}
                />
                <Typography sx={{ ...sxLabel, color: palette.chartreuse }}>
                    {'// CARGANDO'}
                </Typography>
            </Box>

            {/* Skeleton title */}
            <Box
                sx={{
                    height: { xs: 56, sm: 80, md: 110 },
                    width: { xs: '60%', md: '40%' },
                    bgcolor: 'rgba(255,255,255,0.05)',
                    mb: 1.5,
                    animation: 'sweep 1.4s infinite',
                    '@keyframes sweep': {
                        '0%, 100%': { opacity: 0.5 },
                        '50%': { opacity: 1 },
                    },
                }}
            />
            <Box
                sx={{
                    height: { xs: 48, sm: 70, md: 100 },
                    width: { xs: '80%', md: '55%' },
                    bgcolor: 'rgba(255,255,255,0.04)',
                    mb: 4,
                    animation: 'sweep 1.4s 0.15s infinite',
                }}
            />

            {/* Subtitle skeleton */}
            <Box
                sx={{
                    height: 16,
                    width: { xs: '40%', md: '25%' },
                    bgcolor: 'rgba(255,255,255,0.04)',
                    mb: 1,
                }}
            />

            {/* Lede skeleton */}
            <Box
                sx={{
                    height: 12,
                    width: '70%',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    mb: 0.6,
                    mt: 4,
                }}
            />
            <Box sx={{ height: 12, width: '60%', bgcolor: 'rgba(255,255,255,0.03)', mb: 0.6 }} />
            <Box sx={{ height: 12, width: '50%', bgcolor: 'rgba(255,255,255,0.03)', mb: 4 }} />

            {/* Loading progress bar */}
            <Box
                sx={{
                    mt: 'auto',
                    pt: 4,
                    borderTop: `1px solid ${palette.line}`,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        color: palette.paperGhost,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        mb: 1.5,
                    }}
                >
                    {'// COMPILANDO MÓDULO'}
                </Typography>
                <Box sx={{ position: 'relative', height: 2, bgcolor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            width: '30%',
                            background: `linear-gradient(90deg, transparent, ${palette.chartreuse}, transparent)`,
                            animation: 'scan 1.6s linear infinite',
                            '@keyframes scan': {
                                '0%': { transform: 'translateX(-100%)' },
                                '100%': { transform: 'translateX(400%)' },
                            },
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
