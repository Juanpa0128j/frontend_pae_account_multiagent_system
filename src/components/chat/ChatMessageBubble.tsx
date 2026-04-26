'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import FinancialDataCard from './FinancialDataCard';
import ChatReasoningPanel from './ChatReasoningPanel';
import { palette, fonts, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

const USER_ACCENT = palette.accent;
const BOT_ACCENT = palette.chartreuse;

const markdownStyles = {
    color: palette.paperDim,
    fontFamily: fonts.body,
    fontSize: '0.92rem',
    lineHeight: 1.65,
    wordBreak: 'break-word',
    '& p': { m: 0, mb: 1 },
    '& p:last-child': { mb: 0 },
    '& strong': { color: palette.paper, fontWeight: 700 },
    '& em': { fontStyle: 'italic', color: palette.paper },
    '& ul, & ol': { pl: 2.5, my: 0.5 },
    '& li': { mb: 0.4 },
    '& a': { color: BOT_ACCENT, textDecoration: 'underline', textUnderlineOffset: 2 },
    '& code': {
        bgcolor: hexAlpha(palette.paper, 0.06),
        border: `1px solid ${palette.line}`,
        px: 0.5,
        py: 0.15,
        borderRadius: 0.5,
        fontSize: '0.85em',
        fontFamily: fonts.mono,
        color: palette.paper,
    },
    '& pre': {
        bgcolor: 'rgba(0,0,0,0.5)',
        border: `1px solid ${palette.line}`,
        borderLeft: `2px solid ${BOT_ACCENT}`,
        p: 1.5,
        borderRadius: 0.5,
        overflow: 'auto',
        my: 1,
        '& code': { bgcolor: 'transparent', border: 'none', p: 0 },
    },
    '& h1, & h2, & h3, & h4': {
        fontFamily: fonts.display,
        color: palette.paper,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        mt: 1.5,
        mb: 0.5,
    },
    '& h1': { fontSize: '1.2rem' },
    '& h2': { fontSize: '1.1rem' },
    '& h3': { fontSize: '1rem' },
    '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        my: 1,
        fontFamily: fonts.body,
    },
    '& th, & td': {
        border: `1px solid ${palette.line}`,
        px: 1,
        py: 0.5,
        fontSize: '0.82rem',
        textAlign: 'left',
    },
    '& th': {
        bgcolor: hexAlpha(BOT_ACCENT, 0.08),
        color: BOT_ACCENT,
        fontFamily: fonts.mono,
        fontSize: '0.7rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontWeight: 700,
    },
    '& blockquote': {
        borderLeft: `3px solid ${BOT_ACCENT}`,
        pl: 1.5,
        ml: 0,
        my: 1,
        color: palette.paperFaint,
        fontStyle: 'italic',
    },
} as const;

interface ChatMessageBubbleProps {
    message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
    const isUser = message.role === 'user';
    const accent = isUser ? USER_ACCENT : BOT_ACCENT;

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1.75,
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 3,
            }}
        >
            {/* Avatar — square brutalist */}
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    bgcolor: accent,
                    color: palette.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 16px ${hexAlpha(accent, 0.3)}`,
                }}
            >
                {isUser ? <PersonIcon sx={{ fontSize: 20 }} /> : <BotIcon sx={{ fontSize: 20 }} />}
            </Box>

            {/* Content column */}
            <Box sx={{ maxWidth: '78%', minWidth: 0, flex: 1 }}>
                {/* Mono label */}
                <Typography
                    sx={{
                        ...sxLabelSmall,
                        color: accent,
                        mb: 0.5,
                        textAlign: isUser ? 'right' : 'left',
                    }}
                >
                    {isUser ? '// USUARIO' : '// AGENTE_IA'}
                </Typography>

                {/* Bubble */}
                <Box
                    sx={{
                        position: 'relative',
                        p: 2,
                        bgcolor: isUser ? hexAlpha(USER_ACCENT, 0.05) : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isUser ? hexAlpha(USER_ACCENT, 0.2) : palette.line}`,
                        borderRadius: 0.5,
                        overflow: 'hidden',
                    }}
                >
                    {/* Accent bar (left for bot, right for user) */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            [isUser ? 'right' : 'left']: 0,
                            width: 2,
                            bgcolor: accent,
                            boxShadow: `0 0 6px ${accent}`,
                        }}
                    />

                    {message.content ? (
                        <Box sx={markdownStyles}>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    bgcolor: BOT_ACCENT,
                                    borderRadius: '50%',
                                    animation: 'thinking 1.2s infinite',
                                    '@keyframes thinking': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.3 },
                                    },
                                }}
                            />
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.78rem',
                                    color: palette.paperFaint,
                                    fontStyle: 'italic',
                                    letterSpacing: '0.1em',
                                }}
                            >
                                {'// pensando…'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Reasoning trace — visible agent traceability (assistant only) */}
                {!isUser && message.reasoning && message.reasoning.length > 0 && (
                    <ChatReasoningPanel steps={message.reasoning} />
                )}

                {/* Sources — brutalist mono chips */}
                {message.sources && message.sources.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            mt: 1,
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost }}>
                            {'// FUENTES:'}
                        </Typography>
                        {message.sources.map((source) => (
                            <Box
                                key={source}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 0.75,
                                    py: 0.2,
                                    border: `1px solid ${hexAlpha(BOT_ACCENT, 0.3)}`,
                                    bgcolor: hexAlpha(BOT_ACCENT, 0.06),
                                    fontFamily: fonts.mono,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: BOT_ACCENT,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    borderRadius: 0.5,
                                }}
                            >
                                {source}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Data cards */}
                {message.data_cards && message.data_cards.length > 0 && (
                    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {message.data_cards.map((card, i) => (
                            <FinancialDataCard key={`${card.card_type}-${i}`} card={card} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
