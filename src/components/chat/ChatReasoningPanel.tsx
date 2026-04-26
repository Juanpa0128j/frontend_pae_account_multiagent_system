'use client';

import React, { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { ExpandMore, Psychology } from '@mui/icons-material';
import {
    palette,
    fonts,
    motion,
    sxLabelSmall,
    hexAlpha,
} from '@/styles/brutalist';
import type { ChatReasoningPhase, ChatReasoningStep } from '@/types';

interface ChatReasoningPanelProps {
    steps: ChatReasoningStep[];
}

const PHASE_COLORS: Record<ChatReasoningPhase, string> = {
    intent: palette.chartreuse,
    params: palette.accent,
    gathering_data: palette.amber,
    rag: palette.pink,
    generating: palette.chartreuse,
    complete: palette.success,
};

export default function ChatReasoningPanel({ steps }: ChatReasoningPanelProps) {
    const [open, setOpen] = useState(false);

    if (!steps?.length) {
        return null;
    }

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
                onClick={() => setOpen(!open)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpen(!open);
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
                    '&:hover': {
                        bgcolor: hexAlpha(palette.chartreuse, 0.07),
                    },
                }}
            >
                <Psychology sx={{ fontSize: 14, color: palette.chartreuse }} />
                <Typography sx={{ ...sxLabelSmall, color: palette.chartreuse }}>
                    {`// RAZONAMIENTO (${steps.length} ${
                        steps.length === 1 ? 'PASO' : 'PASOS'
                    })`}
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
                <Box sx={{ px: 1.25, pb: 1.25, pt: 0.5 }}>
                    {steps.map((step, i) => {
                        const color =
                            PHASE_COLORS[step.phase] ?? palette.paperMuted;
                        const isLast = i === steps.length - 1;
                        return (
                            <Box
                                key={`${step.phase}-${i}`}
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
                                            {`// ${step.phase.toUpperCase()}`}
                                        </Typography>
                                        {step.duration_ms != null && (
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: 10,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {step.duration_ms}ms
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
