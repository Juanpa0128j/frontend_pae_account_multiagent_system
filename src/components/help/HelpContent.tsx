'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { ArrowForward, Terminal as TerminalIcon, TipsAndUpdates as TipIcon } from '@mui/icons-material';
import { SECTIONS, HelpSection, HelpStep } from './helpData';

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
`;

// ---------------------------------------------------------------------------
// Step card — expandable with aggressive hover
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
                p: { xs: 2, md: 3 },
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
                bgcolor: open ? 'rgba(255,255,255,0.02)' : 'transparent',
                '&:hover': {
                    borderColor: accent,
                    transform: 'translateX(6px)',
                    '& .arrow': { transform: 'rotate(90deg) translateY(-2px)', color: accent },
                    '& .step-num': { color: accent },
                    '& .slash': { transform: 'scaleX(1)' },
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
                    transform: open ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                }}
            />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 2, md: 3 } }}>
                <Typography
                    className="step-num"
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        fontWeight: 500,
                        color: open ? accent : 'rgba(255,255,255,0.4)',
                        letterSpacing: '0.15em',
                        mt: 0.4,
                        flexShrink: 0,
                        transition: 'color 0.3s ease',
                        minWidth: 28,
                    }}
                >
                    {String(index + 1).padStart(2, '0')}
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
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: { xs: '1.15rem', md: '1.5rem' },
                                fontWeight: 600,
                                lineHeight: 1.15,
                                letterSpacing: '-0.02em',
                                color: '#FAFAF5',
                            }}
                        >
                            {step.title}
                        </Typography>
                        <ArrowForward
                            className="arrow"
                            sx={{
                                color: 'rgba(255,255,255,0.4)',
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
                            maxHeight: open ? '400px' : 0,
                            opacity: open ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease',
                        }}
                    >
                        <Typography
                            sx={{
                                mt: 2,
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.95rem',
                                lineHeight: 1.65,
                                color: 'rgba(250,250,245,0.75)',
                                fontWeight: 300,
                            }}
                        >
                            {step.body}
                        </Typography>

                        {step.code && (
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    bgcolor: 'rgba(0,0,0,0.4)',
                                    border: `1px solid ${accent}33`,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <TerminalIcon sx={{ fontSize: 14, color: accent }} />
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.78rem',
                                        color: '#FAFAF5',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {step.code}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Section block
// ---------------------------------------------------------------------------
function Section({ section, idx }: { section: HelpSection; idx: number }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setVisible(true),
            { threshold: 0.15 }
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
                borderBottom: idx < SECTIONS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                scrollMarginTop: 80,
            }}
        >
            {/* Massive section number — background ghost */}
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
                    transform: visible ? 'translate(0,0) scale(1)' : 'translate(20px, 20px) scale(0.95)',
                    transition: 'all 1.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
            >
                {section.number}
            </Typography>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Label + accent dot */}
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
                        {section.number} / {SECTIONS.length.toString().padStart(2, '0')}
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
                        fontSize: { xs: '1rem', md: '1.15rem' },
                        lineHeight: 1.6,
                        color: 'rgba(250,250,245,0.8)',
                        fontWeight: 300,
                        maxWidth: 720,
                        mb: { xs: 5, md: 7 },
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.7s ease 0.4s',
                    }}
                >
                    {section.lede}
                </Typography>

                {/* Steps */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s ease 0.5s',
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
                        <TipIcon sx={{ color: section.accent, fontSize: 24, flexShrink: 0, mt: 0.25 }} />
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
// Main content
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
