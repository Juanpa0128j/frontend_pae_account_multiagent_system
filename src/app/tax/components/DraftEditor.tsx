'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Chip,
    Alert,
    Tooltip,
    Skeleton,
} from '@mui/material';
import {
    Close,
    Edit,
    Check,
    Warning,
    Error as ErrorIcon,
    CheckCircle,
    Save,
    Download,
} from '@mui/icons-material';
import { useUpdateDraftField, useDeclarationDraft } from '@/hooks/useTax';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import { exportDeclarationDraft } from '@/lib/api';
import type { TaxDeclarationDraft, DraftField } from '@/lib/api';
import { downloadBlob } from '@/lib/downloadFile';

interface DraftEditorProps {
    draftId: string;
    draft?: TaxDeclarationDraft | null;
    isLoading: boolean;
    onClose: () => void;
}

function getFieldStatus(field: DraftField): {
    icon: React.ReactElement;
    color: string;
    label: string;
} {
    if (field.requires_review) {
        return {
            icon: <ErrorIcon sx={{ fontSize: 16 }} />,
            color: palette.error,
            label: 'Revisar',
        };
    }
    if (field.confidence === 'low') {
        return {
            icon: <Warning sx={{ fontSize: 16 }} />,
            color: palette.amber,
            label: 'Verificar',
        };
    }
    return {
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
        color: palette.success,
        label: 'Confiable',
    };
}

function formatFieldValue(value: number | string): string {
    if (typeof value === 'number') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    }
    return value;
}

function formatFormType(formType: string): string {
    const mapping: Record<string, string> = {
        F300: 'Formulario 300 - IVA',
        F350: 'Formulario 350 - Retefuente',
        F110: 'Formulario 110 - Renta',
        ICA: 'Declaración ICA',
        F260: 'Formulario 260 - SIMPLE',
    };
    return mapping[formType] || formType;
}

