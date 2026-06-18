'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Collapse,
    IconButton,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type {
    AjusteFiscal,
    AjusteFiscalUpsertRequest,
    AjusteSeccion,
    AjusteTipoDiferencia,
} from '../../../types';
import {
    useAjustesFiscales,
    useUpsertAjusteFiscal,
    useDeleteAjusteFiscal,
} from '../../../hooks/useTax';
import { palette, fonts, hexAlpha } from '../../../styles/brutalist';

const SECCIONES: { key: AjusteSeccion; label: string }[] = [
    { key: 'ESF_ACTIVO', label: 'Activos' },
    { key: 'ESF_PASIVO', label: 'Pasivos' },
    { key: 'ESF_PATRIMONIO', label: 'Patrimonio' },
    { key: 'ERI_INGRESO', label: 'Ingresos' },
    { key: 'ERI_COSTO', label: 'Costos' },
    { key: 'ERI_GASTO', label: 'Gastos' },
];

const TIPO_DIFERENCIA_OPTIONS: { value: AjusteTipoDiferencia; label: string }[] = [
    { value: 'permanente', label: 'Permanente' },
    { value: 'temporaria_imponible', label: 'Temporaria imponible' },
    { value: 'temporaria_deducible', label: 'Temporaria deducible' },
];

interface AjustesFiscalesPanelProps {
    companyNit: string;
    year: number;
}

interface NewRowState {
    seccion: AjusteSeccion;
    concepto: string;
    valor_contable: string;
    valor_fiscal: string;
    tipo_diferencia: AjusteTipoDiferencia;
    descripcion: string;
}

const emptyRow = (seccion: AjusteSeccion): NewRowState => ({
    seccion,
    concepto: '',
    valor_contable: '',
    valor_fiscal: '',
    tipo_diferencia: 'permanente',
    descripcion: '',
});

/**
 * Strict numeric parser for DIAN tax figures.
 * Accepts Colombian format (. thousands, , decimal) or standard.
 * Returns NaN for ambiguous input like "1.2.3" or "5-3".
 */
function parseNumericInput(value: string): number {
    const trimmed = value.trim();
    // Colombian format: dots as thousands separator, comma as decimal
    // e.g. "1.234.567,89" or "1234567,89"
    const colombian = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(trimmed);
    if (colombian) {
        return parseFloat(trimmed.replace(/\./g, '').replace(',', '.'));
    }
    // Standard format: no thousands separator or spaces, dot as decimal
    // e.g. "1234567.89" or "1234567"
    const standard = /^-?\d+(\.\d+)?$/.test(trimmed);
    if (standard) {
        return parseFloat(trimmed);
    }
    return NaN;
}

