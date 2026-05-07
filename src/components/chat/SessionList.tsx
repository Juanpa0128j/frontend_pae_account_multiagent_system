'use client';

import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { ChatSession } from '@/types';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

const ACCENT = palette.chartreuse;

interface SessionListProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    loading?: boolean;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
}

export default function SessionList({
    sessions,
    activeSessionId,
    loading,
    onSelect,
    onNew,
    onDelete,
}: SessionListProps) {
    return (
        <Box
            sx={{
                width: 280,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: `1px solid ${palette.line}`,
                bgcolor: palette.ink,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 2,
                    py: 2,
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost, mb: 1 }}>
                    {'// SESIONES'}
                </Typography>
                <Box
                    onClick={onNew}
                    role="button"
                    tabIndex={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 1.25,
                        bgcolor: ACCENT,
                        color: palette.ink,
                        cursor: 'pointer',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 6px 16px ${hexAlpha(ACCENT, 0.4)}`,
                        },
                    }}
                >
                    <AddIcon sx={{ fontSize: 16 }} />
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Nueva conversación
                    </Typography>
                </Box>
            </Box>

            {/* Session List */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: 1,
                    py: 1,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: palette.line, borderRadius: 2 },
                }}
            >
                {loading ? (
                    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {[1, 2, 3].map((i) => (
                            <Skeleton
                                key={i}
                                variant="rectangular"
                                height={52}
                                sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}
                            />
                        ))}
                    </Box>
                ) : sessions.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'left' }}>
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost, mb: 1 }}>
                            {'// SIN CONVERSACIONES'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.82rem',
                                color: palette.paperFaint,
                                lineHeight: 1.5,
                            }}
                        >
                            Empieza una conversación con el agente IA. Tus sesiones quedan guardadas
                            aquí.
                        </Typography>
                    </Box>
                ) : (
                    sessions.map((session) => {
                        const active = session.id === activeSessionId;
                        return (
                            <Box
                                key={session.id}
                                onClick={() => onSelect(session.id)}
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 1,
                                    px: 1.25,
                                    cursor: 'pointer',
                                    bgcolor: active ? hexAlpha(ACCENT, 0.08) : 'transparent',
                                    borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                                    transition: `all ${motion.duration.sm} ${motion.snap}`,
                                    mb: 0.25,
                                    '&:hover': {
                                        bgcolor: hexAlpha(ACCENT, 0.06),
                                        borderLeftColor: ACCENT,
                                        '& .session-delete': { opacity: 1 },
                                        '& .session-dot': { transform: 'scale(1.4)' },
                                    },
                                }}
                            >
                                <Box
                                    className="session-dot"
                                    sx={{
                                        width: 5,
                                        height: 5,
                                        bgcolor: active ? ACCENT : palette.paperGhost,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        boxShadow: active ? `0 0 6px ${ACCENT}` : 'none',
                                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: '0.82rem',
                                            fontWeight: active ? 600 : 500,
                                            color: active ? palette.paper : palette.paperDim,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {session.title || 'Conversación sin título'}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.6rem',
                                            color: palette.paperGhost,
                                            letterSpacing: '0.12em',
                                            mt: 0.2,
                                        }}
                                    >
                                        {session.message_count} MSG
                                    </Typography>
                                </Box>
                                <Box
                                    className="session-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(session.id);
                                    }}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: palette.paperGhost,
                                        opacity: 0,
                                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                                        '&:hover': {
                                            color: palette.error,
                                            bgcolor: hexAlpha(palette.error, 0.1),
                                        },
                                    }}
                                >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}