export default function DraftEditor({ draftId, draft, isLoading, onClose }: DraftEditorProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const updateField = useUpdateDraftField(draftId);
    const { refetch } = useDeclarationDraft(draftId);

    const handleEditStart = useCallback((field: DraftField) => {
        setEditingField(field.renglon);
        setEditValue(String(field.value));
    }, []);

    const handleEditSave = useCallback(async () => {
        if (!editingField) return;

        try {
            await updateField.mutateAsync({
                renglon: editingField,
                value: parseFloat(editValue.replace(/[^0-9.-]+/g, '')) || 0,
            });
            setEditingField(null);
            refetch();
        } catch (error) {
            console.error('Error updating field:', error);
        }
    }, [editingField, editValue, updateField, refetch]);

    const handleEditCancel = useCallback(() => {
        setEditingField(null);
        setEditValue('');
    }, []);

    const handleExport = useCallback(() => {
        if (!draft) return;

        const { filename, content, mimeType } = exportDeclarationDraft(draft);
        downloadBlob(new Blob([content], { type: mimeType }), filename);
    }, [draft]);

    const fieldsRequiringReview = draft?.fields.filter((f) => f.requires_review).length || 0;
    const totalFields = draft?.fields.length || 0;

    if (isLoading || !draft) {
        return (
            <Box>
                <Skeleton
                    variant="rectangular"
                    height={60}
                    sx={{ mb: 2, bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
                <Skeleton
                    variant="rectangular"
                    height={400}
                    sx={{ bgcolor: hexAlpha(palette.paper, 0.05) }}
                />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 3,
                    pb: 2,
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                <Box>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: palette.paper,
                            mb: 0.5,
                        }}
                    >
                        {formatFormType(draft.form_type)}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            color: palette.paperMuted,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {draft.period_start} → {draft.period_end} | ID: {draft.draft_id.slice(0, 8)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={handleExport}
                        disabled={fieldsRequiringReview > 0}
                        sx={{
                            borderColor: palette.line,
                            color: palette.paper,
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            '&:hover': {
                                borderColor: palette.accent,
                                color: palette.accent,
                            },
                            '&.Mui-disabled': {
                                borderColor: palette.paperMuted,
                                color: palette.paperMuted,
                            },
                        }}
                    >
                        Exportar
                    </Button>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: palette.paperMuted,
                            '&:hover': { color: palette.error },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>
            </Box>

            {/* Progress indicator */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor:
                        fieldsRequiringReview > 0
                            ? hexAlpha(palette.error, 0.05)
                            : hexAlpha(palette.success, 0.05),
                    border: `1px solid ${fieldsRequiringReview > 0 ? palette.error : palette.success}`,
                    borderRadius: 1,
                }}
            >
                {fieldsRequiringReview > 0 ? (
                    <ErrorIcon sx={{ color: palette.error }} />
                ) : (
                    <CheckCircle sx={{ color: palette.success }} />
                )}
                <Box sx={{ flex: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.display,
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: fieldsRequiringReview > 0 ? palette.error : palette.success,
                        }}
                    >
                        {fieldsRequiringReview > 0
                            ? `${fieldsRequiringReview} campos requieren revisión`
                            : 'Todos los campos han sido revisados'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: palette.paperMuted }}>
                        {totalFields - fieldsRequiringReview} de {totalFields} campos verificados
                    </Typography>
                </Box>
            </Box>

            {/* Warnings */}
            {draft.warnings && draft.warnings.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    {draft.warnings.map((warning, idx) => (
                        <Alert
                            key={idx}
                            severity="warning"
                            sx={{
                                mb: 1,
                                bgcolor: hexAlpha(palette.amber, 0.1),
                                color: palette.amber,
                                border: `1px solid ${palette.amber}`,
                                '& .MuiAlert-icon': { color: palette.amber },
                            }}
                        >
                            <Typography sx={{ fontSize: '0.85rem' }}>
                                <strong>Renglón {warning.field}:</strong> {warning.message}
                            </Typography>
                        </Alert>
                    ))}
                </Box>
            )}

            {/* Fields list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {draft.fields
                    ?.filter((field) => field.renglon !== '_disclaimer')
                    .map((field) => {
                        const status = getFieldStatus(field);
                        const isEditing = editingField === field.renglon;

                        return (
                            <Box
                                key={field.renglon}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    flexWrap: 'wrap',
                                    p: 2,
                                    border: `1px solid ${isEditing ? palette.accent : palette.line}`,
                                    borderRadius: 1,
                                    bgcolor: isEditing
                                        ? hexAlpha(palette.accent, 0.05)
                                        : 'transparent',
                                    transition: `all ${motion.duration.md} ${motion.snap}`,
                                    '&:hover': {
                                        borderColor: field.requires_review
                                            ? palette.error
                                            : palette.accent,
                                    },
                                }}
                            >
                                {/* Renglon number */}
                                <Box
                                    sx={{
                                        minWidth: 50,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.7rem',
                                            color: palette.paperMuted,
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        {'// RENGLÓN'}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            color: palette.paper,
                                        }}
                                    >
                                        {field.renglon}
                                    </Typography>
                                </Box>

                                {/* Field info */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        sx={{
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: palette.paper,
                                            mb: 0.5,
                                        }}
                                    >
                                        {field.label}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.7rem',
                                            color: palette.paperMuted,
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Fuente: {field.source} | Confianza: {field.confidence}
                                    </Typography>
                                </Box>

                                {/* Value */}
                                <Box sx={{ minWidth: 180, textAlign: 'right' }}>
                                    {isEditing ? (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                size="small"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        bgcolor: palette.ink,
                                                        color: palette.paper,
                                                        fontFamily: fonts.mono,
                                                    },
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={handleEditSave}
                                                sx={{ color: palette.success }}
                                            >
                                                <Check />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={handleEditCancel}
                                                sx={{ color: palette.error }}
                                            >
                                                <Close />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                color: palette.paper,
                                            }}
                                        >
                                            {formatFieldValue(field.value)}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Status */}
                                <Chip
                                    icon={status.icon}
                                    label={status.label}
                                    size="small"
                                    sx={{
                                        bgcolor: hexAlpha(status.color, 0.1),
                                        color: status.color,
                                        border: `1px solid ${status.color}`,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        minWidth: 90,
                                    }}
                                />

                                {/* Edit button */}
                                {!isEditing && (
                                    <Tooltip title="Editar valor">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditStart(field)}
                                            sx={{
                                                color: palette.paperMuted,
                                                '&:hover': { color: palette.accent },
                                            }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        );
                    })}
            </Box>

            {/* Footer actions */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 4,
                    pt: 3,
                    borderTop: `1px solid ${palette.line}`,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        borderColor: palette.line,
                        color: palette.paper,
                        fontFamily: fonts.mono,
                        '&:hover': {
                            borderColor: palette.error,
                            color: palette.error,
                        },
                    }}
                >
                    Cerrar
                </Button>
                <Tooltip title="La acción para marcar el borrador como revisado aún no está disponible.">
                    <span>
                        <Button
                            variant="contained"
                            disabled
                            startIcon={<Save />}
                            sx={{
                                bgcolor: palette.line,
                                color: palette.paperMuted,
                                fontFamily: fonts.mono,
                                '&:hover': {
                                    bgcolor: palette.line,
                                },
                                '&:disabled': {
                                    bgcolor: palette.line,
                                    color: palette.paperMuted,
                                },
                            }}
                        >
                            Marcar como revisado
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
