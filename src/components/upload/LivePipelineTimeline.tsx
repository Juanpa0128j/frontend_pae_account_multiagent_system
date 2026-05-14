'use client';

import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { fonts, hexAlpha, moduleAccents, palette, sxLabelSmall } from '@/styles/brutalist';
import { useProcessStatus } from '@/hooks/useProcessing';

interface LivePipelineTimelineProps {
    processId: string;
}

const AGENT_LABELS: Record<string, string> = {
    ingesta: 'INGESTA',
    contador: 'CONTADOR',
    tributario: 'TRIBUTARIO',
    auditor: 'AUDITOR',
    db_persist: 'PERSISTENCIA',
    supervisor: 'SUPERVISOR',
};

const AGENT_ORDER = ['ingesta', 'contador', 'tributario', 'auditor', 'db_persist'];

function agentLabel(agent: string): string {
    return AGENT_LABELS[agent.toLowerCase()] ?? agent.toUpperCase();
}

export default function LivePipelineTimeline({ processId }: LivePipelineTimelineProps) {
    const { data } = useProcessStatus(processId);

    const currentAgent = data?.current_agent ?? null;
    const currentStage = data?.current_stage ?? null;
    const progress = data?.progress ?? 0;
    const agentLog = data?.agent_log ?? [];

    // Deduplicate completed agents from log, preserving order
    const seenAgents = new Set<string>();
    for (const entry of agentLog) {
        const key = entry.agent.toLowerCase();
        if (!seenAgents.has(key)) {
            seenAgents.add(key);
        }
    }

    // Ordered pipeline steps for the track display
    const pipelineAgents = AGENT_ORDER.filter(
        (a) => a !== 'ingesta' // ingesta is pre-processing; skip from live track
    );

    const accent = moduleAccents.upload;

    return (
        <Box
            sx={{
                mt: 2,
                p: { xs: 2, md: 2.5 },
                border: `1px solid ${hexAlpha(accent, 0.2)}`,
                borderRadius: 1,
                bgcolor: hexAlpha(accent, 0.03),
            }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CircularProgress size={16} sx={{ color: accent, flexShrink: 0 }} />
                <Typography sx={{ ...sxLabelSmall, color: accent }}>
                    {'// PIPELINE EN CURSO'}
                </Typography>
            </Box>

            {/* Progress bar */}
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    mb: 2,
                    height: 3,
                    borderRadius: 0,
                    bgcolor: hexAlpha(accent, 0.12),
                    '& .MuiLinearProgress-bar': {
                        bgcolor: accent,
                        boxShadow: `0 0 8px ${hexAlpha(accent, 0.6)}`,
                    },
                }}
            />

            {/* Pipeline step track */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    mb: 2,
                    overflow: 'hidden',
                }}
            >
                {pipelineAgents.map((agent, idx) => {
                    const isDone = seenAgents.has(agent);
                    const isActive = currentAgent?.toLowerCase() === agent && !isDone;
                    const isUpcoming = !isDone && !isActive;

                    return (
                        <Box
                            key={agent}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {/* Node */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    position: 'relative',
                                    flex: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: isDone
                                            ? accent
                                            : isActive
                                              ? accent
                                              : hexAlpha(palette.paper, 0.15),
                                        border: isActive
                                            ? `2px solid ${accent}`
                                            : isDone
                                              ? 'none'
                                              : `2px solid ${hexAlpha(palette.paper, 0.2)}`,
                                        boxShadow: isActive
                                            ? `0 0 8px ${hexAlpha(accent, 0.8)}`
                                            : isDone
                                              ? `0 0 4px ${hexAlpha(accent, 0.4)}`
                                              : 'none',
                                        animation: isActive
                                            ? 'pulse 1.5s ease-in-out infinite'
                                            : 'none',
                                        '@keyframes pulse': {
                                            '0%, 100%': { opacity: 1 },
                                            '50%': { opacity: 0.4 },
                                        },
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.55rem',
                                        letterSpacing: '0.1em',
                                        color: isDone
                                            ? accent
                                            : isActive
                                              ? accent
                                              : palette.paperGhost,
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {agentLabel(agent)}
                                </Typography>
                            </Box>

                            {/* Connector (not after last) */}
                            {idx < pipelineAgents.length - 1 && (
                                <Box
                                    sx={{
                                        height: 1,
                                        width: 20,
                                        bgcolor: isDone
                                            ? hexAlpha(accent, 0.5)
                                            : hexAlpha(palette.paper, 0.1),
                                        flexShrink: 0,
                                        mb: 2.5, // align with dots
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Current stage message */}
            {(currentAgent ?? currentStage) && (
                <Box
                    sx={{
                        p: 1.5,
                        border: `1px solid ${hexAlpha(accent, 0.15)}`,
                        borderRadius: 1,
                        bgcolor: hexAlpha(accent, 0.05),
                    }}
                >
                    {currentAgent && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                letterSpacing: '0.15em',
                                color: accent,
                                mb: 0.5,
                            }}
                        >
                            {'// '}
                            {agentLabel(currentAgent)}
                        </Typography>
                    )}
                    {currentStage && (
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.88rem',
                                color: palette.paperMuted,
                            }}
                        >
                            {currentStage}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Last log entry if nothing in currentStage */}
            {!currentStage && agentLog.length > 0 && (
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.82rem',
                        color: palette.paperFaint,
                        mt: 1,
                    }}
                >
                    {agentLog[agentLog.length - 1].message}
                </Typography>
            )}
        </Box>
    );
}
