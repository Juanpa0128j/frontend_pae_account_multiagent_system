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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    RateReview,
    TaskAlt,
    LockOpen,
    Gavel,
} from '@mui/icons-material';
import {
    useUpdateDraftField,
    useDeclarationDraft,
    useReviewDraft,
    useFileDraft,
    useReopenDraft,
} from '@/hooks/useTax';
import { palette, fonts, motion, hexAlpha } from '@/styles/brutalist';
import { taxApiClient } from '@/lib/api/clients';
import type { TaxDeclarationDraft, DraftField } from '@/types';
import { AjustesFiscalesPanel } from './AjustesFiscalesPanel';
import { downloadBlob } from '@/lib/downloadFile';
import axios from 'axios';

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
        F2516: 'F2516 - Conciliación Fiscal',
    };
    return mapping[formType] || formType;
}

function formatDateEsCO(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateStr));
}

function extractApiErrorCode(error: unknown): {
    code: string | null;
    message: string;
    count?: number;
} {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (detail && typeof detail === 'object') {
            return {
                code: detail.error_code ?? null,
                message: detail.message ?? error.message,
                count: detail.count,
            };
        }
    }
    return { code: null, message: 'Error inesperado. Intente de nuevo.' };
}

function StatusBadge({ status }: { status: TaxDeclarationDraft['status'] }) {
    const config = {
        draft: { label: '// BORRADOR', color: palette.amber },
        reviewed: { label: '// REVISADO', color: palette.success },
        filed: { label: '// PRESENTADO', color: palette.accent },
    } as const;

    const { label, color } = config[status];

    return (
        <Chip
            label={label}
            size="small"
            sx={{
                bgcolor: hexAlpha(color, 0.12),
                color,
                border: `1px solid ${hexAlpha(color, 0.5)}`,
                fontFamily: fonts.mono,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                height: 22,
            }}
        />
    );
}

