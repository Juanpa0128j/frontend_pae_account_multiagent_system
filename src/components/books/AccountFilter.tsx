'use client';

import { Box, TextField, InputAdornment } from '@mui/material';
import { palette, fonts, motion, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { BrutalistButton } from '@/components/brutalist';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    CalendarToday as DateIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { BookFilter, BookType } from '@/types';

interface AccountFilterProps {
    bookType: BookType;
    onFilter: (filter: BookFilter) => void;
}

export default function AccountFilter({ bookType, onFilter }: AccountFilterProps) {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [cuentaPuc, setCuentaPuc] = useState('');
    const [terceroNit, setTerceroNit] = useState('');

    const handleApply = () => {
        onFilter({
            tipo: bookType,
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
            cuenta_puc: cuentaPuc || undefined,
            tercero_nit: terceroNit || undefined,
        });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                p: 2,
                borderRadius: 2,
                border: `1px solid ${palette.lineFaint}`,
                bgcolor: hexAlpha(palette.paper, 0.01),
                mb: 2,
            }}
        >
            <TextField
                size="small"
                type="date"
                label="Desde"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <DateIcon sx={{ fontSize: 16, color: palette.paperGhost }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                        bgcolor: hexAlpha(palette.paper, 0.04),
                        color: palette.paper,
                        fontFamily: fonts.mono,
                        fontSize: '0.82rem',
                        borderRadius: 1,
                        transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.line,
                    },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.lineStrong,
                    },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: moduleAccents.books,
                    },
                    '& .MuiInputLabel-root': {
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        color: palette.paperMuted,
                        '&.Mui-focused': { color: moduleAccents.books },
                    },
                }}
            />
            <TextField
                size="small"
                type="date"
                label="Hasta"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <DateIcon sx={{ fontSize: 16, color: palette.paperGhost }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                        bgcolor: hexAlpha(palette.paper, 0.04),
                        color: palette.paper,
                        fontFamily: fonts.mono,
                        fontSize: '0.82rem',
                        borderRadius: 1,
                        transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.line,
                    },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.lineStrong,
                    },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: moduleAccents.books,
                    },
                    '& .MuiInputLabel-root': {
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        color: palette.paperMuted,
                        '&.Mui-focused': { color: moduleAccents.books },
                    },
                }}
            />
            <TextField
                size="small"
                label="Cuenta PUC"
                placeholder="ej. 5195"
                value={cuentaPuc}
                onChange={(e) => setCuentaPuc(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 16, color: palette.paperGhost }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    minWidth: 130,
                    '& .MuiInputBase-root': {
                        bgcolor: hexAlpha(palette.paper, 0.04),
                        color: palette.paper,
                        fontFamily: fonts.mono,
                        fontSize: '0.82rem',
                        borderRadius: 1,
                        transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.line,
                    },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: palette.lineStrong,
                    },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: moduleAccents.books,
                    },
                    '& .MuiInputLabel-root': {
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        color: palette.paperMuted,
                        '&.Mui-focused': { color: moduleAccents.books },
                    },
                }}
            />
            {bookType === 'auxiliar' && (
                <TextField
                    size="small"
                    label="NIT Tercero"
                    placeholder="ej. 900123456"
                    value={terceroNit}
                    onChange={(e) => setTerceroNit(e.target.value)}
                    sx={{
                        minWidth: 150,
                        '& .MuiInputBase-root': {
                            bgcolor: hexAlpha(palette.paper, 0.04),
                            color: palette.paper,
                            fontFamily: fonts.mono,
                            fontSize: '0.82rem',
                            borderRadius: 1,
                            transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: palette.line,
                        },
                        '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: palette.lineStrong,
                        },
                        '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: moduleAccents.books,
                        },
                        '& .MuiInputLabel-root': {
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            color: palette.paperMuted,
                            '&.Mui-focused': { color: moduleAccents.books },
                        },
                    }}
                />
            )}
            <BrutalistButton
                accent={moduleAccents.books}
                variant="primary"
                size="sm"
                icon={<FilterIcon sx={{ fontSize: 16 }} />}
                onClick={handleApply}
            >
                Filtrar
            </BrutalistButton>
        </Box>
    );
}
