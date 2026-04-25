'use client';

import { Box, Typography, keyframes } from '@mui/material';
import { SECTIONS } from './helpData';

const slideInUp = keyframes`
    from { opacity: 0; transform: translateY(80px) skewY(3deg); }
    to { opacity: 1; transform: translateY(0) skewY(0); }
`;

const flicker = keyframes`
    0%, 100% { opacity: 1; }
    97% { opacity: 1; }
    98% { opacity: 0.2; }
    99% { opacity: 1; }
`;

const marquee = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
`;

export default function HelpHero({ mouseXY }: { mouseXY: { x: number; y: number } }) {
    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: { xs: '85vh', md: '92vh' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                px: { xs: 3, sm: 6, md: 10 },
                py: { xs: 8, md: 12 },
                overflow: 'hidden',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Background diagonal stripes */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'repeating-linear-gradient(135deg, transparent 0 120px, rgba(99,102,241,0.04) 120px 121px)',
                    transform: `translate(${mouseXY.x * 20}px, ${mouseXY.y * 20}px)`,
                    transition: 'transform 0.4s ease-out',
                    pointerEvents: 'none',
                }}
            />

            {/* Top label */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: { xs: 3, md: 5 },
                    animation: `${slideInUp} 0.8s ease-out 0.1s both`,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <Box
                    sx={{
                        width: 10,
                        height: 10,
                        bgcolor: '#D4FF00',
                        borderRadius: '50%',
                        animation: `${flicker} 2s infinite`,
                        boxShadow: '0 0 16px #D4FF00',
                    }}
                />
                <Typography
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '0.75rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: '#D4FF00',
                        fontWeight: 500,
                    }}
                >
                    PAE_CONTABLE // MANUAL_v0.1
                </Typography>
            </Box>

            {/* Massive title */}
            <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 1100 }}>
                <Typography
                    component="h1"
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: { xs: '4rem', sm: '6rem', md: '9rem', lg: '12rem' },
                        fontWeight: 800,
                        // 0.95 leaves room for the diacritic on Ó so it isn't clipped
                        lineHeight: 0.95,
                        letterSpacing: '-0.05em',
                        color: '#FAFAF5',
                        animation: `${slideInUp} 1s cubic-bezier(0.2, 0.9, 0.3, 1) 0.25s both`,
                        textTransform: 'uppercase',
                        // Prevent ascenders from being clipped by parent overflow:hidden
                        pt: '0.12em',
                    }}
                >
                    <Box component="span" sx={{ display: 'block', pb: '0.05em' }}>
                        Cómo
                    </Box>
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-block',
                            background:
                                'linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #D4FF00 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontStyle: 'italic',
                            transform: `translate(${mouseXY.x * 8}px, ${mouseXY.y * 4}px)`,
                            transition: 'transform 0.3s ease-out',
                            // Italic + descender room
                            pb: '0.08em',
                        }}
                    >
                        usar esto
                    </Box>
                </Typography>
            </Box>

            {/* Lede */}
            <Typography
                sx={{
                    mt: { xs: 4, md: 6 },
                    maxWidth: 640,
                    fontFamily: 'var(--font-inter)',
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    lineHeight: 1.5,
                    color: 'rgba(250,250,245,0.75)',
                    fontWeight: 300,
                    animation: `${slideInUp} 0.9s ease-out 0.45s both`,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                Un sistema multiagente contable para Colombia.{' '}
                <Box component="span" sx={{ color: '#FAFAF5', fontWeight: 500 }}>
                    {SECTIONS.length} módulos,
                </Box>{' '}
                2 flujos de ingesta, 7 estados financieros generados automáticamente.
                Esta guía te ayuda a dominar cada capa.
            </Typography>

            {/* Stats strip */}
            <Box
                sx={{
                    mt: { xs: 6, md: 10 },
                    display: 'flex',
                    gap: { xs: 3, md: 8 },
                    flexWrap: 'wrap',
                    animation: `${slideInUp} 1s ease-out 0.65s both`,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {[
                    { num: SECTIONS.length, label: 'Módulos' },
                    { num: 2, label: 'Flujos (A / B)' },
                    { num: 7, label: 'Estados financieros' },
                    { num: '∞', label: 'Empresas' },
                ].map((stat) => (
                    <Box key={stat.label}>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: { xs: '2.5rem', md: '3.5rem' },
                                fontWeight: 700,
                                lineHeight: 1,
                                color: '#FAFAF5',
                            }}
                        >
                            {stat.num}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'rgba(250,250,245,0.5)',
                                mt: 0.5,
                            }}
                        >
                            {stat.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Bottom marquee */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    overflow: 'hidden',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    py: 1.5,
                    bgcolor: 'rgba(99,102,241,0.05)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        animation: `${marquee} 30s linear infinite`,
                        width: 'fit-content',
                    }}
                >
                    {Array.from({ length: 2 }).flatMap((_, rep) =>
                        SECTIONS.map((s) => (
                            <Box
                                key={`${rep}-${s.id}`}
                                sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.72rem',
                                        color: s.accent,
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    {s.number}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-bricolage)',
                                        fontSize: '0.9rem',
                                        color: 'rgba(250,250,245,0.8)',
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    {s.title}
                                </Typography>
                                <Box sx={{ color: 'rgba(255,255,255,0.2)' }}>★</Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Box>
    );
}
