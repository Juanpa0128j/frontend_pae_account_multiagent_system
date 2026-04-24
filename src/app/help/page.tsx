'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import HelpContent from '@/components/help/HelpContent';
import HelpHero from '@/components/help/HelpHero';
import HelpSearch from '@/components/help/HelpSearch';
import HelpStickyNav from '@/components/help/HelpStickyNav';
import HelpDownload from '@/components/help/HelpDownload';
import PrintableManual from '@/components/help/PrintableManual';
import { SECTIONS } from '@/components/help/helpData';

const scrollReveal = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
`;

export default function HelpPage() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [mouseXY, setMouseXY] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll progress bar
    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY;
            const total = document.body.scrollHeight - window.innerHeight;
            setScrollProgress(total > 0 ? (scrolled / total) * 100 : 0);

            // Detect active section
            const sections = SECTIONS.map((s) => document.getElementById(s.id));
            for (let i = sections.length - 1; i >= 0; i--) {
                const el = sections[i];
                if (el && el.getBoundingClientRect().top < window.innerHeight / 3) {
                    setActiveSection(SECTIONS[i].id);
                    break;
                }
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Mouse parallax for hero
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            setMouseXY({
                x: (e.clientX / window.innerWidth - 0.5) * 2,
                y: (e.clientY / window.innerHeight - 0.5) * 2,
            });
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                minHeight: '100vh',
                mx: { xs: -2, sm: -3 },
                mt: -3,
                mb: -3,
                bgcolor: '#0A0E1A',
                color: '#FAFAF5',
                overflow: 'hidden',
                fontFamily: 'var(--font-inter)',
                // Grain texture overlay
                '&::before': {
                    content: '""',
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    pointerEvents: 'none',
                    zIndex: 1,
                    mixBlendMode: 'overlay',
                    opacity: 0.5,
                },
            }}
        >
            {/* Scroll progress bar — top */}
            <Box
                className="no-print"
                sx={{
                    position: 'fixed',
                    top: 64,
                    left: { xs: 0, md: 240 },
                    right: 0,
                    height: 3,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    zIndex: 10,
                }}
            >
                <Box
                    sx={{
                        height: '100%',
                        width: `${scrollProgress}%`,
                        background: 'linear-gradient(90deg, #6366F1 0%, #EC4899 50%, #D4FF00 100%)',
                        transition: 'width 0.1s linear',
                        boxShadow: '0 0 12px rgba(99,102,241,0.6)',
                    }}
                />
            </Box>

            {/* Ambient glow following mouse */}
            <Box
                className="no-print"
                sx={{
                    position: 'fixed',
                    width: 800,
                    height: 800,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${mouseXY.x * 40}px), calc(-50% + ${mouseXY.y * 40}px))`,
                    transition: 'transform 0.3s ease-out',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Content */}
            <Box className="help-screen-content" sx={{ position: 'relative', zIndex: 2 }}>
                <HelpHero mouseXY={mouseXY} />

                <HelpSearch onSelect={(id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }} />

                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 0, lg: 6 },
                        maxWidth: 1280,
                        mx: 'auto',
                        px: { xs: 2, sm: 4, md: 6 },
                        pb: 12,
                    }}
                >
                    <HelpStickyNav activeSection={activeSection} />

                    <Box
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            animation: `${scrollReveal} 0.8s ease-out 0.2s both`,
                        }}
                    >
                        <HelpContent />
                        <HelpDownload />
                    </Box>
                </Box>

                {/* Hidden printable manual — shown only when window.print() fires */}
                <PrintableManual />

                {/* Foot: aggressive close */}
                <Box
                    sx={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        py: 8,
                        px: { xs: 3, sm: 6 },
                        textAlign: 'center',
                        position: 'relative',
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-bricolage)',
                            fontSize: { xs: '3rem', sm: '5rem', md: '7rem' },
                            fontWeight: 800,
                            lineHeight: 0.9,
                            letterSpacing: '-0.04em',
                            color: 'transparent',
                            WebkitTextStroke: '1px rgba(99,102,241,0.4)',
                        }}
                    >
                        ¿AÚN CON DUDAS?
                    </Typography>
                    <Typography
                        sx={{
                            mt: 2,
                            fontFamily: 'var(--font-jetbrains)',
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {'// soporte@paecontable.co · v0.1.0'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
