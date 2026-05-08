'use client';

import { Drawer, Box, Typography, IconButton, keyframes } from '@mui/material';
import { Close as CloseIcon, ArrowForward } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { SECTIONS } from './helpData';

const slideIn = keyframes`
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
`;

interface HelpQuickDrawerProps {
    open: boolean;
    onClose: () => void;
}

export default function HelpQuickDrawer({ open, onClose }: HelpQuickDrawerProps) {
    const router = useRouter();

    const go = (sectionId: string) => {
        onClose();
        router.push(`/help#${sectionId}`);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100vw', sm: 440 },
                    bgcolor: '#0A0E1A',
                    backgroundImage: 'none',
                    borderLeft: '1px solid rgba(99,102,241,0.2)',
                    color: '#FAFAF5',
                },
            }}
        >
            <Box
                sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        mb: 4,
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.7rem',
                                letterSpacing: '0.3em',
                                color: '#D4FF00',
                                textTransform: 'uppercase',
                            }}
                        >
                            {'// Ayuda rápida'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '2.25rem',
                                fontWeight: 700,
                                lineHeight: 1,
                                mt: 1,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            Guía
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#FAFAF5' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Section list */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        mx: -3,
                        px: 3,
                    }}
                >
                    {SECTIONS.map((s, i) => (
                        <Box
                            key={s.id}
                            onClick={() => go(s.id)}
                            sx={{
                                py: 2,
                                px: 2,
                                mx: -2,
                                borderLeft: '2px solid transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                transition: 'all 0.2s ease',
                                animation: `${slideIn} 0.4s ease ${i * 0.05}s both`,
                                '&:hover': {
                                    borderLeftColor: s.accent,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    pl: 3,
                                    '& .drawer-num': { color: s.accent },
                                    '& .drawer-arrow': {
                                        transform: 'translateX(4px)',
                                        color: s.accent,
                                    },
                                },
                            }}
                        >
                            <Typography
                                className="drawer-num"
                                sx={{
                                    fontFamily: 'var(--font-jetbrains)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.35)',
                                    letterSpacing: '0.15em',
                                    mt: 0.7,
                                    flexShrink: 0,
                                    minWidth: 28,
                                    transition: 'color 0.2s',
                                }}
                            >
                                {s.number}
                            </Typography>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-bricolage)',
                                        fontSize: '1.15rem',
                                        fontWeight: 600,
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        color: '#FAFAF5',
                                    }}
                                >
                                    {s.title}
                                </Typography>
                                <Typography
                                    sx={{
                                        mt: 0.5,
                                        fontFamily: 'var(--font-inter)',
                                        fontSize: '0.85rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontWeight: 300,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {s.subtitle}
                                </Typography>
                            </Box>
                            <ArrowForward
                                className="drawer-arrow"
                                sx={{
                                    fontSize: 18,
                                    color: 'rgba(255,255,255,0.3)',
                                    mt: 0.5,
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                }}
                            />
                        </Box>
                    ))}
                </Box>

                {/* Footer — link to full guide */}
                <Box
                    onClick={() => {
                        onClose();
                        router.push('/help');
                    }}
                    sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: '#D4FF00',
                        color: '#0A0E1A',
                        borderRadius: 2,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: '#E4FF40',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(212,255,0,0.3)',
                        },
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'var(--font-bricolage)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Abrir guía completa
                    </Typography>
                    <ArrowForward sx={{ fontSize: 20 }} />
                </Box>
            </Box>
        </Drawer>
    );
}
