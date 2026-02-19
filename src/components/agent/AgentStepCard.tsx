'use client';

import {
    Box,
    Typography,
    Chip,
    Paper,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Replay as RetryIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import React, { useState } from 'react';
import { AgentStep } from '@/types';
import { formatDuration } from '@/lib/formatters';

const AGENT_COLORS: Record<string, string> = {
    Supervisor: '#6366F1',
    Ingesta: '#3B82F6',
    Contador: '#10B981',
    Tributario: '#F59E0B',
    Auditor: '#8B5CF6',
};

const RESULT_ICON: Record<string, React.ReactNode> = {
    success: <SuccessIcon sx={{ fontSize: 16, color: '#10B981' }} />,
    error: <ErrorIcon sx={{ fontSize: 16, color: '#EF4444' }} />,
    retry: <RetryIcon sx={{ fontSize: 16, color: '#F59E0B' }} />,
};

interface AgentStepCardProps {
    step: AgentStep;
    isLast?: boolean;
}

export function AgentStepCard({ step, isLast = false }: AgentStepCardProps) {
    const [expanded, setExpanded] = useState(false);
    const color = AGENT_COLORS[step.agente] || '#6366F1';

    return (
        <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
            {/* Timeline line */}
            {!isLast && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: 15,
                        top: 32,
                        bottom: -8,
                        width: 2,
                        bgcolor: 'rgba(255,255,255,0.06)',
                    }}
                />
            )}

            {/* Dot */}
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: `${color}20`,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.5,
                    boxShadow: `0 0 12px ${color}40`,
                }}
            >
                {RESULT_ICON[step.resultado]}
            </Box>

            {/* Card */}
            <Paper
                elevation={0}
                sx={{
                    flex: 1,
                    mb: isLast ? 0 : 1.5,
                    p: 1.5,
                    border: `1px solid ${color}25`,
                    bgcolor: `${color}08`,
                    borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>
                            {step.agente}
                        </Typography>
                        <Chip
                            size="small"
                            label={formatDuration(step.duracion_ms)}
                            sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: 'rgba(255,255,255,0.06)',
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                            }}
                        />
                    </Box>
                    <IconButton size="small" onClick={() => setExpanded((e) => !e)} sx={{ p: 0.25, color: 'text.disabled' }}>
                        {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                    </IconButton>
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {step.accion}
                </Typography>

                <Collapse in={expanded}>
                    <Box
                        sx={{
                            mt: 1,
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                            &ldquo;{step.detalle}&rdquo;
                        </Typography>
                    </Box>
                </Collapse>
            </Paper>
        </Box>
    );
}
