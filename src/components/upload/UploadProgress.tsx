'use client';

import { Box, LinearProgress, Typography, IconButton, CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import {
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Code as XmlIcon,
    Image as ImageIcon,
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import BrutalistParsingSelector from '@/components/upload/BrutalistParsingSelector';
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
    onSetParserMode?: (id: string, mode: string) => void;
    onSetMode?: (fileId: string, mode: 'pages' | 'documents') => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    expandedContent?: React.ReactNode;
}

export function UploadProgressItem({
    fileState,
    onRemove,
    onSetParserMode,
    onSetMode,
    isExpanded,
    onToggleExpand,
    expandedContent,
}: UploadProgressProps) {
    const [fileListOpen, setFileListOpen] = useState(false);
    const { file, status, progress, error } = fileState;
    // Auto-open file list when extraction starts so per-file progress is visible
    const prevStatusRef = React.useRef(status);
    React.useEffect(() => {
        if (status === 'extracting' && prevStatusRef.current !== 'extracting') {
            setFileListOpen(true);
        }
        prevStatusRef.current = status;
    }, [status]);
    const files = fileState.files ?? [file];
    const isMulti = files.length > 1;
    const displayName = isMulti ? files[0].name : file.name;
    const displaySize = files.reduce((sum, current) => sum + current.size, 0);
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
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: palette.paper,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                }}
                            >
                                {displayName}
                            </Typography>
                            {isMulti && (
                                <Box
                                    component="span"
                                    onClick={() => setFileListOpen((v) => !v)}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        color: palette.accent,
                                        bgcolor: hexAlpha(palette.accent, 0.12),
                                        border: `1px solid ${hexAlpha(palette.accent, 0.3)}`,
                                        borderRadius: '999px',
                                        px: '6px',
                                        py: '1px',
                                        lineHeight: 1.4,
                                        letterSpacing: '0.05em',
                                        userSelect: 'none',
                                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                                        '&:hover': {
                                            bgcolor: hexAlpha(palette.accent, 0.22),
                                        },
                                    }}
                                >
                                    {`+${files.length - 1} ${fileListOpen ? '▴' : '▾'}`}
                                </Box>
                            )}
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: palette.paperGhost,
                                letterSpacing: '0.1em',
                                flexShrink: 0,
                            }}
                        >
                            {formatFileSize(displaySize).toUpperCase()}
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

                    {/* Collapsible file list for multi-file uploads */}
                    {isMulti && fileListOpen && (
                        <Box
                            sx={{
                                mt: 0.75,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.25,
                            }}
                        >
                            {files.map((f, i) => {
                                const effectiveIdx = fileState.current_file_index ?? null;
                                const isExtracting = status === 'extracting';
                                const isCurrent =
                                    isExtracting && effectiveIdx !== null && i === effectiveIdx;
                                const isDone_ =
                                    isExtracting && effectiveIdx !== null && i < effectiveIdx;
                                return (
                                    <Box
                                        key={i}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                        {isCurrent ? (
                                            <CircularProgress
                                                size={10}
                                                sx={{ color: palette.accent, flexShrink: 0 }}
                                            />
                                        ) : isDone_ ? (
                                            <Typography
                                                component="span"
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.7rem',
                                                    color: palette.success,
                                                    lineHeight: 1,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                ✓
                                            </Typography>
                                        ) : (
                                            <Typography
                                                component="span"
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.7rem',
                                                    color: palette.paperGhost,
                                                    lineHeight: 1,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                •
                                            </Typography>
                                        )}
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.7rem',
                                                lineHeight: 1.4,
                                                color: palette.paperGhost,
                                            }}
                                        >
                                            {f.name}
                                        </Typography>
                                    </Box>
                                );
                            })}

                            {/* Mode toggle — only when idle */}
                            {status === 'idle' && onSetMode && (
                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
                                    {(['pages', 'documents'] as const).map((mode) => {
                                        const label = mode === 'pages' ? 'Páginas' : 'Documentos';
                                        const isActive =
                                            (fileState.multi_file_mode ?? 'pages') === mode;
                                        return (
                                            <Box
                                                key={mode}
                                                component="button"
                                                role="button"
                                                aria-label={label}
                                                onClick={() => onSetMode(fileState.id, mode)}
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.62rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.08em',
                                                    border: `1px solid ${hexAlpha(palette.accent, isActive ? 0.6 : 0.25)}`,
                                                    borderRadius: '999px',
                                                    px: '8px',
                                                    py: '2px',
                                                    cursor: 'pointer',
                                                    color: isActive
                                                        ? palette.accent
                                                        : palette.paperGhost,
                                                    bgcolor: isActive
                                                        ? hexAlpha(palette.accent, 0.15)
                                                        : 'transparent',
                                                    transition: `all ${motion.duration.sm} ${motion.snap}`,
                                                    '&:hover': {
                                                        bgcolor: hexAlpha(palette.accent, 0.1),
                                                    },
                                                }}
                                            >
                                                {label}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {onToggleExpand && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand();
                        }}
                        sx={{
                            color: isExpanded ? palette.paper : palette.paperGhost,
                            flexShrink: 0,
                            transition: `all ${motion.duration.sm} ${motion.snap}`,
                            '&:hover': {
                                color: palette.paper,
                                bgcolor: hexAlpha(palette.paper, 0.08),
                            },
                        }}
                    >
                        {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                        ) : (
                            <ExpandMoreIcon fontSize="small" />
                        )}
                    </IconButton>
                )}
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

            {/* Per-file parsing mode selector — only when idle */}
            {status === 'idle' && onSetParserMode && (
                <Box sx={{ mt: 1.25 }}>
                    <BrutalistParsingSelector
                        value={fileState.parser_mode || 'fast'}
                        onChange={(mode) => onSetParserMode(fileState.id, mode)}
                    />
                </Box>
            )}

            {/* Inline audit panel — expands below the file row */}
            {isExpanded && expandedContent && (
                <Box
                    sx={{
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: `1px solid ${hexAlpha(statusColor, 0.2)}`,
                    }}
                >
                    {expandedContent}
                </Box>
            )}
        </Box>
    );
}

interface UploadProgressListProps {
    files: FileUploadState[];
    onRemove: (id: string) => void;
    onSetParserMode?: (id: string, mode: string) => void;
    onSetMode?: (fileId: string, mode: 'pages' | 'documents') => void;
    expandedId?: string | null;
    onToggleExpand?: (id: string) => void;
    renderExpanded?: (fileState: FileUploadState) => React.ReactNode;
}

export default function UploadProgress({
    files,
    onRemove,
    onSetParserMode,
    onSetMode,
    expandedId,
    onToggleExpand,
    renderExpanded,
}: UploadProgressListProps) {
    if (files.length === 0) return null;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {files.map((fs) => (
                <UploadProgressItem
                    key={fs.id}
                    fileState={fs}
                    onRemove={onRemove}
                    onSetParserMode={onSetParserMode}
                    onSetMode={onSetMode}
                    isExpanded={expandedId === fs.id}
                    onToggleExpand={
                        onToggleExpand && renderExpanded?.(fs)
                            ? () => onToggleExpand(fs.id)
                            : undefined
                    }
                    expandedContent={renderExpanded?.(fs)}
                />
            ))}
        </Box>
    );
}
