'use client';

import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { UploadFile as UploadIcon } from '@mui/icons-material';
import { palette, fonts, hexAlpha, moduleAccents } from '@/styles/brutalist';

const ACCENT = moduleAccents.upload ?? palette.accent;

interface ViaBMultiDropZoneProps {
    onFilesDropped: (files: File[]) => void;
    isUploading: boolean;
    disabled: boolean;
    slotsFilledCount: number;
}

export default function ViaBMultiDropZone({
    onFilesDropped,
    isUploading,
    disabled,
    slotsFilledCount,
}: ViaBMultiDropZoneProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files || disabled) return;
        const pdfs = Array.from(files)
            .filter((f) => f.type === 'application/pdf')
            .slice(0, 4);
        if (pdfs.length > 0) onFilesDropped(pdfs);
    };

    return (
        <Box
            onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) setDragActive(true);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                handleFiles(e.dataTransfer.files);
            }}
            onClick={() => !disabled && inputRef.current?.click()}
            sx={{
                width: '100%',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: `1px ${dragActive ? 'solid' : 'dashed'} ${dragActive ? ACCENT : hexAlpha(palette.paper, 0.3)}`,
                bgcolor: dragActive ? hexAlpha(ACCENT, 0.06) : 'transparent',
                boxShadow: dragActive ? `0 0 16px ${hexAlpha(ACCENT, 0.25)}` : 'none',
                transition: 'border 0.15s, bgcolor 0.15s, box-shadow 0.15s',
                mb: 2.5,
                opacity: disabled ? 0.5 : 1,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgcolor: dragActive ? ACCENT : 'transparent',
                    boxShadow: dragActive ? `0 0 8px ${ACCENT}` : 'none',
                    transition: 'all 0.15s',
                },
            }}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
            />

            <UploadIcon
                sx={{
                    fontSize: 28,
                    color: dragActive ? ACCENT : hexAlpha(palette.paper, 0.4),
                    transition: 'color 0.15s',
                }}
            />

            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    letterSpacing: '0.12em',
                    color: dragActive ? ACCENT : hexAlpha(palette.paper, 0.6),
                    transition: 'color 0.15s',
                }}
            >
                {isUploading ? '// CARGANDO...' : '// SOLTAR 1–4 PDFs AQUÍ'}
            </Typography>

            <Typography
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.75rem',
                    color: hexAlpha(palette.paper, 0.4),
                    textAlign: 'center',
                    px: 3,
                }}
            >
                {slotsFilledCount > 0
                    ? `// ${slotsFilledCount}/4 ASIGNADOS — suelta más o haz clic para seleccionar`
                    : 'Clasifica automáticamente: Balance, Estado de Resultados, Libro Auxiliar y Balance anterior'}
            </Typography>
        </Box>
    );
}
