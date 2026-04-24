'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { PictureAsPdf as PdfIcon, East as ArrowIcon, Check as CheckIcon } from '@mui/icons-material';

const slideDiagonal = keyframes`
    0% { transform: translateX(-100%) translateY(-100%) rotate(35deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(35deg); }
`;

const pulseRing = keyframes`
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.8); opacity: 0; }
`;

export default function HelpDownload() {
    const [clicked, setClicked] = useState(false);
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setVisible(true),
            { threshold: 0.25 }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const handleDownload = () => {
        setClicked(true);
        // Add class to body to trigger print-specific CSS
        document.body.classList.add('printing-help');
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-help');
                setClicked(false);
            }, 500);
        }, 400);
    };

    return (
        <Box
            ref={ref}
            className="no-print"
            sx={{
                position: 'relative',
                mt: { xs: 8, md: 14 },
                mx: { xs: 0, lg: -6 },
                py: { xs: 8, md: 14 },
                px: { xs: 3, sm: 6, md: 10 },
                bgcolor: '#D4FF00',
                color: '#0A0E1A',
                overflow: 'hidden',
                borderRadius: { xs: 0, sm: 2 },
                // Diagonal stripe pattern overlay
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'repeating-linear-gradient(135deg, transparent 0 40px, rgba(10,14,26,0.04) 40px 41px)',
                    pointerEvents: 'none',
                },
            }}
        >
            {/* Top label */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: { xs: 3, md: 5 },
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s ease',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                <Box sx={{ width: 40, height: 3, bgcolor: '#0A0E1A' }} />
                <Typography
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '0.72rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                    }}
                >
                    Export · Manual completo
                </Typography>
            </Box>

            {/* Massive heading */}
            <Typography
                sx={{
                    fontFamily: 'var(--font-bricolage)',
                    fontSize: { xs: '3.5rem', sm: '5rem', md: '8rem', lg: '10rem' },
                    fontWeight: 800,
                    lineHeight: 0.85,
                    letterSpacing: '-0.055em',
                    textTransform: 'uppercase',
                    mb: { xs: 3, md: 4 },
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'all 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) 0.1s',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                Descarga{' '}
                <Box
                    component="span"
                    sx={{
                        fontStyle: 'italic',
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #0A0E1A 0%, #6366F1 50%, #EC4899 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    el manual
                </Box>
            </Typography>

            {/* Description */}
            <Typography
                sx={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    lineHeight: 1.5,
                    maxWidth: 640,
                    fontWeight: 400,
                    mb: { xs: 5, md: 7 },
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.7s ease 0.2s',
                    position: 'relative',
                    zIndex: 2,
                    color: 'rgba(10,14,26,0.8)',
                }}
            >
                Exporta la guía completa como PDF para consultarla offline, compartirla con tu
                equipo o imprimirla. Genera un archivo con las 8 secciones, los {8 * 3}+ insights
                y todos los tips.
            </Typography>

            {/* Action row: main button + file info */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: { xs: 3, md: 6 },
                    flexDirection: { xs: 'column', md: 'row' },
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.7s ease 0.35s',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {/* Giant button */}
                <Box
                    onClick={handleDownload}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleDownload();
                        }
                    }}
                    sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2.5,
                        py: { xs: 2.5, md: 3 },
                        px: { xs: 3, md: 5 },
                        bgcolor: '#0A0E1A',
                        color: '#D4FF00',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(10,14,26,0.3)',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: '0 20px 50px rgba(10,14,26,0.5)',
                            '& .btn-shine': { animation: `${slideDiagonal} 1s ease` },
                            '& .btn-arrow': { transform: 'translateX(6px) rotate(-10deg)' },
                            '& .btn-icon': { transform: 'rotate(-6deg) scale(1.08)' },
                        },
                        '&:active': { transform: 'translateY(-2px) scale(1)' },
                    }}
                >
                    {/* Shine sweep on hover */}
                    <Box
                        className="btn-shine"
                        sx={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '60%',
                            height: '200%',
                            background:
                                'linear-gradient(90deg, transparent, rgba(212,255,0,0.15), transparent)',
                            transform: 'translateX(-100%) rotate(35deg)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Pulse ring on click */}
                    {clicked && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                border: '2px solid #D4FF00',
                                borderRadius: 1.5,
                                animation: `${pulseRing} 0.6s ease-out`,
                                pointerEvents: 'none',
                            }}
                        />
                    )}

                    <Box
                        className="btn-icon"
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            bgcolor: '#D4FF00',
                            color: '#0A0E1A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.3s ease',
                            flexShrink: 0,
                        }}
                    >
                        {clicked ? (
                            <CheckIcon sx={{ fontSize: 28 }} />
                        ) : (
                            <PdfIcon sx={{ fontSize: 28 }} />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: { xs: '1.15rem', md: '1.4rem' },
                                fontWeight: 700,
                                letterSpacing: '-0.015em',
                                lineHeight: 1,
                                textTransform: 'uppercase',
                            }}
                        >
                            {clicked ? 'Preparando…' : 'Descargar PDF'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.15em',
                                color: 'rgba(212,255,0,0.7)',
                                mt: 0.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            PAE_MANUAL_v0.1.pdf
                        </Typography>
                    </Box>

                    <ArrowIcon
                        className="btn-arrow"
                        sx={{
                            fontSize: 24,
                            ml: { xs: 0, md: 2 },
                            transition: 'transform 0.3s ease',
                        }}
                    />
                </Box>

                {/* Meta info */}
                <Box>
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-jetbrains)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'rgba(10,14,26,0.6)',
                            mb: 0.5,
                        }}
                    >
                        Detalles del archivo
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.92rem',
                            color: '#0A0E1A',
                            fontWeight: 500,
                            lineHeight: 1.5,
                        }}
                    >
                        8 secciones · 25+ insights · incluye código, warnings y tips
                        <br />
                        <Box
                            component="span"
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.78rem',
                                color: 'rgba(10,14,26,0.6)',
                            }}
                        >
                            Se genera con el diálogo de impresión del navegador. Selecciona
                            &quot;Guardar como PDF&quot; como destino.
                        </Box>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
