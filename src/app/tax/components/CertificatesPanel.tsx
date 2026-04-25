'use client';

import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Checkbox,
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
    Description,
    CheckCircle,
} from '@mui/icons-material';
import { useF220Certificates } from '@/hooks/useTax';
import { palette, fonts, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import type { F220Certificate } from '@/lib/api';

interface CertificatesPanelProps {
    companyNit: string;
}

export default function CertificatesPanel({ companyNit }: CertificatesPanelProps) {
    const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
    const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());

    const { data, isLoading, error } = useF220Certificates(year);

    const toggleSelection = (terceroNit: string) => {
        setSelectedCerts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(terceroNit)) {
                newSet.delete(terceroNit);
            } else {
                newSet.add(terceroNit);
            }
            return newSet;
        });
    };

    const toggleAll = () => {
        if (!data?.certificates) return;
        if (selectedCerts.size === data.certificates.length) {
            setSelectedCerts(new Set());
        } else {
            setSelectedCerts(new Set(data.certificates.map((c) => c.tercero_nit)));
        }
    };

    const handleDownloadSelected = () => {
        // TODO: Implement bulk download
        console.log('Downloading certificates for:', Array.from(selectedCerts));
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
                {'// Certificados de Retención F220'}
            </Typography>

            {/* Year selector */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    mb: 4,
                    p: 2,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 1,
                }}
            >
                <Typography sx={{ ...sxLabelSmall, color: palette.paperMuted }}>
                    {'// AÑO GRAVABLE'}
                </Typography>
                <TextField
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                    size="small"
                    sx={{
                        width: 100,
                        '& .MuiInputBase-root': {
                            bgcolor: palette.ink,
                            color: palette.paper,
                            fontFamily: fonts.mono,
                        },
                    }}
                />
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
                    Error cargando certificados
                </Alert>
            )}

            {/* Loading state */}
            {isLoading ? (
                <Skeleton
                    variant="rectangular"
                    height={300}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            ) : data?.certificates.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        border: `1px dashed ${palette.line}`,
                        borderRadius: 1,
                    }}
                >
                    <Description sx={{ fontSize: 48, color: palette.paperMuted, mb: 2 }} />
                    <Typography sx={{ color: palette.paperMuted, mb: 1 }}>
                        No se encontraron certificados para el año {year}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: hexAlpha(palette.paperMuted, 0.7) }}>
                        No hay pagos sujetos a retención registrados
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Actions bar */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography sx={{ color: palette.paperMuted }}>
                            {data?.total_certificates || 0} certificados encontrados
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            disabled={selectedCerts.size === 0}
                            onClick={handleDownloadSelected}
                            startIcon={<Download />}
                            sx={{
                                bgcolor: palette.accent,
                                color: palette.ink,
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                '&:disabled': {
                                    bgcolor: palette.line,
                                    color: palette.paperMuted,
                                },
                            }}
                        >
                            Descargar seleccionados ({selectedCerts.size})
                        </Button>
                    </Box>

                    {/* Certificates table */}
                    <TableContainer
                        component={Paper}
                        sx={{
                            bgcolor: 'transparent',
                            border: `1px solid ${palette.line}`,
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={
                                                (data?.certificates?.length || 0) > 0 &&
                                                selectedCerts.size === (data?.certificates?.length || 0)
                                            }
                                            indeterminate={
                                                selectedCerts.size > 0 &&
                                                selectedCerts.size < (data?.certificates?.length || 0)
                                            }
                                            onChange={toggleAll}
                                            sx={{
                                                color: palette.paperMuted,
                                                '&.Mui-checked': { color: palette.accent },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }}>
                                        NIT Tercero
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }}>
                                        Nombre
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }} align="right">
                                        Pagos Totales
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }} align="right">
                                        Retenciones
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }}>
                                        Conceptos
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paperMuted, fontFamily: fonts.mono }} align="center">
                                        Acción
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.certificates.map((cert) => (
                                    <TableRow
                                        key={cert.tercero_nit}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: hexAlpha(palette.paper, 0.03),
                                            },
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedCerts.has(cert.tercero_nit)}
                                                onChange={() => toggleSelection(cert.tercero_nit)}
                                                sx={{
                                                    color: palette.paperMuted,
                                                    '&.Mui-checked': { color: palette.accent },
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontFamily: fonts.mono,
                                                color: palette.paper,
                                            }}
                                        >
                                            {cert.tercero_nit}
                                        </TableCell>
                                        <TableCell sx={{ color: palette.paper }}>
                                            {cert.tercero_nombre}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontFamily: fonts.mono,
                                                color: palette.paper,
                                            }}
                                        >
                                            {new Intl.NumberFormat('es-CO', {
                                                style: 'currency',
                                                currency: 'COP',
                                                minimumFractionDigits: 0,
                                            }).format(cert.pagos_totales)}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontFamily: fonts.mono,
                                                color: palette.paper,
                                            }}
                                        >
                                            {new Intl.NumberFormat('es-CO', {
                                                style: 'currency',
                                                currency: 'COP',
                                                minimumFractionDigits: 0,
                                            }).format(cert.retenciones_practicadas)}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {cert.conceptos.slice(0, 2).map((concepto) => (
                                                    <Chip
                                                        key={concepto}
                                                        label={concepto}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: hexAlpha(palette.accent, 0.1),
                                                            color: palette.accent,
                                                            fontSize: '0.65rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                ))}
                                                {cert.conceptos.length > 2 && (
                                                    <Chip
                                                        label={`+${cert.conceptos.length - 2}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: hexAlpha(palette.paperMuted, 0.1),
                                                            color: palette.paperMuted,
                                                            fontSize: '0.65rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                startIcon={<Download />}
                                                sx={{
                                                    color: palette.accent,
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.7rem',
                                                    '&:hover': {
                                                        bgcolor: hexAlpha(palette.accent, 0.1),
                                                    },
                                                }}
                                            >
                                                PDF
                                            </Button>
                                        </TableCell>
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
