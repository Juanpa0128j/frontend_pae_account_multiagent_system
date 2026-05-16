'use client';

import { Box, Typography } from '@mui/material';
import { SmartToy as AgentIcon } from '@mui/icons-material';
import { AgentStep } from '@/types';
import { AgentStepCard } from './AgentStepCard';
import { fonts, moduleAccents, palette, sxAccentRule, sxLabelSmall } from '@/styles/brutalist';

interface AgentTimelineProps {
    steps: AgentStep[];
    totalDurationMs?: number;
}

export default function AgentTimeline({ steps, totalDurationMs }: AgentTimelineProps) {
    if (!steps || steps.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <AgentIcon sx={{ fontSize: 32, color: palette.paperFaint, mb: 1 }} />
                <Typography sx={{ color: palette.paperFaint }}>
                    Sin trazas del agente disponibles
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={sxAccentRule(moduleAccents.transactions)} />
                    <AgentIcon sx={{ fontSize: 20, color: moduleAccents.transactions }} />
                    <Typography sx={{ ...sxLabelSmall, color: palette.paper }}>
                        Razonamiento del Agente
                    </Typography>
                </Box>
                {totalDurationMs !== undefined && (
                    <Typography
                        sx={{
                            ...sxLabelSmall,
                            color: palette.paperFaint,
                            fontFamily: fonts.mono,
                        }}
                    >
                        Total: {(totalDurationMs / 1000).toFixed(2)}s
                    </Typography>
                )}
            </Box>

            <Box>
                {steps.map((step, idx) => (
                    <AgentStepCard
                        key={`${step.agente}-${idx}`}
                        step={step}
                        isLast={idx === steps.length - 1}
                    />
                ))}
            </Box>
        </Box>
    );
}
