'use client';

import {
    Paper,
    Box,
    Typography,
    Button,
    Chip,
} from '@mui/material';
import { Download as DownloadIcon, BarChart as ChartIcon } from '@mui/icons-material';

interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
    onGenerate: () => void;
    onDownload?: () => void;
    loading?: boolean;
    available?: boolean;
}

export default function ReportCard({
    title,
    description,
    icon,
    accentColor,
    onGenerate,
    onDownload,
    loading = false,
    available = true,
}: ReportCardProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${accentColor}20`,
                borderRadius: 3,
                bgcolor: `${accentColor}06`,
                transition: 'all 0.2s ease',
                '&:hover': {
                    border: `1px solid ${accentColor}40`,
                    bgcolor: `${accentColor}0A`,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: `${accentColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor,
                    }}
                >
                    {icon}
                </Box>
                <Chip
                    size="small"
                    label={available ? 'Disponible' : 'No disponible'}
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: available ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                        color: available ? '#10B981' : 'text.disabled',
                    }}
                />
            </Box>

            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 2, lineHeight: 1.6 }}>
                {description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<ChartIcon />}
                    onClick={onGenerate}
                    disabled={loading || !available}
                    fullWidth
                    sx={{
                        background: `linear-gradient(135deg, ${accentColor}DD, ${accentColor}AA)`,
                        boxShadow: `0 0 16px ${accentColor}30`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                            boxShadow: `0 0 24px ${accentColor}50`,
                        },
                    }}
                >
                    {loading ? 'Generando…' : 'Generar'}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 40, px: 1, borderColor: `${accentColor}40`, color: accentColor }}
                    disabled={!available || !onDownload}
                    onClick={onDownload}
                    title="Descargar"
                >
                    <DownloadIcon fontSize="small" />
                </Button>
            </Box>
        </Paper>
    );
}
