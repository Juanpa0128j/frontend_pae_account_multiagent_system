'use client';

/**
 * 404 — Página no encontrada (brutalist editorial, español).
 *
 * Se renderiza dentro del AppShell (root layout). Acento de identidad = error
 * (rojo) para señalar el estado; el CTA primario usa chartreuse, el color de
 * acción global del sistema. Revelado escalonado en carga, microinteracciones
 * con la curva `motion.snap`, accesible (h1, foco visible, prefers-reduced-motion).
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, keyframes } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BrutalistButton from '@/components/brutalist/BrutalistButton';
import {
    palette,
    fonts,
    motion,
    typeScale,
    sxLabel,
    sxLabelSmall,
    sxGhostNumber,
    hexAlpha,
} from '@/styles/brutalist';

const ACCENT = palette.error;

const riseIn = keyframes`
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const dotPulse = keyframes`
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.3; transform: scale(0.7); }
`;

/** Staggered load reveal — disabled under prefers-reduced-motion. */
const reveal = (delay: number) => ({
    animation: `${riseIn} 0.6s ${motion.snap} both`,
    animationDelay: `${delay}s`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const SHORTCUTS = [
    { number: '01', label: 'Dashboard', href: '/' },
    { number: '02', label: 'Cargar', href: '/upload' },
    { number: '03', label: 'Transacciones', href: '/transactions' },
] as const;

export default function NotFound() {
    const router = useRouter();

    return (
        <Box
            component="section"
            aria-labelledby="nf-title"
            sx={{
                position: 'relative',
                minHeight: { xs: 'calc(100vh - 200px)', md: 'calc(100vh - 140px)' },
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                px: { xs: 3, sm: 5, md: 8 },
                py: { xs: 6, md: 10 },
            }}
        >
            {/* Atmospheric glow behind the ghost number */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '-12%',
                    width: { xs: 380, md: 820 },
                    height: { xs: 380, md: 820 },
                    transform: 'translateY(-50%)',
                    background: `radial-gradient(circle, ${hexAlpha(ACCENT, 0.1)} 0%, transparent 62%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Ghost 404 — massive, stroked, behind content */}
            <Typography
                aria-hidden
                component="span"
                sx={{
                    ...sxGhostNumber(ACCENT),
                    position: 'absolute',
                    top: '50%',
                    right: { xs: '-6%', md: '1%' },
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 0,
                }}
            >
                404
            </Typography>

            {/* Content */}
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
                {/* Eyebrow + pulsing dot */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        mb: { xs: 2.5, md: 3.5 },
                        ...reveal(0),
                    }}
                >
                    <Box
                        aria-hidden
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: ACCENT,
                            boxShadow: `0 0 12px ${ACCENT}`,
                            animation: `${dotPulse} 1.8s ${motion.snap} infinite`,
                            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                        }}
                    />
                    <Typography component="p" sx={{ ...sxLabel, color: ACCENT }}>
                        {'// ERROR_404 // PÁGINA NO ENCONTRADA'}
                    </Typography>
                </Box>

                {/* Title (h1) */}
                <Typography
                    id="nf-title"
                    component="h1"
                    sx={{
                        fontFamily: fonts.display,
                        fontWeight: 800,
                        fontSize: typeScale.pageTitle,
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        color: palette.paper,
                        mb: { xs: 2.5, md: 3 },
                        ...reveal(0.08),
                    }}
                >
                    Esta página
                    <br />
                    no existe.
                </Typography>

                {/* Accent rule */}
                <Box
                    aria-hidden
                    sx={{
                        width: 64,
                        height: 3,
                        bgcolor: ACCENT,
                        boxShadow: `0 0 12px ${ACCENT}`,
                        mb: { xs: 3, md: 3.5 },
                        ...reveal(0.14),
                    }}
                />

                {/* Subtitle */}
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontStyle: 'italic',
                        fontSize: typeScale.subtitle,
                        color: palette.paperMuted,
                        maxWidth: 580,
                        mb: { xs: 4, md: 5 },
                        ...reveal(0.2),
                    }}
                >
                    La ruta que buscas se movió, se eliminó o nunca existió. Revisa la dirección o
                    vuelve a un módulo del sistema.
                </Typography>

                {/* Primary CTA */}
                <Box sx={{ mb: { xs: 5, md: 6 }, ...reveal(0.28) }}>
                    <BrutalistButton
                        size="lg"
                        endIcon={<ArrowForwardIcon />}
                        subLabel="// IR AL DASHBOARD"
                        onClick={() => router.push('/')}
                    >
                        Volver al inicio
                    </BrutalistButton>
                </Box>

                {/* Recovery shortcuts */}
                <Box sx={{ ...reveal(0.36) }}>
                    <Typography
                        component="p"
                        sx={{ ...sxLabel, color: palette.paperFaint, mb: 1.75 }}
                    >
                        {'// O salta a un módulo'}
                    </Typography>
                    <Box
                        component="nav"
                        aria-label="Atajos a módulos"
                        sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 3 } }}
                    >
                        {SHORTCUTS.map((s) => (
                            <Box
                                key={s.href}
                                component={Link}
                                href={s.href}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'baseline',
                                    gap: 1,
                                    textDecoration: 'none',
                                    color: palette.paperMuted,
                                    transition: `all ${motion.duration.md} ${motion.snap}`,
                                    '&:hover': {
                                        color: palette.paper,
                                        transform: 'translateX(4px)',
                                    },
                                    '&:hover .nf-arrow': { color: ACCENT },
                                    '&:focus-visible': {
                                        outline: `2px solid ${ACCENT}`,
                                        outlineOffset: 4,
                                        borderRadius: 1,
                                    },
                                }}
                            >
                                <Typography
                                    component="span"
                                    sx={{ ...sxLabelSmall, color: ACCENT }}
                                >
                                    {s.number}
                                </Typography>
                                <Typography
                                    component="span"
                                    sx={{
                                        fontFamily: fonts.display,
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
                                    }}
                                >
                                    {s.label}
                                </Typography>
                                <Box
                                    component="span"
                                    className="nf-arrow"
                                    aria-hidden
                                    sx={{
                                        color: palette.paperFaint,
                                        transition: `color ${motion.duration.md} ${motion.snap}`,
                                    }}
                                >
                                    →
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