export default function DraftEditor({ draftId, draft, isLoading, onClose }: DraftEditorProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [actionError, setActionError] = useState<string | null>(null);

    // File modal state
    const [fileModalOpen, setFileModalOpen] = useState(false);
    const [dianAcknowledgment, setDianAcknowledgment] = useState('');

    // Reopen modal state
    const [reopenModalOpen, setReopenModalOpen] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [reopenReasonError, setReopenReasonError] = useState<string | null>(null);

    const updateField = useUpdateDraftField(draftId);
    const { refetch } = useDeclarationDraft(draftId);
    const reviewMutation = useReviewDraft();
    const fileMutation = useFileDraft();
    const reopenMutation = useReopenDraft();

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
            const { code, message } = extractApiErrorCode(error);
            if (code === 'DRAFT_LOCKED') {
                setActionError('El borrador está bloqueado. Reábralo para editar.');
            } else {
                setActionError(message);
            }
        }
    }, [editingField, editValue, updateField, refetch]);

    const handleEditCancel = useCallback(() => {
        setEditingField(null);
        setEditValue('');
    }, []);

    const handleExport = useCallback(() => {
        if (!draft) return;

        const { filename, content, mimeType } = taxApiClient.exportDeclarationDraft(draft);
        downloadBlob(new Blob([content], { type: mimeType }), filename);
    }, [draft]);

    const handleReview = useCallback(async () => {
        setActionError(null);
        try {
            await reviewMutation.mutateAsync(draftId);
        } catch (error) {
            const { code, message, count } = extractApiErrorCode(error);
            if (code === 'FIELDS_PENDING_REVIEW' && count !== undefined) {
                setActionError(`Hay ${count} campos pendientes de revisión.`);
            } else {
                setActionError(message);
            }
        }
    }, [draftId, reviewMutation]);

    const handleFileSubmit = useCallback(async () => {
        setActionError(null);
        try {
            await fileMutation.mutateAsync({
                draftId,
                dian_acknowledgment: dianAcknowledgment.trim() || undefined,
            });
            setFileModalOpen(false);
            setDianAcknowledgment('');
        } catch (error) {
            const { message } = extractApiErrorCode(error);
            setActionError(message);
            setFileModalOpen(false);
        }
    }, [draftId, dianAcknowledgment, fileMutation]);

    const handleReopenSubmit = useCallback(async () => {
        if (reopenReason.trim().length < 5) {
            setReopenReasonError('El motivo debe tener al menos 5 caracteres.');
            return;
        }
        setReopenReasonError(null);
        setActionError(null);
        try {
            await reopenMutation.mutateAsync({ draftId, reason: reopenReason.trim() });
            setReopenModalOpen(false);
            setReopenReason('');
        } catch (error) {
            const { message } = extractApiErrorCode(error);
            setActionError(message);
            setReopenModalOpen(false);
        }
    }, [draftId, reopenReason, reopenMutation]);

    const fieldsRequiringReview = draft?.fields.filter((f) => f.requires_review).length || 0;
    const totalFields = draft?.fields.length || 0;
    const status = draft?.status ?? 'draft';
    const canEdit = status === 'draft';

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
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 3,
                    pb: 2,
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: palette.paper,
                            }}
                        >
                            {formatFormType(draft.form_type)}
                        </Typography>
                        <StatusBadge status={status} />
                    </Box>
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
                    {(status === 'reviewed' || status === 'filed') && draft.reviewed_at && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                color: hexAlpha(palette.success, 0.8),
                                letterSpacing: '0.04em',
                                mt: 0.5,
                            }}
                        >
                            Revisado: {formatDateEsCO(draft.reviewed_at)}
                            {draft.reviewed_by ? ` — ${draft.reviewed_by}` : ''}
                        </Typography>
                    )}
                    {status === 'filed' && draft.filed_at && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                color: hexAlpha(palette.accent, 0.8),
                                letterSpacing: '0.04em',
                                mt: 0.25,
                            }}
                        >
                            Presentado: {formatDateEsCO(draft.filed_at)}
                            {draft.filed_by ? ` — ${draft.filed_by}` : ''}
                        </Typography>
                    )}
                    {status === 'filed' && draft.dian_acknowledgment && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                                color: hexAlpha(palette.accent, 0.8),
                                letterSpacing: '0.04em',
                                mt: 0.25,
                            }}
                        >
                            Radicado MUISCA: {draft.dian_acknowledgment}
                        </Typography>
                    )}
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

            {/* Action error alert */}
            {actionError && (
                <Alert
                    severity="error"
                    onClose={() => setActionError(null)}
                    sx={{
                        mb: 2,
                        bgcolor: hexAlpha(palette.error, 0.1),
                        color: palette.error,
                        border: `1px solid ${palette.error}`,
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                >
                    {actionError}
                </Alert>
            )}

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
                        const fieldStatus = getFieldStatus(field);
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
                                    <Tooltip
                                        title={field.help_text ?? ''}
                                        placement="right"
                                        disableHoverListener={!field.help_text}
                                        disableFocusListener={!field.help_text}
                                        disableTouchListener={!field.help_text}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: palette.paper,
                                                mb: 0.5,
                                                cursor: field.help_text ? 'help' : 'inherit',
                                            }}
                                        >
                                            {field.label}
                                        </Typography>
                                    </Tooltip>
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

                                {/* F2516 source badge */}
                                {field.source === 'f2516' && (
                                    <Chip
                                        label="// VIA F2516"
                                        size="small"
                                        sx={{
                                            bgcolor: hexAlpha(palette.accent, 0.12),
                                            color: palette.accent,
                                            border: `1px solid ${hexAlpha(palette.accent, 0.4)}`,
                                            fontFamily: fonts.mono,
                                            fontSize: '0.6rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.12em',
                                            height: 20,
                                        }}
                                    />
                                )}

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
                                    icon={fieldStatus.icon}
                                    label={fieldStatus.label}
                                    size="small"
                                    sx={{
                                        bgcolor: hexAlpha(fieldStatus.color, 0.1),
                                        color: fieldStatus.color,
                                        border: `1px solid ${fieldStatus.color}`,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        minWidth: 90,
                                    }}
                                />

                                {/* Edit button — only in draft status */}
                                {!isEditing && canEdit && (
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

            {/* AjustesFiscalesPanel — only for F2516 */}
            {draft.form_type === 'F2516' && (
                <AjustesFiscalesPanel
                    companyNit={draft.company_nit}
                    year={new Date(draft.period_start).getFullYear()}
                />
            )}

            {/* Footer actions */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 4,
                    pt: 3,
                    borderTop: `1px solid ${palette.line}`,
                    flexWrap: 'wrap',
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

                {/* draft status actions */}
                {status === 'draft' && (
                    <Tooltip
                        title={
                            fieldsRequiringReview > 0
                                ? `Resuelva los ${fieldsRequiringReview} campos pendientes primero`
                                : ''
                        }
                    >
                        <span>
                            <Button
                                variant="contained"
                                disabled={fieldsRequiringReview > 0 || reviewMutation.isPending}
                                startIcon={<RateReview />}
                                onClick={handleReview}
                                sx={{
                                    bgcolor: palette.accent,
                                    color: palette.paper,
                                    fontFamily: fonts.mono,
                                    fontSize: '0.8rem',
                                    transition: `all ${motion.duration.md} ${motion.snap}`,
                                    '&:hover': {
                                        bgcolor: hexAlpha(palette.accent, 0.8),
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: palette.line,
                                        color: palette.paperMuted,
                                    },
                                }}
                            >
                                {reviewMutation.isPending
                                    ? 'Procesando...'
                                    : 'Marcar como revisado'}
                            </Button>
                        </span>
                    </Tooltip>
                )}

                {/* reviewed status actions */}
                {status === 'reviewed' && (
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<LockOpen />}
                            onClick={() => setReopenModalOpen(true)}
                            sx={{
                                borderColor: palette.amber,
                                color: palette.amber,
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                transition: `all ${motion.duration.md} ${motion.snap}`,
                                '&:hover': {
                                    borderColor: hexAlpha(palette.amber, 0.6),
                                    bgcolor: hexAlpha(palette.amber, 0.06),
                                },
                            }}
                        >
                            Reabrir borrador
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<TaskAlt />}
                            onClick={() => setFileModalOpen(true)}
                            sx={{
                                bgcolor: palette.success,
                                color: palette.ink,
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                transition: `all ${motion.duration.md} ${motion.snap}`,
                                '&:hover': {
                                    bgcolor: hexAlpha(palette.success, 0.85),
                                },
                            }}
                        >
                            Marcar como presentada
                        </Button>
                    </>
                )}

                {/* filed status actions */}
                {status === 'filed' && (
                    <Button
                        variant="outlined"
                        startIcon={<LockOpen />}
                        onClick={() => setReopenModalOpen(true)}
                        sx={{
                            borderColor: palette.amber,
                            color: palette.amber,
                            fontFamily: fonts.mono,
                            fontSize: '0.8rem',
                            transition: `all ${motion.duration.md} ${motion.snap}`,
                            '&:hover': {
                                borderColor: hexAlpha(palette.amber, 0.6),
                                bgcolor: hexAlpha(palette.amber, 0.06),
                            },
                        }}
                    >
                        Reabrir presentación
                    </Button>
                )}
            </Box>

            {/* File modal */}
            <Dialog
                open={fileModalOpen}
                onClose={() => setFileModalOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: palette.ink,
                        border: `1px solid ${palette.lineStrong}`,
                        borderRadius: 2,
                        minWidth: 420,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: fonts.display,
                        fontWeight: 700,
                        color: palette.paper,
                        borderBottom: `1px solid ${palette.line}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Gavel sx={{ color: palette.success }} />
                    Presentar declaración
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            color: palette.paperMuted,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            mb: 0.5,
                        }}
                    >
                        {'// NÚMERO DE RADICADO MUISCA (OPCIONAL)'}
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Ej. 92000000000000"
                        value={dianAcknowledgment}
                        onChange={(e) => setDianAcknowledgment(e.target.value)}
                        size="small"
                        sx={{
                            '& .MuiInputBase-root': {
                                bgcolor: hexAlpha(palette.paper, 0.04),
                                color: palette.paper,
                                fontFamily: fonts.mono,
                                borderRadius: 1,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.line,
                            },
                            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.success,
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: palette.paperFaint,
                                opacity: 1,
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => setFileModalOpen(false)}
                        sx={{
                            borderColor: palette.line,
                            color: palette.paperMuted,
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFileSubmit}
                        disabled={fileMutation.isPending}
                        startIcon={<TaskAlt />}
                        sx={{
                            bgcolor: palette.success,
                            color: palette.ink,
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            '&:hover': { bgcolor: hexAlpha(palette.success, 0.85) },
                        }}
                    >
                        {fileMutation.isPending ? 'Presentando...' : 'Confirmar presentación'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reopen modal */}
            <Dialog
                open={reopenModalOpen}
                onClose={() => setReopenModalOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: palette.ink,
                        border: `1px solid ${palette.lineStrong}`,
                        borderRadius: 2,
                        minWidth: 420,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: fonts.display,
                        fontWeight: 700,
                        color: palette.paper,
                        borderBottom: `1px solid ${palette.line}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <LockOpen sx={{ color: palette.amber }} />
                    Reabrir borrador
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            color: palette.paperMuted,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            mb: 0.5,
                        }}
                    >
                        {'// MOTIVO DE REAPERTURA'}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describa el motivo para reabrir este borrador..."
                        value={reopenReason}
                        onChange={(e) => {
                            setReopenReason(e.target.value);
                            if (reopenReasonError) setReopenReasonError(null);
                        }}
                        error={!!reopenReasonError}
                        helperText={reopenReasonError ?? 'Mínimo 5 caracteres requeridos.'}
                        size="small"
                        sx={{
                            '& .MuiInputBase-root': {
                                bgcolor: hexAlpha(palette.paper, 0.04),
                                color: palette.paper,
                                fontFamily: fonts.mono,
                                borderRadius: 1,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.line,
                            },
                            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.amber,
                            },
                            '& .MuiFormHelperText-root': {
                                color: reopenReasonError ? palette.error : palette.paperMuted,
                                fontFamily: fonts.mono,
                                fontSize: '0.68rem',
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => setReopenModalOpen(false)}
                        sx={{
                            color: palette.paperMuted,
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleReopenSubmit}
                        disabled={reopenMutation.isPending}
                        startIcon={<LockOpen />}
                        sx={{
                            borderColor: palette.amber,
                            color: palette.amber,
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            '&:hover': {
                                borderColor: hexAlpha(palette.amber, 0.6),
                                bgcolor: hexAlpha(palette.amber, 0.06),
                            },
                        }}
                    >
                        {reopenMutation.isPending ? 'Reabriendo...' : 'Confirmar reapertura'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
