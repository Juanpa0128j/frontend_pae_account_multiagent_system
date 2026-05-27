'use client';

import { Box, Typography, Grid } from '@mui/material';
import { FileUploadState } from '@/types';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import { formatDate, formatNIT } from '@/lib/formatters';
import { palette, fonts, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

interface FilePreviewProps {
    files: FileUploadState[];
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 1,
                py: 0.6,
                borderBottom: `1px solid ${palette.lineFaint}`,
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.62rem',
                    color: palette.paperGhost,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </Typography>
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: palette.paper,
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '60%',
                }}
            >
                {children}
            </Typography>
        </Box>
    );
}

export default function FilePreview({ files }: FilePreviewProps) {
    const doneFiles = files.filter((f) => f.status === 'done' && f.extracted);
    if (doneFiles.length === 0) return null;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                    sx={{
                        width: 24,
                        height: 2,
                        bgcolor: palette.success,
                        boxShadow: `0 0 6px ${palette.success}`,
                    }}
                />
                <Typography sx={{ ...sxLabelSmall, color: palette.success }}>
                    {'// EXTRACCIÓN VERIFICADA'}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.4rem', md: '1.8rem' },
                    fontWeight: 700,
                    color: palette.paper,
                    letterSpacing: '-0.03em',
                    mb: 2.5,
                }}
            >
                Resumen de extracción.
            </Typography>

            <Typography
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.84rem',
                    color: palette.paperFaint,
                    mb: 2.5,
                }}
            >
                Este bloque muestra los campos detectados en cada archivo cargado, no un visor del
                PDF original.
            </Typography>

            <Grid container spacing={1.5}>
                {doneFiles.map((fs) => (
                    <Grid item xs={12} sm={6} key={fs.id}>
                        <Box
                            sx={{
                                position: 'relative',
                                p: 2,
                                border: `1px solid ${hexAlpha(palette.success, 0.3)}`,
                                bgcolor: hexAlpha(palette.success, 0.04),
                                borderRadius: 1,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Top stripe */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    bgcolor: palette.success,
                                }}
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 6,
                                        height: 6,
                                        bgcolor: palette.success,
                                        boxShadow: `0 0 6px ${palette.success}`,
                                        borderRadius: '50%',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.65rem',
                                        color: palette.success,
                                        letterSpacing: '0.18em',
                                        fontWeight: 700,
                                    }}
                                >
                                    OK
                                </Typography>
                            </Box>

                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.92rem',
                                    fontWeight: 700,
                                    color: palette.paper,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mb: fs.file_names && fs.file_names.length > 1 ? 0.5 : 1.5,
                                }}
                                title={
                                    fs.file?.name ??
                                    fs.file_names?.[0] ??
                                    fs.files?.[0]?.name ??
                                    fs.display_name ??
                                    'archivo'
                                }
                            >
                                {(() => {
                                    if (fs.file_names && fs.file_names.length > 0) {
                                        return fs.file_names[0];
                                    }
                                    const grouped = fs.files ?? (fs.file ? [fs.file] : []);
                                    if (grouped.length <= 1)
                                        return (
                                            fs.file?.name ??
                                            grouped[0]?.name ??
                                            fs.display_name ??
                                            'archivo'
                                        );
                                    return `${grouped[0].name} +${grouped.length - 1}`;
                                })()}
                            </Typography>
                            {fs.file_names && fs.file_names.length > 1 && (
                                <Box
                                    sx={{
                                        mb: 1.5,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0.25,
                                    }}
                                >
                                    {fs.file_names.map((name, i) => (
                                        <Typography
                                            key={i}
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.62rem',
                                                color: palette.paperFaint,
                                                letterSpacing: '0.08em',
                                            }}
                                        >
                                            {`· ${name}`}
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                            {fs.extracted && (
                                <Box>
                                    {fs.extracted.fecha && (
                                        <PreviewRow label="Fecha">
                                            {formatDate(fs.extracted.fecha)}
                                        </PreviewRow>
                                    )}
                                    {fs.extracted.nit && (
                                        <PreviewRow label="NIT Emisor">
                                            <Box component="span" sx={{ fontFamily: fonts.mono }}>
                                                {formatNIT(fs.extracted.nit)}
                                            </Box>
                                        </PreviewRow>
                                    )}
                                    {fs.extracted.concepto && (
                                        <PreviewRow label="Concepto">
                                            {fs.extracted.concepto}
                                        </PreviewRow>
                                    )}
                                    {fs.extracted.total !== undefined && (
                                        <PreviewRow label="Total">
                                            <MoneyDisplay
                                                value={fs.extracted.total}
                                                variant="caption"
                                            />
                                        </PreviewRow>
                                    )}
                                    {fs.extracted.source_file && (
                                        <PreviewRow label="Archivo origen">
                                            <Box
                                                component="span"
                                                sx={{ fontFamily: fonts.mono, fontSize: '0.82rem' }}
                                            >
                                                {fs.extracted.source_file}
                                            </Box>
                                        </PreviewRow>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
