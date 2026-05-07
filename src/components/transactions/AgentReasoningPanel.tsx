'use client';

import { useState } from 'react';
import { Box, Collapse, Typography, IconButton, Paper, Chip } from '@mui/material';
import {
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Psychology as BrainIcon,
} from '@mui/icons-material';
import type { AgentStep } from '@/types';

interface AgentReasoningPanelProps {
    steps: AgentStep[];
    defaultExpanded?: boolean;
}

const AGENT_COLOR: Record<string, string> = {
    Supervisor: '#6366F1',
    Ingesta: '#3B82F6',
    Contador: '#10B981',
    Tributario: '#F59E0B',
    Auditor: '#8B5CF6',
};

export default function AgentReasoningPanel({
    steps,
    defaultExpanded = false,
}: AgentReasoningPanelProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!steps || steps.length === 0) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'rgba(99,102,241,0.03)',
            }}
        >
            {/* Header — always visible, click to expand */}
            <Box
                onClick={() => setExpanded((e) => !e)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                    transition: 'background 0.15s ease',
                }}
            >
                <BrainIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ flex: 1, color: 'primary.light' }}
                >
                    Razonamiento del agente ({steps.length} pasos)
                </Typography>
                <IconButton size="small" sx={{ p: 0, color: 'primary.main' }}>
                    {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                </IconButton>
            </Box>

            {/* Expanded content */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {steps.map((step, idx) => {
                        const color = AGENT_COLOR[step.agente] ?? '#9CA3AF';
                        return (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                    p: 1.25,
                                    borderRadius: 1.5,
                                    bgcolor: `${color}08`,
                                    border: `1px solid ${color}18`,
                                }}
                            >
                                {/* Step number bubble */}
                                <Box
                                    sx={{
                                        minWidth: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        bgcolor: color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mt: 0.1,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}
                                    >
                                        {idx + 1}
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            mb: 0.4,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            label={step.agente}
                                            sx={{
                                                height: 18,
                                                fontSize: '0.62rem',
                                                fontWeight: 700,
                                                bgcolor: `${color}18`,
                                                color: color,
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: '0.7rem' }}
                                        >
                                            {step.accion}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                ml: 'auto',
                                                color: 'text.disabled',
                                                fontFamily: 'monospace',
                                                fontSize: '0.68rem',
                                            }}
                                        >
                                            {step.duracion_ms}ms
                                        </Typography>
                                    </Box>
                                    {step.detalle && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                                lineHeight: 1.5,
                                                fontSize: '0.72rem',
                                            }}
                                        >
                                            &ldquo;{step.detalle}&rdquo;
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Collapse>
        </Paper>
    );
}
