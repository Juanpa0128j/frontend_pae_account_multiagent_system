'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper } from '@mui/material';
import {
    CloudUpload as UploadIcon,
    InsertDriveFile as FileIcon,
} from '@mui/icons-material';

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
};

export default function DropZone({ onFilesAccepted, disabled = false }: DropZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) onFilesAccepted(acceptedFiles);
        },
        [onFilesAccepted]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        disabled,
        maxSize: 20 * 1024 * 1024, // 20MB
    });

    const borderColor = isDragReject
        ? 'error.main'
        : isDragActive
            ? 'primary.main'
            : 'rgba(255,255,255,0.1)';

    const bgColor = isDragReject
        ? 'rgba(239,68,68,0.05)'
        : isDragActive
            ? 'rgba(99,102,241,0.08)'
            : 'rgba(99,102,241,0.02)';

    return (
        <Box>
            <Paper
                elevation={0}
                {...getRootProps()}
                sx={{
                    p: 5,
                    textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: `2px dashed`,
                    borderColor,
                    borderRadius: 3,
                    bgcolor: bgColor,
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1,
                    '&:hover': !disabled
                        ? {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(99,102,241,0.06)',
                            boxShadow: '0 0 0 4px rgba(99,102,241,0.08)',
                        }
                        : {},
                }}
            >
                <input {...getInputProps()} />

                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: isDragActive ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        transition: 'all 0.2s ease',
                        boxShadow: isDragActive ? '0 0 24px rgba(99,102,241,0.3)' : 'none',
                    }}
                >
                    <UploadIcon
                        sx={{
                            fontSize: 32,
                            color: isDragActive ? 'primary.main' : 'primary.dark',
                            transition: 'all 0.2s ease',
                            transform: isDragActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                        }}
                    />
                </Box>

                {isDragActive ? (
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                        Suelta los archivos aquí
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                            Arrastra documentos aquí
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            o haz clic para seleccionar archivos
                        </Typography>
                    </>
                )}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {['PDF', 'Excel (.xls/.xlsx)', 'XML'].map((type) => (
                        <Box
                            key={type}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.25,
                                py: 0.4,
                                borderRadius: 1,
                                bgcolor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <FileIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">
                                {type}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 1.5 }}>
                    Máximo 20 MB por archivo
                </Typography>
            </Paper>

            {fileRejections.length > 0 && (
                <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                    {fileRejections[0].errors[0].message}
                </Typography>
            )}
        </Box>
    );
}
