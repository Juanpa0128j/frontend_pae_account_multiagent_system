'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';
import { CloudUpload as UploadIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

interface DropZoneProps {
    onFilesAccepted: (files: File[]) => void;
    disabled?: boolean;
}

const ACCEPTED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/xml': ['.xml'],
    'application/xml': ['.xml'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
};

const ACCENT = palette.chartreuse;

export default function DropZone({ onFilesAccepted, disabled = false }: DropZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) onFilesAccepted(acceptedFiles);
        },
        [onFilesAccepted]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone(
        {
            onDrop,
            accept: ACCEPTED_TYPES,
            disabled,
            maxSize: 20 * 1024 * 1024,
        }
    );

    const stateColor = isDragReject ? palette.error : isDragActive ? ACCENT : palette.line;
    const stateBg = isDragReject
        ? hexAlpha(palette.error, 0.06)
        : isDragActive
          ? hexAlpha(ACCENT, 0.08)
          : 'transparent';

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    position: 'relative',
                    py: { xs: 6, md: 8 },
                    px: 4,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: `1px dashed ${stateColor}`,
                    borderRadius: 1,
                    bgcolor: stateBg,
                    overflow: 'hidden',
                    transition: `all ${motion.duration.md} ${motion.snap}`,
                    opacity: disabled ? 0.5 : 1,
                    // Diagonal stripes background pattern (subtle)
                    backgroundImage: !isDragActive
                        ? `repeating-linear-gradient(45deg, transparent 0 18px, ${hexAlpha(ACCENT, 0.02)} 18px 19px)`
                        : 'none',
                    '&:hover': !disabled
                        ? {
                              borderColor: ACCENT,
                              bgcolor: hexAlpha(ACCENT, 0.04),
                              '& .dz-icon': { transform: 'translateY(-3px) rotate(-3deg)' },
                              '& .dz-arrow': { transform: 'translateY(2px)' },
                          }
                        : {},
                }}
            >
                <input {...getInputProps()} />

                {/* Top-left mono label */}
                <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                    <Typography sx={{ ...sxLabelSmall, color: ACCENT }}>{'// DROPZONE'}</Typography>
                </Box>
                {/* Top-right size info */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost }}>
                        MAX 20MB
                    </Typography>
                </Box>

                {/* Big icon with arrow accent */}
                <Box
                    className="dz-icon"
                    sx={{
                        width: 72,
                        height: 72,
                        bgcolor: isDragActive ? ACCENT : hexAlpha(ACCENT, 0.12),
                        color: isDragActive ? palette.ink : ACCENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        borderRadius: 1,
                        boxShadow: isDragActive ? `0 0 32px ${hexAlpha(ACCENT, 0.5)}` : 'none',
                        transition: `all ${motion.duration.md} ${motion.snap}`,
                    }}
                >
                    <UploadIcon sx={{ fontSize: 36 }} />
                </Box>

                {/* Big title */}
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: { xs: '1.6rem', md: '2.2rem' },
                        fontWeight: 700,
                        textAlign: 'center',
                        color: isDragActive ? ACCENT : palette.paper,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    {isDragActive ? (
                        <>
                            Suelta acá
                            <br />↓
                        </>
                    ) : (
                        <>
                            Arrastra
                            <br />o haz click.
                        </>
                    )}
                </Typography>

                {!isDragActive && (
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.92rem',
                            color: palette.paperFaint,
                            textAlign: 'center',
                            mb: 3,
                        }}
                    >
                        Selecciona archivos PDF, Excel, XML o imágenes escaneadas para iniciar el
                        pipeline contable.
                    </Typography>
                )}

                {/* Format chips */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        mt: 2,
                    }}
                >
                    {[
                        { label: 'PDF', accent: palette.error },
                        { label: 'XLSX', accent: palette.success },
                        { label: 'XML', accent: palette.accent },
                        { label: 'JPG', accent: palette.amber },
                        { label: 'PNG', accent: palette.chartreuse },
                    ].map((fmt) => (
                        <Box
                            key={fmt.label}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.6,
                                px: 1.25,
                                py: 0.4,
                                border: `1px solid ${hexAlpha(fmt.accent, 0.4)}`,
                                bgcolor: hexAlpha(fmt.accent, 0.08),
                                borderRadius: 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 4,
                                    height: 4,
                                    bgcolor: fmt.accent,
                                    boxShadow: `0 0 4px ${fmt.accent}`,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: fmt.accent,
                                    letterSpacing: '0.18em',
                                }}
                            >
                                {fmt.label}
                                <Box
                                    component="span"
                                    sx={{ ml: 0.5, color: palette.paperGhost, fontWeight: 400 }}
                                >
                                    <FileIcon sx={{ fontSize: 9, verticalAlign: 'middle' }} />
                                </Box>
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {fileRejections.length > 0 && (
                <Box
                    sx={{
                        mt: 1.5,
                        p: 1.25,
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        borderRadius: 0.5,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ ...sxLabelSmall, color: palette.error }}>
                        {'// ERROR'}
                    </Typography>
                    <Typography
                        sx={{ fontFamily: fonts.body, fontSize: '0.82rem', color: palette.paper }}
                    >
                        {fileRejections[0].errors[0].message}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
