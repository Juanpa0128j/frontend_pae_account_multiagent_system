'use client';

import { Box, Typography } from '@mui/material';
import { SECTIONS } from './helpData';

export default function HelpStickyNav({ activeSection }: { activeSection: string }) {
    return (
        <Box
            component="nav"
            sx={{
                display: { xs: 'none', lg: 'block' },
                width: 240,
                flexShrink: 0,
                position: 'sticky',
                top: 100,
                alignSelf: 'flex-start',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                pt: 6,
            }}
        >
            <Typography
                sx={{
                    fontFamily: 'var(--font-jetbrains)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.35)',
                    mb: 3,
                }}
            >
                {'// Índice'}
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 14,
                        top: 8,
                        bottom: 8,
                        width: 1,
                        bgcolor: 'rgba(255,255,255,0.08)',
                    },
                }}
            >
                {SECTIONS.map((s) => {
                    const active = activeSection === s.id;
                    return (
                        <Box
                            key={s.id}
                            component="a"
                            href={`#${s.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                document
                                    .getElementById(s.id)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                py: 1,
                                px: 0,
                                textDecoration: 'none',
                                color: active ? '#FAFAF5' : 'rgba(250,250,245,0.45)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    color: '#FAFAF5',
                                    '& .dot': { bgcolor: s.accent, transform: 'scale(1.4)' },
                                    '& .num': { color: s.accent },
                                },
                            }}
                        >
                            <Box
                                className="dot"
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: active ? s.accent : 'rgba(255,255,255,0.2)',
                                    border: active ? `none` : '1px solid rgba(255,255,255,0.2)',
                                    ml: 1.25,
                                    transition: 'all 0.2s ease',
                                    boxShadow: active ? `0 0 12px ${s.accent}` : 'none',
                                    transform: active ? 'scale(1.2)' : 'scale(1)',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            />
                            <Box>
                                <Typography
                                    className="num"
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.62rem',
                                        color: active ? s.accent : 'rgba(255,255,255,0.35)',
                                        letterSpacing: '0.15em',
                                        lineHeight: 1,
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {s.number}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-bricolage)',
                                        fontSize: '0.85rem',
                                        fontWeight: active ? 600 : 500,
                                        letterSpacing: '-0.01em',
                                        mt: 0.25,
                                    }}
                                >
                                    {s.title}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
