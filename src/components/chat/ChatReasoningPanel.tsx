'use client';

import React, { useEffect, useId, useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { ExpandMore, Psychology } from '@mui/icons-material';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import type { ChatReasoningPhase, ChatReasoningStep } from '@/types';

interface ChatReasoningPanelProps {
    steps: ChatReasoningStep[];
    /** When true, auto-open the panel as soon as the first step arrives (streaming). */
    autoOpenWhileStreaming?: boolean;
}

const PHASE_COLORS: Record<ChatReasoningPhase, string> = {
    intent: palette.chartreuse,
    params: palette.accent,
    gathering_data: palette.amber,
    rag: palette.pink,
    generating: palette.chartreuse,
    complete: palette.success,
};

// Accountant-friendly Spanish labels (no programmer jargon, no `//` code style).
const PHASE_LABELS: Record<ChatReasoningPhase, string> = {
    intent: 'INTERPRETACIÓN',
    params: 'EMPRESA Y PERIODO',
    gathering_data: 'DATOS CONTABLES',
    rag: 'NORMATIVA',
    generating: 'MODELO IA',
    complete: 'RESULTADO',
};

/** Format a step duration in seconds with Spanish decimal comma, e.g. '0,7 s'. */
function formatDuration(ms: number): string {
    return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}

const PULSE_KEYFRAMES = {
    '@keyframes reasoningPulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.4 },
    },
};

function ChatReasoningPanel({ steps, autoOpenWhileStreaming = false }: ChatReasoningPanelProps) {
    const [open, setOpen] = useState(false);
    const [autoOpenedOnce, setAutoOpenedOnce] = useState(false);
    const contentId = useId();

    // Auto-open once on first step while streaming. Respects manual close: if
    // the user collapses the panel later, we do not reopen on subsequent steps.
    useEffect(() => {
        if (autoOpenWhileStreaming && steps.length > 0 && !autoOpenedOnce) {
            setOpen(true);
            setAutoOpenedOnce(true);
        }
    }, [autoOpenWhileStreaming, steps.length, autoOpenedOnce]);

    if (!steps?.length) {
        return null;
    }

    const toggle = () => setOpen((prev) => !prev);

    return (
        <Box
            sx={{
                mt: 1.25,
                border: `1px solid ${palette.line}`,
                borderRadius: 0.5,
                bgcolor: hexAlpha(palette.chartreuse, 0.04),
            }}
        >
            <Box
                onClick={toggle}
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-controls={contentId}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    }
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.25,
                    py: 0.75,
                    cursor: 'pointer',
                    gap: 0.75,
                    userSelect: 'none',
                    outline: 'none',
                    '&:hover': {
                        bgcolor: hexAlpha(palette.chartreuse, 0.07),
                    },
                    '&:focus-visible': {
                        boxShadow: `inset 0 0 0 2px ${palette.chartreuse}`,
                        bgcolor: hexAlpha(palette.chartreuse, 0.07),
                    },
                }}
            >
                <Psychology sx={{ fontSize: 14, color: palette.chartreuse }} />
                <Typography sx={{ ...sxLabelSmall, color: palette.chartreuse }}>
                    {`RAZONAMIENTO DEL ASISTENTE (${steps.length} ${steps.length === 1 ? 'PASO' : 'PASOS'})`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <ExpandMore
                    sx={{
                        fontSize: 16,
                        color: palette.paperMuted,
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: `transform ${motion.duration.sm} ${motion.snap}`,
                    }}
                />
            </Box>

            <Collapse in={open} unmountOnExit>
                <Box id={contentId} sx={{ px: 1.25, pb: 1.25, pt: 0.5 }}>
                    {steps.map((step, i) => {
                        const isError = step.status === 'error';
                        const isRunning = step.status === 'running';
                        const baseColor = PHASE_COLORS[step.phase] ?? palette.paperMuted;
                        const color = isError ? palette.error : baseColor;
                        const isLast = i === steps.length - 1;
                        return (
                            <Box
                                key={`${step.phase}-${step.timestamp ?? i}-${i}`}
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mb: isLast ? 0 : 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        pt: 0.25,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            bgcolor: color,
                                            boxShadow: `0 0 8px ${color}`,
                                            ...(isRunning && {
                                                ...PULSE_KEYFRAMES,
                                                animation:
                                                    'reasoningPulse 1.2s ease-in-out infinite',
                                            }),
                                        }}
                                    />
                                    {!isLast && (
                                        <Box
                                            sx={{
                                                width: 1,
                                                flex: 1,
                                                bgcolor: palette.line,
                                                mt: 0.5,
                                                minHeight: 16,
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.75,
                                            alignItems: 'baseline',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                ...sxLabelSmall,
                                                color,
                                            }}
                                        >
                                            {PHASE_LABELS[step.phase] ?? step.phase.toUpperCase()}
                                        </Typography>
                                        {step.duration_ms != null && (
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: 10,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {formatDuration(step.duration_ms)}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: 12,
                                            color: palette.paperDim,
                                            mt: 0.25,
                                        }}
                                    >
                                        {step.label}
                                    </Typography>
                                    {step.detail && (
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: 10.5,
                                                color: palette.paperMuted,
                                                mt: 0.25,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {step.detail}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Collapse>
        </Box>
    );
}

export default React.memo(ChatReasoningPanel);