function formatCOP(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function AjustesFiscalesPanel({ companyNit, year }: AjustesFiscalesPanelProps) {
    const { data: ajustes, isLoading } = useAjustesFiscales(companyNit, year);
    const upsert = useUpsertAjusteFiscal();
    const remove = useDeleteAjusteFiscal();

    const [openSecciones, setOpenSecciones] = useState<Set<AjusteSeccion>>(
        new Set<AjusteSeccion>(['ESF_ACTIVO'])
    );
    const [addingIn, setAddingIn] = useState<AjusteSeccion | null>(null);
    const [newRow, setNewRow] = useState<NewRowState | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const toggleSeccion = (s: AjusteSeccion) => {
        setOpenSecciones((prev) => {
            const next = new Set(prev);
            next.has(s) ? next.delete(s) : next.add(s);
            return next;
        });
    };

    const startAdd = (seccion: AjusteSeccion) => {
        setAddingIn(seccion);
        setNewRow(emptyRow(seccion));
        setSaveError(null);
        setOpenSecciones((prev) => new Set<AjusteSeccion>([...Array.from(prev), seccion]));
    };

    const handleSave = async () => {
        if (!newRow) return;
        const val_c = parseNumericInput(newRow.valor_contable);
        const val_f = parseNumericInput(newRow.valor_fiscal);
        if (!newRow.concepto.trim() || isNaN(val_c) || isNaN(val_f)) {
            setSaveError('Concepto y valores son obligatorios.');
            return;
        }
        const req: AjusteFiscalUpsertRequest = {
            company_nit: companyNit,
            year,
            seccion: newRow.seccion,
            concepto: newRow.concepto.trim(),
            valor_contable: val_c,
            valor_fiscal: val_f,
            tipo_diferencia: newRow.tipo_diferencia,
            descripcion: newRow.descripcion || undefined,
        };
        try {
            await upsert.mutateAsync(req);
            setAddingIn(null);
            setNewRow(null);
            setSaveError(null);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : 'Error al guardar.');
        }
    };

    const handleDelete = async (ajuste: AjusteFiscal) => {
        if (deleteConfirm !== ajuste.id) {
            setDeleteConfirm(ajuste.id);
            return;
        }
        try {
            await remove.mutateAsync({
                id: ajuste.id,
                company_nit: ajuste.company_nit,
                year: ajuste.year,
            });
            setDeleteConfirm(null);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : 'Error al eliminar.');
        }
    };

    if (isLoading) return <LinearProgress sx={{ my: 2 }} />;

    return (
        <Box sx={{ mt: 3 }}>
            <Typography
                sx={{
                    fontFamily: 'var(--font-jetbrains)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: palette.accent,
                    mb: 2,
                }}
            >
                // NOTAS DE AJUSTE FISCAL — F2516
            </Typography>

            {saveError && (
                <Alert
                    severity="error"
                    onClose={() => setSaveError(null)}
                    sx={{ mb: 2, borderRadius: 0 }}
                >
                    {saveError}
                </Alert>
            )}

            {SECCIONES.map(({ key, label }) => {
                const rows = (ajustes ?? []).filter((a) => a.seccion === key);
                const isOpen = openSecciones.has(key);

                return (
                    <Box
                        key={key}
                        sx={{
                            mb: 1,
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 2,
                        }}
                    >
                        {/* Section header */}
                        <Box
                            onClick={() => toggleSeccion(key)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': { borderColor: palette.accent },
                                transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.2em',
                                        textTransform: 'uppercase',
                                        color: 'rgba(250,250,245,0.5)',
                                    }}
                                >
                                    {key}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-bricolage)',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: palette.paper,
                                    }}
                                >
                                    {label}
                                </Typography>
                                {rows.length > 0 && (
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '0.65rem',
                                            letterSpacing: '0.15em',
                                            color: palette.accent,
                                            background: hexAlpha(palette.accent, 0.12),
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {rows.length}
                                    </Typography>
                                )}
                            </Box>
                            <KeyboardArrowDownIcon
                                sx={{
                                    color: 'rgba(250,250,245,0.5)',
                                    transform: isOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                                }}
                            />
                        </Box>

                        <Collapse in={isOpen}>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                            {/* Rows */}
                            {rows.map((ajuste) => {
                                const delta = ajuste.valor_fiscal - ajuste.valor_contable;
                                const isPendingDelete = deleteConfirm === ajuste.id;
                                return (
                                    <Box
                                        key={ajuste.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 140px 140px 100px 40px',
                                            gap: 2,
                                            px: 2,
                                            py: 1.5,
                                            alignItems: 'center',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            '&:hover': { background: 'rgba(255,255,255,0.02)' },
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'var(--font-inter)',
                                                    fontSize: '0.9rem',
                                                    color: palette.paper,
                                                }}
                                            >
                                                {ajuste.concepto}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'var(--font-jetbrains)',
                                                    fontSize: '0.65rem',
                                                    letterSpacing: '0.12em',
                                                    color: 'rgba(250,250,245,0.4)',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {ajuste.tipo_diferencia.replace(/_/g, ' ')}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontFamily: 'var(--font-jetbrains)',
                                                fontSize: '0.8rem',
                                                color: 'rgba(250,250,245,0.6)',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {formatCOP(ajuste.valor_contable)}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: 'var(--font-jetbrains)',
                                                fontSize: '0.8rem',
                                                color: palette.paper,
                                                textAlign: 'right',
                                            }}
                                        >
                                            {formatCOP(ajuste.valor_fiscal)}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: 'var(--font-jetbrains)',
                                                fontSize: '0.8rem',
                                                color:
                                                    delta >= 0 ? palette.chartreuse : palette.error,
                                                textAlign: 'right',
                                            }}
                                        >
                                            {delta >= 0 ? '+' : ''}
                                            {formatCOP(delta)}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(ajuste)}
                                            sx={{
                                                color: isPendingDelete
                                                    ? palette.error
                                                    : 'rgba(250,250,245,0.3)',
                                                '&:hover': { color: palette.error },
                                            }}
                                            aria-label={
                                                isPendingDelete
                                                    ? 'Confirmar eliminación'
                                                    : 'Eliminar ajuste'
                                            }
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                );
                            })}

                            {/* Add form */}
                            {addingIn === key && newRow ? (
                                <Box sx={{ p: 2 }}>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 2,
                                            mb: 2,
                                        }}
                                    >
                                        <TextField
                                            label="Concepto"
                                            size="small"
                                            value={newRow.concepto}
                                            onChange={(e) =>
                                                setNewRow({ ...newRow, concepto: e.target.value })
                                            }
                                            fullWidth
                                        />
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Tipo diferencia</InputLabel>
                                            <Select
                                                value={newRow.tipo_diferencia}
                                                label="Tipo diferencia"
                                                onChange={(e) =>
                                                    setNewRow({
                                                        ...newRow,
                                                        tipo_diferencia: e.target
                                                            .value as AjusteTipoDiferencia,
                                                    })
                                                }
                                            >
                                                {TIPO_DIFERENCIA_OPTIONS.map((o) => (
                                                    <MenuItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Valor contable (COP)"
                                            size="small"
                                            value={newRow.valor_contable}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    valor_contable: e.target.value,
                                                })
                                            }
                                            fullWidth
                                        />
                                        <TextField
                                            label="Valor fiscal (COP)"
                                            size="small"
                                            value={newRow.valor_fiscal}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    valor_fiscal: e.target.value,
                                                })
                                            }
                                            fullWidth
                                        />
                                        <TextField
                                            label="Descripción (opcional)"
                                            size="small"
                                            value={newRow.descripcion}
                                            onChange={(e) =>
                                                setNewRow({
                                                    ...newRow,
                                                    descripcion: e.target.value,
                                                })
                                            }
                                            fullWidth
                                            sx={{ gridColumn: '1 / -1' }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleSave}
                                            disabled={upsert.isPending}
                                            sx={{
                                                background: palette.accent,
                                                borderRadius: 0,
                                                fontFamily: fonts.mono,
                                                fontSize: '0.7rem',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                // hover: slightly dimmed accent (no separate dark token)
                                                '&:hover': {
                                                    background: hexAlpha(palette.accent, 0.85),
                                                },
                                            }}
                                        >
                                            Guardar
                                        </Button>
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => {
                                                setAddingIn(null);
                                                setNewRow(null);
                                            }}
                                            sx={{
                                                color: 'rgba(250,250,245,0.5)',
                                                fontFamily: 'var(--font-jetbrains)',
                                                fontSize: '0.7rem',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ p: 1.5 }}>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => startAdd(key)}
                                        aria-label="Agregar ajuste"
                                        sx={{
                                            color: 'rgba(250,250,245,0.4)',
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '0.65rem',
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase',
                                            '&:hover': { color: palette.accent },
                                        }}
                                    >
                                        Agregar
                                    </Button>
                                </Box>
                            )}
                        </Collapse>
                    </Box>
                );
            })}
        </Box>
    );
}
