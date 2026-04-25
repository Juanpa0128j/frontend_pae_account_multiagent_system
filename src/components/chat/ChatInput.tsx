'use client';

import React, { useState, useRef } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { Send as SendIcon, Stop as StopIcon } from '@mui/icons-material';
import { palette, fonts, motion, hexAlpha } from '@/styles/brutalist';

const ACCENT = palette.chartreuse;

interface ChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    isStreaming?: boolean;
    disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        const trimmed = value.trim();
        if (!trimmed || isStreaming || disabled) return;
        onSend(trimmed);
        setValue('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box
            sx={{
                px: { xs: 2, md: 4 },
                py: 2.5,
                borderTop: `1px solid ${palette.line}`,
                bgcolor: palette.ink,
                position: 'relative',
            }}
        >
            {/* Top stripe with mono prompt */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, maxWidth: 920, mx: 'auto' }}>
                <Box sx={{ width: 16, height: 2, bgcolor: ACCENT, boxShadow: `0 0 4px ${ACCENT}` }} />
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.62rem',
                        color: ACCENT,
                        letterSpacing: '0.22em',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                    }}
                >
                    {isStreaming ? '// streaming…' : '// prompt'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.6rem',
                        color: palette.paperGhost,
                        letterSpacing: '0.15em',
                    }}
                >
                    ENTER ↵ · SHIFT+ENTER ↵ NUEVA LÍNEA
                </Typography>
            </Box>

            {/* Input row */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1.25,
                    maxWidth: 920,
                    mx: 'auto',
                }}
            >
                <TextField
                    inputRef={inputRef}
                    fullWidth
                    multiline
                    maxRows={6}
                    placeholder="Pregunta sobre tus finanzas…"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    InputProps={{
                        sx: {
                            fontFamily: fonts.body,
                            fontSize: '0.95rem',
                            color: palette.paper,
                            bgcolor: hexAlpha(palette.paper, 0.03),
                            borderRadius: 0.5,
                            py: 0.5,
                            '& fieldset': { borderColor: palette.line },
                            '&:hover fieldset': { borderColor: palette.lineStrong },
                            '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 1 },
                            '& textarea::placeholder': {
                                color: palette.paperGhost,
                                opacity: 1,
                            },
                        },
                    }}
                />

                {/* Send / Stop button — brutalist square */}
                <Box
                    onClick={isStreaming ? onStop : handleSend}
                    role="button"
                    tabIndex={0}
                    sx={{
                        flexShrink: 0,
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: disabled || (!isStreaming && !value.trim()) ? 'not-allowed' : 'pointer',
                        bgcolor: isStreaming ? palette.error : ACCENT,
                        color: palette.ink,
                        opacity: disabled || (!isStreaming && !value.trim()) ? 0.4 : 1,
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': {
                            transform: disabled || (!isStreaming && !value.trim()) ? 'none' : 'translateY(-2px) rotate(-3deg)',
                            boxShadow: disabled || (!isStreaming && !value.trim())
                                ? 'none'
                                : `0 8px 16px ${hexAlpha(isStreaming ? palette.error : ACCENT, 0.4)}`,
                        },
                    }}
                >
                    {isStreaming ? <StopIcon sx={{ fontSize: 22 }} /> : <SendIcon sx={{ fontSize: 22 }} />}
                </Box>
            </Box>
        </Box>
    );
}
