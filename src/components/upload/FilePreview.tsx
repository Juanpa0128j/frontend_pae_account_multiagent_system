'use client';

import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import { CheckCircle as OkIcon } from '@mui/icons-material';
import { FileUploadState } from '@/types';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { formatDate, formatNIT } from '@/lib/formatters';

interface FilePreviewProps {
    files: FileUploadState[];
}

export default function FilePreview({ files }: FilePreviewProps) {
    const doneFiles = files.filter((f) => f.status === 'done' && f.extracted);
    if (doneFiles.length === 0) return null;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <OkIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                    Datos Extraídos — Verificación Rápida
                </Typography>
            </Box>

            <Grid container spacing={1.5}>
                {doneFiles.map((fs) => (
                    <Grid item xs={12} sm={6} key={fs.id}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '1px solid rgba(16,185,129,0.2)',
                                borderRadius: 2,
                                bgcolor: 'rgba(16,185,129,0.04)',
                            }}
                        >
                            <Typography variant="caption" fontWeight={700} color="text.secondary" noWrap display="block" sx={{ mb: 1 }}>
                                {fs.file.name}
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            {fs.extracted && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {fs.extracted.fecha && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                            <Typography variant="caption" fontWeight={600}>{formatDate(fs.extracted.fecha)}</Typography>
                                        </Box>
                                    )}
                                    {fs.extracted.nit && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" color="text.secondary">NIT Emisor</Typography>
                                            <Typography variant="caption" fontWeight={600} fontFamily="monospace">
                                                {formatNIT(fs.extracted.nit)}
                                            </Typography>
                                        </Box>
                                    )}
                                    {fs.extracted.concepto && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" color="text.secondary">Concepto</Typography>
                                            <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                                                {fs.extracted.concepto}
                                            </Typography>
                                        </Box>
                                    )}
                                    {fs.extracted.total !== undefined && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">Total</Typography>
                                            <MoneyDisplay value={fs.extracted.total} variant="caption" />
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
