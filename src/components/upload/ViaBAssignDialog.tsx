'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    Chip,
} from '@mui/material';
import { InsertDriveFile as FileIcon } from '@mui/icons-material';
import { palette, fonts, hexAlpha } from '@/styles/brutalist';
import { guessDocType } from '@/hooks/useUpload';
import type { ViaBDocType } from '@/hooks/useUpload';

const DOC_TYPE_OPTIONS: { value: ViaBDocType; label: string }[] = [
    { value: 'balance_general', label: 'Balance General' },
    { value: 'estado_resultados', label: 'Estado de Resultados' },
    { value: 'libro_auxiliar', label: 'Libro Auxiliar' },
    { value: 'balance_general_anterior', label: 'Balance General anterior' },
];

const ACCENT: Record<ViaBDocType, string> = {
    balance_general: palette.accent,
    estado_resultados: palette.pink,
    libro_auxiliar: palette.amber,
    balance_general_anterior: palette.chartreuse,
};

interface PendingAssignment {
    file: File;
    docType: ViaBDocType | '';
}

interface ViaBAssignDialogProps {
    files: File[];
    onConfirm: (assignments: { file: File; docType: ViaBDocType }[]) => void;
    onClose: () => void;
}

export default function ViaBAssignDialog({ files, onConfirm, onClose }: ViaBAssignDialogProps) {
    const [assignments, setAssignments] = useState<PendingAssignment[]>(() =>
        files.map((file) => ({ file, docType: guessDocType(file.name) ?? '' }))
    );

    const setType = (index: number, docType: ViaBDocType | '') => {
        setAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, docType } : a)));
    };

    const usedTypes = assignments.map((a) => a.docType).filter(Boolean) as ViaBDocType[];
    const allAssigned = assignments.every((a) => a.docType !== '');
    const hasDuplicates = new Set(usedTypes).size < usedTypes.length;
    const canConfirm = allAssigned && !hasDuplicates;

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: palette.inkSoft,
                    border: `1px solid ${hexAlpha(palette.paper, 0.15)}`,
                    borderRadius: 0,
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    letterSpacing: '0.22em',
                    color: palette.accent,
                    textTransform: 'uppercase',
                    pb: 1,
                }}
            >
                {'// CONFIRMAR ASIGNACIÓN DE DOCUMENTOS'}
            </DialogTitle>

            <DialogContent>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.8rem',
                        color: hexAlpha(palette.paper, 0.6),
                        mb: 2.5,
                    }}
                >
                    Indica qué tipo de documento es cada archivo. El sistema pre-clasificó los que
                    pudo por nombre — verifica y corrige si es necesario.
                </Typography>

                <Stack spacing={1.5}>
                    {assignments.map((a, i) => {
                        const accent = a.docType ? ACCENT[a.docType] : hexAlpha(palette.paper, 0.3);
                        const dupeOf = a.docType
                            ? usedTypes.filter((t) => t === a.docType).length > 1
                            : false;
                        return (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    border: `1px solid ${dupeOf ? palette.pink : hexAlpha(palette.paper, 0.12)}`,
                                    bgcolor: hexAlpha(accent, 0.04),
                                }}
                            >
                                <FileIcon
                                    sx={{
                                        fontSize: 18,
                                        color: hexAlpha(palette.paper, 0.4),
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.7rem',
                                        color: hexAlpha(palette.paper, 0.75),
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title={a.file.name}
                                >
                                    {a.file.name}
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 220, flexShrink: 0 }}>
                                    <Select
                                        value={a.docType}
                                        onChange={(e) =>
                                            setType(i, e.target.value as ViaBDocType | '')
                                        }
                                        displayEmpty
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.72rem',
                                            color: a.docType
                                                ? accent
                                                : hexAlpha(palette.paper, 0.4),
                                            '.MuiOutlinedInput-notchedOutline': {
                                                borderColor: a.docType
                                                    ? hexAlpha(accent, 0.5)
                                                    : hexAlpha(palette.paper, 0.2),
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: accent,
                                            },
                                            bgcolor: hexAlpha(accent, 0.06),
                                        }}
                                        renderValue={(v) =>
                                            v
                                                ? DOC_TYPE_OPTIONS.find((o) => o.value === v)?.label
                                                : '— seleccionar tipo —'
                                        }
                                    >
                                        {DOC_TYPE_OPTIONS.map((opt) => (
                                            <MenuItem
                                                key={opt.value}
                                                value={opt.value}
                                                sx={{ fontFamily: fonts.mono, fontSize: '0.72rem' }}
                                            >
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        );
                    })}
                </Stack>

                {hasDuplicates && (
                    <Chip
                        label="Dos archivos tienen el mismo tipo — cada tipo debe ser único"
                        size="small"
                        sx={{
                            mt: 2,
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            bgcolor: hexAlpha(palette.pink, 0.15),
                            color: palette.pink,
                            border: `1px solid ${hexAlpha(palette.pink, 0.4)}`,
                            borderRadius: 0,
                        }}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        color: hexAlpha(palette.paper, 0.5),
                        '&:hover': { color: palette.paper },
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    disabled={!canConfirm}
                    onClick={() =>
                        onConfirm(
                            assignments.map((a) => ({
                                file: a.file,
                                docType: a.docType as ViaBDocType,
                            }))
                        )
                    }
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        bgcolor: canConfirm ? palette.accent : hexAlpha(palette.paper, 0.1),
                        color: canConfirm ? palette.ink : hexAlpha(palette.paper, 0.3),
                        borderRadius: 0,
                        '&:hover': { bgcolor: palette.accent, opacity: 0.9 },
                        '&.Mui-disabled': {
                            bgcolor: hexAlpha(palette.paper, 0.08),
                            color: hexAlpha(palette.paper, 0.25),
                        },
                    }}
                >
                    Confirmar y asignar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
