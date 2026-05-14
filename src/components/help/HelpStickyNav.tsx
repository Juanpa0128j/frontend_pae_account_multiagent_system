'use client';

import { useState } from 'react';
import { Box, Drawer, IconButton, Typography, Tooltip } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { SECTIONS } from './helpData';

function NavList({
    activeSection,
    onItemClick,
}: {
    activeSection: string;
    onItemClick?: (id: string) => void;
}) {
    return (
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
                            onItemClick?.(s.id);
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
    );
}

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
            <NavList activeSection={activeSection} />
        </Box>
    );
}

export function HelpMobileNav({ activeSection }: { activeSection: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <Tooltip title="Índice de la guía" arrow>
                <IconButton
                    onClick={() => setOpen(true)}
                    aria-label="Abrir índice"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 30,
                        width: 56,
                        height: 56,
                        bgcolor: '#0A0E1A',
                        color: '#D4FF00',
                        border: '1px solid rgba(212,255,0,0.4)',
                        boxShadow: '0 4px 24px rgba(212,255,0,0.18)',
                        borderRadius: 1,
                        transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                        '&:hover': {
                            bgcolor: '#D4FF00',
                            color: '#0A0E1A',
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>
            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        width: { xs: '85%', sm: 320 },
                        maxWidth: 360,
                        bgcolor: '#0A0E1A',
                        backgroundImage: 'none',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        p: 3,
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-jetbrains)',
                            fontSize: '0.68rem',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {'// Índice'}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(false)}
                        aria-label="Cerrar índice"
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <NavList activeSection={activeSection} onItemClick={() => setOpen(false)} />
            </Drawer>
        </Box>
    );
}
