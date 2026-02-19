'use client';

import {
    Box,
    LinearProgress,
    Typography,
    IconButton,
    Chip,
    Paper,
} from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Code as XmlIcon,
    CheckCircle as DoneIcon,
    Error as ErrorIcon,
    Close as CloseIcon,
    HourglassEmpty as IdleIcon,
} from '@mui/icons-material';
import { FileUploadState } from '@/types';
import { formatFileSize } from '@/lib/formatters';

const FILE_ICON: Record<string, React.ReactNode> = {
    'application/pdf': <PdfIcon sx={{ fontSize: 20, color: '#EF4444' }} />,
    'application/vnd.ms-excel': <ExcelIcon sx={{ fontSize: 20, color: '#10B981' }} />,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (
        <ExcelIcon sx={{ fontSize: 20, color: '#10B981' }} />
    ),
    'text/xml': <XmlIcon sx={{ fontSize: 20, color: '#3B82F6' }} />,
    'application/xml': <XmlIcon sx={{ fontSize: 20, color: '#3B82F6' }} />,
};

const STATUS_LABELS: Record<FileUploadState['status'], string> = {
    idle: 'En espera',
    uploading: 'Subiendo…',
    processing: 'Procesando OCR…',
    extracting: 'Extrayendo datos…',
    done: 'Completado',
    error: 'Error',
};

interface UploadProgressProps {
    fileState: FileUploadState;
    onRemove: (id: string) => void;
}

export function UploadProgressItem({ fileState, onRemove }: UploadProgressProps) {
    const { file, status, progress, error } = fileState;
    const icon = FILE_ICON[file.type] || <PdfIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    const isDone = status === 'done';
    const isError = status === 'error';
    const isActive = ['uploading', 'processing', 'extracting'].includes(status);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : isDone ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 2,
                bgcolor: isError ? 'rgba(239,68,68,0.04)' : isDone ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flexShrink: 0 }}>{icon}</Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.primary"
                            noWrap
                            sx={{ maxWidth: '60%' }}
                        >
                            {file.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="caption" color="text.disabled">
                                {formatFileSize(file.size)}
                            </Typography>
                            <Chip
                                size="small"
                                label={STATUS_LABELS[status]}
                                sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 600,
                                    bgcolor: isError
                                        ? 'rgba(239,68,68,0.12)'
                                        : isDone
                                            ? 'rgba(16,185,129,0.12)'
                                            : 'rgba(99,102,241,0.12)',
                                    color: isError ? 'error.main' : isDone ? 'success.main' : 'primary.light',
                                }}
                            />
                        </Box>
                    </Box>

                    {isActive && (
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ borderRadius: 1, height: 4 }}
                        />
                    )}

                    {isDone && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <DoneIcon sx={{ fontSize: 12 }} /> Ingesta completada
                        </Typography>
                    )}

                    {isError && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <ErrorIcon sx={{ fontSize: 12 }} /> {error || 'Error desconocido'}
                        </Typography>
                    )}

                    {status === 'idle' && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <IdleIcon sx={{ fontSize: 12 }} /> En cola
                        </Typography>
                    )}
                </Box>

                {(status === 'idle' || isDone || isError) && (
                    <IconButton
                        size="small"
                        onClick={() => onRemove(fileState.id)}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' }, flexShrink: 0 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Paper>
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
