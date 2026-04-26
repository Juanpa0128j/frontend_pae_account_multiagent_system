'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import { useChat } from '@/hooks/useChat';
import ChatInput from './ChatInput';
import ChatMessageBubble from './ChatMessageBubble';
import SessionList from './SessionList';
import { palette, fonts, motion, sxLabel, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

const ACCENT = palette.chartreuse;

const SUGGESTIONS = [
    '¿Cuál es mi balance general?',
    '¿Cuánto debo de IVA?',
    '¿Cómo está mi liquidez?',
    'Dame un análisis completo',
];

export default function ChatPage() {
    const {
        messages,
        sessionId,
        isStreaming,
        sessions,
        sessionsLoading,
        sendMessage,
        loadSession,
        newSession,
        stopStreaming,
        removeSession,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: isStreaming ? 'auto' : 'smooth',
        });
    }, [messages.length, isStreaming]);

    return (
        <Box
            sx={{
                display: 'flex',
                height: 'calc(100vh - 64px)',
                overflow: 'hidden',
                mx: { xs: -2, sm: -3 },
                mt: -3,
                mb: -3,
            }}
        >
            {/* Session Sidebar */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <SessionList
                    sessions={sessions}
                    activeSessionId={sessionId}
                    loading={sessionsLoading}
                    onSelect={loadSession}
                    onNew={newSession}
                    onDelete={removeSession}
                />
            </Box>

            {/* Chat Area */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    bgcolor: palette.ink,
                }}
            >
                {/* Top eyebrow strip */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: { xs: 2, md: 4 },
                        py: 2,
                        borderBottom: `1px solid ${palette.line}`,
                    }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            bgcolor: ACCENT,
                            borderRadius: '50%',
                            boxShadow: `0 0 8px ${ACCENT}`,
                            animation: 'pulse 2.5s infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.4 },
                            },
                        }}
                    />
                    <Typography sx={{ ...sxLabel, color: ACCENT }}>
                        {'// MÓDULO_7 // CHAT_IA'}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    {messages.length > 0 && (
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost }}>
                            {`// ${messages.length} MENSAJE${messages.length !== 1 ? 'S' : ''}`}
                        </Typography>
                    )}
                </Box>

                {/* Messages */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        px: { xs: 2, md: 4 },
                        py: 4,
                    }}
                >
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                height: '100%',
                                maxWidth: 720,
                                mx: 'auto',
                                gap: 0,
                            }}
                        >
                            {/* Big square icon */}
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    bgcolor: ACCENT,
                                    color: palette.ink,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 3,
                                    boxShadow: `0 0 24px ${hexAlpha(ACCENT, 0.4)}`,
                                }}
                            >
                                <BotIcon sx={{ fontSize: 36 }} />
                            </Box>

                            {/* Title */}
                            <Typography
                                sx={{
                                    fontFamily: fonts.display,
                                    fontSize: { xs: '2.5rem', md: '4rem' },
                                    fontWeight: 800,
                                    lineHeight: 0.95,
                                    letterSpacing: '-0.04em',
                                    color: palette.paper,
                                    textTransform: 'uppercase',
                                    mb: 1,
                                }}
                            >
                                Chat
                                <br />
                                <Box
                                    component="span"
                                    sx={{
                                        background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #D4FF00 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontStyle: 'italic',
                                        pr: '0.18em',
                                    }}
                                >
                                    financiero.
                                </Box>
                            </Typography>

                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    lineHeight: 1.6,
                                    color: palette.paperDim,
                                    fontWeight: 300,
                                    maxWidth: 560,
                                    mb: 4,
                                }}
                            >
                                Pregunta sobre tu balance general, estado de resultados, IVA,
                                retenciones, ratios financieros y más. Las respuestas se basan en
                                los datos reales de tu contabilidad.
                            </Typography>

                            {/* Suggestion chips — brutalist */}
                            <Typography
                                sx={{
                                    ...sxLabelSmall,
                                    color: ACCENT,
                                    mb: 1.5,
                                }}
                            >
                                {'// SUGERENCIAS'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {SUGGESTIONS.map((s) => (
                                    <Box
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            py: 0.85,
                                            px: 1.5,
                                            border: `1px solid ${hexAlpha(ACCENT, 0.3)}`,
                                            bgcolor: hexAlpha(ACCENT, 0.04),
                                            cursor: 'pointer',
                                            transition: `all ${motion.duration.sm} ${motion.snap}`,
                                            '&:hover': {
                                                bgcolor: hexAlpha(ACCENT, 0.12),
                                                borderColor: ACCENT,
                                                transform: 'translateY(-2px)',
                                                '& .sug-arrow': { color: ACCENT, transform: 'translateX(2px)' },
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 4,
                                                height: 4,
                                                bgcolor: ACCENT,
                                                borderRadius: '50%',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.85rem',
                                                color: palette.paper,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {s}
                                        </Typography>
                                        <Typography
                                            className="sug-arrow"
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.75rem',
                                                color: palette.paperGhost,
                                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                            }}
                                        >
                                            →
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
                            {messages.map((msg) => (
                                <ChatMessageBubble key={msg.id} message={msg} />
                            ))}
                            <div ref={messagesEndRef} />
                        </Box>
                    )}
                </Box>

                {/* Input */}
                <ChatInput
                    onSend={sendMessage}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                />
            </Box>
        </Box>
    );
}
