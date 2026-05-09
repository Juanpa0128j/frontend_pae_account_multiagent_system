'use client';

import { Box, LinearProgress, Typography, IconButton } from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Code as XmlIcon,
    Image as ImageIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { FileUploadState } from '@/types';
import { formatFileSize } from '@/lib/formatters';
import { palette, fonts, motion, hexAlpha } from '@/styles/brutalist';

const FILE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
    'application/pdf': { icon: <PdfIcon sx={{ fontSize: 18 }} />, color: palette.error },
    'application/vnd.ms-excel': {
        icon: <ExcelIcon sx={{ fontSize: 18 }} />,
        color: palette.success,
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        icon: <ExcelIcon sx={{ fontSize: 18 }} />,
        color: palette.success,
    },
    'text/xml': { icon: <XmlIcon sx={{ fontSize: 18 }} />, color: palette.accent },
    'application/xml': { icon: <XmlIcon sx={{ fontSize: 18 }} />, color: palette.accent },
    'image/jpeg': { icon: <ImageIcon sx={{ fontSize: 18 }} />, color: palette.amber },
    'image/png': { icon: <ImageIcon sx={{ fontSize: 18 }} />, color: palette.chartreuse },
};

const STATUS_LABELS: Record<FileUploadState['status'], string> = {
    idle: 'EN COLA',
    uploading: 'SUBIENDO',
    processing: 'CONTABILIZANDO',
    extracting: 'EXTRAYENDO',
    review: 'REVISION',
    done: 'COMPLETADO',
    error: 'ERROR',
};

const STATUS_COLORS: Record<FileUploadState['status'], string> = {
    idle: palette.paperFaint,
    uploading: palette.accent,
    processing: palette.accent,
    extracting: palette.accent,
    review: palette.amber,
    done: palette.success,
    error: palette.error,
};

interface UploadProgressProps {
    fileState: FileUploadState;
    onRemove: (id: string) => void;
}

export function UploadProgressItem({ fileState, onRemove }: UploadProgressProps) {
    const { file, status, progress, error } = fileState;
    const fileMeta = FILE_ICON[file.type] ?? {
        icon: <PdfIcon sx={{ fontSize: 18 }} />,
        color: palette.paperFaint,
    };
    const hasWarnings = Boolean(fileState.has_warnings) && status === 'done';
    const statusColor = hasWarnings ? palette.amber : STATUS_COLORS[status];
    const isActive = ['uploading', 'processing', 'extracting'].includes(status);
    const isDone = status === 'done';
    const isError = status === 'error';
    const statusLabel = hasWarnings ? 'REVISIÓN PENDIENTE' : STATUS_LABELS[status];
    const helperText = isError
        ? error
        : hasWarnings
          ? fileState.remediation ||
            'El auditor detectó observaciones. Revisa el trace del proceso.'
          : undefined;

    return (
        <Box
            sx={{
                position: 'relative',
                p: 1.75,
                border: `1px solid ${hexAlpha(statusColor, isDone || isError ? 0.35 : 0.15)}`,
                borderRadius: 1,
                bgcolor: hexAlpha(statusColor, 0.04),
                transition: `all ${motion.duration.sm} ${motion.snap}`,
                overflow: 'hidden',
                '&:hover': { borderColor: hexAlpha(statusColor, 0.5) },
            }}
        >
            {/* Active progress bar — top */}
            {isActive && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 2,
                            bgcolor: 'transparent',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: statusColor,
                                boxShadow: `0 0 8px ${statusColor}`,
                            },
                        }}
                    />
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* File type icon */}
                <Box
                    sx={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        bgcolor: hexAlpha(fileMeta.color, 0.12),
                        color: fileMeta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 0.5,
                        border: `1px solid ${hexAlpha(fileMeta.color, 0.3)}`,
                    }}
                >
                    {fileMeta.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* File name + size */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.4 }}>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: palette.paper,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {file.name}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: palette.paperGhost,
                                letterSpacing: '0.1em',
                                flexShrink: 0,
                            }}
                        >
                            {formatFileSize(file.size).toUpperCase()}
                        </Typography>
                    </Box>

                    {/* Status row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                            sx={{
                                width: 5,
                                height: 5,
                                bgcolor: statusColor,
                                borderRadius: '50%',
                                boxShadow: `0 0 4px ${statusColor}`,
                                animation: isActive ? `${'pulse'} 1.5s infinite` : 'none',
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.4 },
                                },
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: statusColor,
                                letterSpacing: '0.18em',
                            }}
                        >
                            {statusLabel}
                        </Typography>
                        {isActive && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.62rem',
                                    color: palette.paperFaint,
                                    letterSpacing: '0.1em',
                                    ml: 'auto',
                                }}
                            >
                                {progress}%
                            </Typography>
                        )}
                        {helperText && (
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.72rem',
                                    color: isError ? palette.error : palette.amber,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                    flex: 1,
                                }}
                                title={helperText}
                            >
                                · {helperText}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {(status === 'idle' || isDone || isError) && (
                    <IconButton
                        size="small"
                        onClick={() => onRemove(fileState.id)}
                        sx={{
                            color: palette.paperGhost,
                            flexShrink: 0,
                            transition: `all ${motion.duration.sm} ${motion.snap}`,
                            '&:hover': {
                                color: palette.error,
                                bgcolor: hexAlpha(palette.error, 0.08),
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

interface UploadProgressListProps {
    files: FileUploadState[];
    onRemove: (id: string) => void;
}

export default function UploadProgress({ files, onRemove }: UploadProgressListProps) {
    if (files.length === 0) return null;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {files.map((fs) => (
                <UploadProgressItem key={fs.id} fileState={fs} onRemove={onRemove} />
            ))}
        </Box>
    );
}
