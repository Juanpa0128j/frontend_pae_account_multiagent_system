'use client';

import { Box, Typography, Paper } from '@mui/material';
import { SmartToy as AgentIcon } from '@mui/icons-material';
import { AgentStep } from '@/types';
import { AgentStepCard } from './AgentStepCard';

interface AgentTimelineProps {
    steps: AgentStep[];
    totalDurationMs?: number;
}

export default function AgentTimeline({ steps, totalDurationMs }: AgentTimelineProps) {
    if (!steps || steps.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 2,
                }}
            >
                <AgentIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    Sin trazas del agente disponibles
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AgentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                        Razonamiento del Agente
                    </Typography>
                </Box>
                {totalDurationMs !== undefined && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
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
