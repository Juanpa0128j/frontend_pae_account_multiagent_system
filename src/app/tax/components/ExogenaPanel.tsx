'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    Chip,
    Skeleton,
} from '@mui/material';
import {
    Download,
    TableChart,
    Warning,
} from '@mui/icons-material';
import { useExogenaFormat } from '@/hooks/useTax';
import { palette, fonts, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { downloadCsv } from '@/lib/downloadFile';

type ExogenaFormat = '1001' | '2276';

interface ExogenaPanelProps {
    companyNit: string;
}

const FORMAT_INFO: Record<ExogenaFormat, { label: string; description: string }> = {
    '1001': {
        label: 'Formato 1001',
        description: 'Pagos o abonos en cuenta y retenciones practicadas',
    },
    '2276': {
        label: 'Formato 2276',
        description: 'Información de rentas de trabajo y pensiones',
    },
};

export default function ExogenaPanel({ companyNit: _companyNit }: ExogenaPanelProps) {
    const [selectedFormat, setSelectedFormat] = useState<ExogenaFormat>('1001');
    const [year, setYear] = useState<number>(new Date().getFullYear() - 1);

    const { data, isLoading, error } = useExogenaFormat(selectedFormat, year);

    // Don't render if no company selected
    if (!_companyNit) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: palette.paperMuted }}>
                    Seleccione una empresa para ver la información exógena
                </Typography>
            </Box>
        );
    }

    const handleFormatChange = (
        _: React.MouseEvent<HTMLElement>,
        newFormat: ExogenaFormat | null
    ) => {
        if (newFormat) {
            setSelectedFormat(newFormat);
        }
    };

    const handleDownloadExcel = () => {
        // TODO: Implement Excel download
        console.log('Downloading Excel for format', selectedFormat);
    };

    const handleDownloadCSV = () => {
        if (!data?.rows || data.rows.length === 0) return;

        // Get headers from first row keys
        const headers = Object.keys(data.rows[0]);

        // Build CSV content
        const csvRows = [
            headers.join(','),
            ...data.rows.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape strings with quotes, handle null/undefined
                    if (value === null || value === undefined) return '""';
                    const str = String(value);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return `"${str}"`;
                }).join(',')
            )
        ];

        const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8
        downloadCsv(csvContent, `EXOGENA_${selectedFormat}_${year}.csv`);
    };

    return (
        <Box>
            {/* Header */}
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: palette.paperMuted,
                    mb: 3,
                }}
            >
                {'// Información Exógena - Medios Magnéticos'}
            </Typography>

            {/* Warning banner */}
            <Alert
                severity="warning"
                icon={<Warning />}
                sx={{
                    mb: 3,
                    bgcolor: hexAlpha(palette.amber, 0.1),
                    color: palette.amber,
                    border: `1px solid ${palette.amber}`,
                    '& .MuiAlert-icon': { color: palette.amber },
                }}
            >
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Importante: Validación DIAN
                </Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>
                    Los datos deben cumplir con la normalización DIAN (mayúsculas, sin tildes,
                    códigos de municipio válidos). Errores pueden generar sanciones.
                </Typography>
            </Alert>

            {/* Format selector */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 4,
                    p: 2,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 1,
                }}
            >
                <Box>
                    <Typography sx={{ ...sxLabelSmall, mb: 1, color: palette.paperMuted }}>
                        {'// FORMATO'}
                    </Typography>
                    <ToggleButtonGroup
                        value={selectedFormat}
                        exclusive
                        onChange={handleFormatChange}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                color: palette.paperMuted,
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                borderColor: palette.line,
                                '&.Mui-selected': {
                                    bgcolor: hexAlpha(palette.accent, 0.15),
                                    color: palette.accent,
                                    borderColor: palette.accent,
                                },
                                '&:hover': {
                                    bgcolor: hexAlpha(palette.accent, 0.08),
                                },
                            },
                        }}
                    >
                        <ToggleButton value="1001">
                            1001 - Pagos y Retenciones
                        </ToggleButton>
                        <ToggleButton value="2276">
                            2276 - Rentas de Trabajo
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ ...sxLabelSmall, mb: 1, color: palette.paperMuted }}>
                        {'// AÑO GRAVABLE'}
                    </Typography>
                    <TextField
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear() - 1)}
                        size="small"
                        sx={{
                            width: 100,
                            '& .MuiInputBase-root': {
                                bgcolor: palette.ink,
                                color: palette.paper,
                                fontFamily: fonts.mono,
                                fontSize: '1.2rem',
                                fontWeight: 700,
                            },
                        }}
                    />
                </Box>
            </Box>

            {/* Format description */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: palette.paper,
                        mb: 0.5,
                    }}
                >
                    {FORMAT_INFO[selectedFormat].label}
                </Typography>
                <Typography sx={{ color: palette.paperMuted, fontSize: '0.9rem' }}>
                    {FORMAT_INFO[selectedFormat].description}
                </Typography>
            </Box>

            {/* Error state */}
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: hexAlpha(palette.error, 0.1),
                        color: palette.error,
                        border: `1px solid ${palette.error}`,
                    }}
                >
                    Error cargando datos exógena
                </Alert>
            )}

            {/* Loading state */}
            {isLoading ? (
                <Skeleton
                    variant="rectangular"
                    height={400}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            ) : data?.total_rows === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        border: `1px dashed ${palette.line}`,
                        borderRadius: 1,
                    }}
                >
                    <TableChart sx={{ fontSize: 48, color: palette.paperMuted, mb: 2 }} />
                    <Typography sx={{ color: palette.paperMuted, mb: 1 }}>
                        No hay datos para el formato {selectedFormat} en {year}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: hexAlpha(palette.paperMuted, 0.7) }}>
                        Verifique que haya transacciones registradas
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Stats and actions */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip
                                label={`${data?.total_rows || 0} registros`}
                                sx={{
                                    bgcolor: hexAlpha(palette.accent, 0.1),
                                    color: palette.accent,
                                    fontFamily: fonts.mono,
                                }}
                            />
                            {data && data.invalid_rows > 0 && (
                                <Chip
                                    label={`${data.invalid_rows} con errores`}
                                    sx={{
                                        bgcolor: hexAlpha(palette.error, 0.1),
                                        color: palette.error,
                                        fontFamily: fonts.mono,
                                    }}
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleDownloadCSV}
                                startIcon={<Download />}
                                sx={{
                                    borderColor: palette.line,
                                    color: palette.paper,
                                    fontFamily: fonts.mono,
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                        borderColor: palette.accent,
                                        color: palette.accent,
                                    },
                                }}
                            >
                                CSV
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleDownloadExcel}
                                startIcon={<Download />}
                                sx={{
                                    bgcolor: palette.accent,
                                    color: palette.ink,
                                    fontFamily: fonts.mono,
                                    fontSize: '0.75rem',
                                    '&:hover': {
                                        bgcolor: hexAlpha(palette.accent, 0.85),
                                    },
                                }}
                            >
                                Excel
                            </Button>
                        </Box>
                    </Box>

                    {/* Data table */}
                    <TableContainer
                        component={Paper}
                        sx={{
                            bgcolor: 'transparent',
                            border: `1px solid ${palette.line}`,
                            maxHeight: 500,
                        }}
                    >
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {data?.rows[0] &&
                                        Object.keys(data.rows[0]).map((key) => (
                                            <TableCell
                                                key={key}
                                                sx={{
                                                    bgcolor: palette.ink,
                                                    color: palette.paperMuted,
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {key}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.rows.map((row, idx) => (
                                    <TableRow
                                        key={idx}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: hexAlpha(palette.paper, 0.03),
                                            },
                                        }}
                                    >
                                        {Object.values(row).map((value, cellIdx) => (
                                            <TableCell
                                                key={cellIdx}
                                                sx={{
                                                    color: palette.paper,
                                                    fontFamily: typeof value === 'number' ? fonts.mono : 'inherit',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {typeof value === 'number'
                                                    ? new Intl.NumberFormat('es-CO').format(value)
                                                    : String(value || '-')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
}
