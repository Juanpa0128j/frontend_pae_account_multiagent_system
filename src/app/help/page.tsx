'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import dynamic from 'next/dynamic';
import HelpHero from '@/components/help/HelpHero';
import HelpSearch from '@/components/help/HelpSearch';
import HelpStickyNav from '@/components/help/HelpStickyNav';
import { SECTIONS } from '@/components/help/helpData';

// Lazy-load the heavy parts so first paint of /help is fast
const HelpContent = dynamic(() => import('@/components/help/HelpContent'), {
    ssr: false,
    loading: () => <Box sx={{ minHeight: '60vh' }} />,
});
const HelpDownload = dynamic(() => import('@/components/help/HelpDownload'), {
    ssr: false,
    loading: () => <Box sx={{ minHeight: 200 }} />,
});

const scrollReveal = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
`;

export default function HelpPage() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const containerRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    // Scroll progress bar — throttled with rAF, only one setState if value changed
    useEffect(() => {
        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const scrolled = window.scrollY;
                const total = document.body.scrollHeight - window.innerHeight;
                const next = total > 0 ? (scrolled / total) * 100 : 0;
                setScrollProgress((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));

                // Active section detection (cheap; inline ids)
                const cutoff = window.innerHeight / 3;
                for (let i = SECTIONS.length - 1; i >= 0; i--) {
                    const el = document.getElementById(SECTIONS[i].id);
                    if (el && el.getBoundingClientRect().top < cutoff) {
                        const id = SECTIONS[i].id;
                        setActiveSection((prev) => (prev !== id ? id : prev));
                        break;
                    }
                }
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    // Mouse glow — direct DOM manipulation via ref (zero React re-renders)
    useEffect(() => {
        let frame = 0;
        let lastX = 0;
        let lastY = 0;
        const onMove = (e: MouseEvent) => {
            lastX = (e.clientX / window.innerWidth - 0.5) * 2;
            lastY = (e.clientY / window.innerHeight - 0.5) * 2;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                if (glowRef.current) {
                    glowRef.current.style.transform = `translate(calc(-50% + ${lastX * 40}px), calc(-50% + ${lastY * 40}px))`;
                }
            });
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMove);
            if (frame) cancelAnimationFrame(frame);
        };
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
            }}
        >
            {/* Scroll progress bar — top */}
            <Box
                className="no-print"
                sx={{
                    position: 'fixed',
                    top: 64,
                    left: { xs: 0, md: 260 },
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

            {/* Ambient glow following mouse — driven by ref, not state */}
            <Box
                ref={glowRef}
                className="no-print"
                sx={{
                    position: 'fixed',
                    width: 800,
                    height: 800,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)',
                    willChange: 'transform',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Content */}
            <Box className="help-screen-content" sx={{ position: 'relative', zIndex: 2 }}>
                <HelpHero />

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

                {/* Foot: aggressive close */}
                <Box
                    className="no-print"
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
