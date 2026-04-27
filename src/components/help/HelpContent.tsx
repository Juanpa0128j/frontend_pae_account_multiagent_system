'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
    ArrowForward,
    TipsAndUpdates as TipIcon,
    Warning as WarningIcon,
    Link as RelatedIcon,
    East as EastIcon,
} from '@mui/icons-material';
import { SECTIONS, HelpSection, HelpStep } from './helpData';

// ---------------------------------------------------------------------------
// Step card — richer expandable insight
// ---------------------------------------------------------------------------
function StepCard({ step, index, accent }: { step: HelpStep; index: number; accent: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Box
            onClick={() => setOpen((v) => !v)}
            sx={{
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                p: { xs: 2.5, md: 3.5 },
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
                bgcolor: open ? 'rgba(255,255,255,0.02)' : 'transparent',
                '&:hover': {
                    borderColor: accent,
                    transform: open ? 'none' : 'translateX(6px)',
                    '& .arrow': { transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: accent },
                    '& .step-num': { color: accent, transform: 'scale(1.1)' },
                    '& .slash': { transform: 'scaleY(1)' },
                    '& .step-title': { color: accent },
                },
            }}
        >
            {/* Animated left accent bar */}
            <Box
                className="slash"
                sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: accent,
                    transform: open ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'top',
                    transition: 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)',
                    boxShadow: open ? `0 0 12px ${accent}` : 'none',
                }}
            />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 2, md: 3 } }}>
                <Typography
                    className="step-num"
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: { xs: '0.8rem', md: '0.95rem' },
                        fontWeight: 500,
                        color: open ? accent : 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.15em',
                        mt: 0.4,
                        flexShrink: 0,
                        transition: 'all 0.3s ease',
                        minWidth: 28,
                        transformOrigin: 'center',
                    }}
                >
                    {String(index + 1)}
                </Typography>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Typography
                            className="step-title"
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: { xs: '1.2rem', md: '1.55rem' },
                                fontWeight: 600,
                                lineHeight: 1.15,
                                letterSpacing: '-0.02em',
                                color: '#FAFAF5',
                                transition: 'color 0.3s ease',
                            }}
                        >
                            {step.title}
                        </Typography>
                        <ArrowForward
                            className="arrow"
                            sx={{
                                color: open ? accent : 'rgba(255,255,255,0.4)',
                                fontSize: 20,
                                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'all 0.3s ease',
                                flexShrink: 0,
                            }}
                        />
                    </Box>

                    {/* Expandable body */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateRows: open ? '1fr' : '0fr',
                            opacity: open ? 1 : 0,
                            transition:
                                'grid-template-rows 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease',
                        }}
                    >
                        <Box sx={{ overflow: 'hidden', minHeight: 0 }}>
                        {/* Body paragraph with a subtle editorial first-letter */}
                        <Typography
                            sx={{
                                mt: 2.5,
                                fontFamily: 'var(--font-inter)',
                                fontSize: { xs: '0.95rem', md: '1rem' },
                                lineHeight: 1.75,
                                color: 'rgba(250,250,245,0.82)',
                                fontWeight: 300,
                                letterSpacing: '-0.005em',
                                '&::first-letter': {
                                    fontFamily: 'var(--font-bricolage)',
                                    fontSize: '1.4em',
                                    fontWeight: 700,
                                    color: accent,
                                    mr: '0.1em',
                                },
                            }}
                        >
                            {step.body}
                        </Typography>

                        {/* Highlights */}
                        {step.highlights && step.highlights.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.3em',
                                        textTransform: 'uppercase',
                                        color: accent,
                                        fontWeight: 600,
                                        mb: 1.5,
                                    }}
                                >
                                    ━━ Puntos clave
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                    {step.highlights.map((h, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                                py: 0.5,
                                                pl: 1.5,
                                                borderLeft: `2px solid ${accent}40`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderLeftColor: accent,
                                                    transform: 'translateX(3px)',
                                                    '& .hi-dot': {
                                                        bgcolor: accent,
                                                        transform: 'scale(1.3)',
                                                    },
                                                },
                                            }}
                                        >
                                            <Box
                                                className="hi-dot"
                                                sx={{
                                                    width: 5,
                                                    height: 5,
                                                    borderRadius: '50%',
                                                    bgcolor: `${accent}80`,
                                                    mt: 0.85,
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontFamily: 'var(--font-inter)',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.55,
                                                    color: 'rgba(250,250,245,0.85)',
                                                    fontWeight: 400,
                                                }}
                                            >
                                                {h}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Warning */}
                        {step.warning && (
                            <Box
                                sx={{
                                    mt: 2.5,
                                    p: 2,
                                    bgcolor: 'rgba(245,158,11,0.08)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: 1.5,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                }}
                            >
                                <WarningIcon
                                    sx={{
                                        fontSize: 18,
                                        color: '#F59E0B',
                                        mt: 0.2,
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '0.6rem',
                                            letterSpacing: '0.3em',
                                            textTransform: 'uppercase',
                                            color: '#F59E0B',
                                            fontWeight: 700,
                                            mb: 0.5,
                                        }}
                                    >
                                        Cuidado
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-inter)',
                                            fontSize: '0.88rem',
                                            lineHeight: 1.55,
                                            color: 'rgba(250,250,245,0.85)',
                                            fontWeight: 400,
                                        }}
                                    >
                                        {step.warning}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Related link */}
                        {step.related && (
                            <Box
                                sx={{
                                    mt: 2.5,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 0.75,
                                    px: 1.5,
                                    border: `1px solid ${accent}40`,
                                    borderRadius: 4,
                                    bgcolor: `${accent}08`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: `${accent}15`,
                                        '& .related-arrow': { transform: 'translateX(4px)' },
                                    },
                                }}
                            >
                                <RelatedIcon sx={{ fontSize: 14, color: accent }} />
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.72rem',
                                        letterSpacing: '0.08em',
                                        color: '#FAFAF5',
                                        fontWeight: 500,
                                    }}
                                >
                                    {step.related}
                                </Typography>
                                <EastIcon
                                    className="related-arrow"
                                    sx={{
                                        fontSize: 14,
                                        color: accent,
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                            </Box>
                        )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// KPI strip
// ---------------------------------------------------------------------------
function KpiStrip({ kpis, accent }: { kpis: { value: string; label: string }[]; accent: string }) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: { xs: 3, md: 6 },
                mb: { xs: 5, md: 7 },
                flexWrap: 'wrap',
                py: 3,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {kpis.map((kpi) => (
                <Box key={kpi.label}>
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-bricolage)',
                            fontSize: { xs: '1.8rem', md: '2.4rem' },
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
                            mt: 0.5,
                            fontFamily: 'var(--font-jetbrains)',
                            fontSize: '0.65rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'rgba(250,250,245,0.5)',
                        }}
                    >
                        {kpi.label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
function Section({ section, idx }: { section: HelpSection; idx: number }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setVisible(true),
            { threshold: 0.1 }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <Box
            ref={ref}
            id={section.id}
            sx={{
                position: 'relative',
                pt: { xs: 8, md: 14 },
                pb: { xs: 6, md: 10 },
                borderBottom:
                    idx < SECTIONS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                scrollMarginTop: 80,
            }}
        >
            {/* Background ghost number */}
            <Typography
                sx={{
                    position: 'absolute',
                    top: { xs: -20, md: -40 },
                    right: { xs: -20, md: -40 },
                    fontFamily: 'var(--font-bricolage)',
                    fontSize: { xs: '12rem', md: '22rem', lg: '28rem' },
                    fontWeight: 800,
                    lineHeight: 0.8,
                    letterSpacing: '-0.08em',
                    color: 'transparent',
                    WebkitTextStroke: `1px ${section.accent}22`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 0,
                    opacity: visible ? 1 : 0,
                    transform: visible
                        ? 'translate(0,0) scale(1)'
                        : 'translate(20px, 20px) scale(0.95)',
                    transition: 'all 1.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
            >
                {section.number}
            </Typography>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Label */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 2,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.6s ease 0.1s',
                    }}
                >
                    <Box
                        sx={{
                            width: 40,
                            height: 3,
                            bgcolor: section.accent,
                            boxShadow: `0 0 12px ${section.accent}`,
                        }}
                    />
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-jetbrains)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            color: section.accent,
                            fontWeight: 500,
                        }}
                    >
                        {section.number} / {String(SECTIONS.length)}
                    </Typography>
                </Box>

                {/* Title */}
                <Typography
                    component="h2"
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                        fontWeight: 700,
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        color: '#FAFAF5',
                        mb: 1,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.7s cubic-bezier(0.2, 0.9, 0.3, 1) 0.2s',
                    }}
                >
                    {section.title}
                </Typography>

                {/* Subtitle */}
                <Typography
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: { xs: '1.1rem', md: '1.4rem' },
                        fontStyle: 'italic',
                        fontWeight: 400,
                        color: 'rgba(250,250,245,0.45)',
                        mb: 4,
                        letterSpacing: '-0.01em',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.6s ease 0.3s',
                    }}
                >
                    — {section.subtitle}
                </Typography>

                {/* Lede */}
                <Typography
                    sx={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: { xs: '1.05rem', md: '1.2rem' },
                        lineHeight: 1.65,
                        color: 'rgba(250,250,245,0.85)',
                        fontWeight: 300,
                        maxWidth: 760,
                        mb: { xs: 4, md: 5 },
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.7s ease 0.4s',
                    }}
                >
                    {section.lede}
                </Typography>

                {/* KPIs */}
                {section.kpis && section.kpis.length > 0 && (
                    <Box
                        sx={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.7s ease 0.5s',
                        }}
                    >
                        <KpiStrip kpis={section.kpis} accent={section.accent} />
                    </Box>
                )}

                {/* Steps */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s ease 0.6s',
                    }}
                >
                    {section.steps.map((step, i) => (
                        <StepCard key={i} step={step} index={i} accent={section.accent} />
                    ))}
                </Box>

                {/* Tip callout */}
                {section.tip && (
                    <Box
                        sx={{
                            mt: 5,
                            p: { xs: 2.5, md: 3 },
                            border: `1px solid ${section.accent}40`,
                            borderRadius: 2,
                            bgcolor: `${section.accent}08`,
                            display: 'flex',
                            gap: 2,
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.8s ease 0.7s',
                            '&::before': {
                                content: '"TIP"',
                                position: 'absolute',
                                top: 8,
                                right: 12,
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.65rem',
                                letterSpacing: '0.3em',
                                color: section.accent,
                                fontWeight: 700,
                            },
                        }}
                    >
                        <TipIcon
                            sx={{ color: section.accent, fontSize: 24, flexShrink: 0, mt: 0.25 }}
                        />
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.95rem',
                                lineHeight: 1.55,
                                color: 'rgba(250,250,245,0.85)',
                                fontWeight: 400,
                                pr: 4,
                            }}
                        >
                            {section.tip}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function HelpContent() {
    return (
        <Box>
            {SECTIONS.map((section, idx) => (
                <Section key={section.id} section={section} idx={idx} />
            ))}
        </Box>
    );
}
