'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Typography,
    Switch,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Skeleton,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Save as SaveIcon,
    Wifi as ApiIcon,
    Security as SecurityIcon,
    Info as InfoIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Gavel as GavelIcon,
} from '@mui/icons-material';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { palette, fonts, motion, sxLabelSmall, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import {
    useCompanySettings,
    useSetupCompanySettings,
    useUpsertCompanySettings,
    useMunicipios,
} from '@/hooks/useSettings';
import { usePucList, useCreatePuc, useUpdatePuc, useDeletePuc } from '@/hooks/usePuc';
import {
    useTaxConstants,
    useUpsertUvt,
    useUpsertBaseMinima,
    usePerdidasAcumuladas,
    useUpsertPerdida,
    useDeletePerdida,
    useTarifasRenta,
    useUpsertTarifa,
    useDeleteTarifa,
    useReteicaTarifas,
    useUpsertReteicaTarifa,
    useDeleteReteicaTarifa,
    useTaxConcepts,
    useUpsertTaxConcept,
    useSoftDeleteTaxConcept,
} from '@/hooks/useTax';
import {
    CuentaPUCRequest,
    PerdidaFiscal,
    TarifaRenta,
    RegimenTributario,
    ActividadEconomica,
    ReteicaTarifa,
    ReteicaTarifaUpsertRequest,
    TaxConcept,
    TaxConceptUpsertRequest,
} from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/context/CompanyContext';

const ACCENT = moduleAccents.settings;

// Brutalist text field
interface BrutalistFieldProps {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    helper?: string;
    disabled?: boolean;
    accent?: string;
    type?: string;
    maxLength?: number;
}

function BrutalistField({
    label,
    value,
    onChange,
    placeholder,
    helper,
    disabled = false,
    accent = palette.chartreuse,
    type = 'text',
    maxLength,
}: BrutalistFieldProps) {
    return (
        <Box>
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.62rem',
                    color: palette.paperFaint,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    mb: 0.75,
                }}
            >
                {label}
            </Typography>
            <TextField
                size="small"
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                fullWidth
                inputProps={maxLength ? { maxLength } : undefined}
                InputProps={{
                    sx: {
                        fontFamily: fonts.body,
                        fontSize: '0.92rem',
                        bgcolor: hexAlpha(palette.paper, 0.03),
                        borderRadius: 0.5,
                        color: palette.paper,
                        '& fieldset': { borderColor: palette.line },
                        '&:hover fieldset': { borderColor: palette.lineStrong },
                        '&.Mui-focused fieldset': { borderColor: accent, borderWidth: 1 },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.015)' },
                    },
                }}
            />
            {helper && (
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.62rem',
                        color: palette.paperGhost,
                        letterSpacing: '0.08em',
                        mt: 0.6,
                    }}
                >
                    {`// ${helper}`}
                </Typography>
            )}
        </Box>
    );
}

// Brutalist switch
function BrutalistSwitch({
    label,
    description,
    checked,
    onChange,
    accent = palette.chartreuse,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    accent?: string;
}) {
    return (
        <Box
            onClick={() => onChange(!checked)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 1.5,
                cursor: 'pointer',
                borderTop: `1px solid ${palette.lineFaint}`,
                transition: `all ${motion.duration.sm} ${motion.snap}`,
                '&:hover': { bgcolor: hexAlpha(accent, 0.03) },
                '&:first-of-type': { borderTop: 'none' },
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: palette.paper,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {label}
                </Typography>
                {description && (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.62rem',
                            color: palette.paperGhost,
                            letterSpacing: '0.1em',
                            mt: 0.3,
                            textTransform: 'uppercase',
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => {
                    e.stopPropagation();
                    onChange(e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                        color: accent,
                        '& + .MuiSwitch-track': { bgcolor: `${accent} !important`, opacity: 0.5 },
                    },
                    '& .MuiSwitch-track': { bgcolor: palette.lineStrong },
                }}
            />
        </Box>
    );
}

// Password update card — lets a logged-in user change their Supabase password.
function PasswordUpdateCard() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [feedback, setFeedback] = useState<{
        kind: 'success' | 'error';
        text: string;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setFeedback(null);

        if (password.length < 8) {
            setFeedback({
                kind: 'error',
                text: 'La contraseña debe tener al menos 8 caracteres',
            });
            return;
        }
        if (password !== confirm) {
            setFeedback({ kind: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setSubmitting(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        setSubmitting(false);

        if (error) {
            setFeedback({ kind: 'error', text: error.message });
            return;
        }
        setFeedback({ kind: 'success', text: 'Contraseña actualizada' });
        setPassword('');
        setConfirm('');
    };

    return (
        <CardShell
            eyebrow="// SEGURIDAD · CUENTA"
            title="Cambiar contraseña"
            accent={palette.accent}
            icon={<SecurityIcon sx={{ fontSize: 14 }} />}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BrutalistField
                    label="Nueva contraseña"
                    value={password}
                    onChange={setPassword}
                    placeholder="Mínimo 8 caracteres"
                    type="password"
                    accent={palette.accent}
                />
                <BrutalistField
                    label="Confirmar contraseña"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Repite tu contraseña"
                    type="password"
                    accent={palette.accent}
                />

                {feedback && (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            padding: '10px 12px',
                            border: '2px solid',
                            borderColor:
                                feedback.kind === 'success' ? palette.chartreuse : palette.error,
                            color: feedback.kind === 'success' ? palette.chartreuse : palette.paper,
                            bgcolor:
                                feedback.kind === 'success'
                                    ? hexAlpha(palette.chartreuse, 0.08)
                                    : hexAlpha(palette.error, 0.18),
                        }}
                    >
                        {`// ${feedback.text}`}
                    </Typography>
                )}

                <Box>
                    <BrutalistButton
                        accent={palette.accent}
                        disabled={submitting || !password || !confirm}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'ACTUALIZANDO…' : 'ACTUALIZAR CONTRASEÑA'}
                    </BrutalistButton>
                </Box>
            </Box>
        </CardShell>
    );
}

// Card shell
function CardShell({
    eyebrow,
    title,
    accent,
    icon,
    children,
}: {
    eyebrow: string;
    title: string;
    accent: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                position: 'relative',
                p: { xs: 2.5, md: 3 },
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: 'transparent',
                height: '100%',
                overflow: 'hidden',
                transition: `border-color ${motion.duration.md} ${motion.snap}`,
                '&:hover': { borderColor: hexAlpha(accent, 0.4) },
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 2,
                    width: 32,
                    bgcolor: accent,
                    boxShadow: `0 0 8px ${accent}`,
                }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                {icon && <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>}
                <Typography sx={{ ...sxLabelSmall, color: accent }}>{eyebrow}</Typography>
            </Box>
            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.4rem', md: '1.65rem' },
                    fontWeight: 700,
                    color: palette.paper,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    mb: 2.5,
                }}
            >
                {title}
            </Typography>
            {children}
        </Box>
    );
}

// ============================================================================
// Tax Constants Card
// ============================================================================

const BASE_MINIMA_LABELS: Record<string, string> = {
    retefuente_servicios: 'Retefuente servicios',
    retefuente_bienes: 'Retefuente bienes',
    retefuente_arrendamiento: 'Retefuente arrendamiento',
    reteica: 'Reteica',
};

function TaxConstantsCard() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [toast, setToast] = useState<string | null>(null);

    // UVT edit state
    const [editingUvt, setEditingUvt] = useState(false);
    const [uvtValue, setUvtValue] = useState('');
    const [uvtDecreto, setUvtDecreto] = useState('');

    // Base mínima edit state
    const [editingConcepto, setEditingConcepto] = useState<string | null>(null);
    const [editingUnits, setEditingUnits] = useState('');

    const { data, isLoading, isError, error } = useTaxConstants(year);
    const upsertUvtMutation = useUpsertUvt();
    const upsertBaseMiniMutation = useUpsertBaseMinima();

    const handleEditUvt = () => {
        setUvtValue(String(data?.uvt.value ?? ''));
        setUvtDecreto(data?.uvt.decreto ?? '');
        setEditingUvt(true);
    };

    const handleSaveUvt = async () => {
        try {
            await upsertUvtMutation.mutateAsync({
                year,
                value: parseFloat(uvtValue),
                decreto: uvtDecreto || undefined,
            });
            setEditingUvt(false);
            setToast('UVT actualizado');
        } catch {
            // error shown via mutation state
        }
    };

    const handleEditBaseMinima = (concepto: string, units: number) => {
        setEditingConcepto(concepto);
        setEditingUnits(String(units));
    };

    const handleSaveBaseMinima = async () => {
        if (!editingConcepto) return;
        try {
            await upsertBaseMiniMutation.mutateAsync({
                concepto: editingConcepto,
                uvt_units: parseInt(editingUnits, 10),
                year,
            });
            setEditingConcepto(null);
            setToast('Base mínima actualizada');
        } catch {
            // error shown via mutation state
        }
    };

    const sxMono = {
        fontFamily: fonts.mono,
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: palette.paperFaint,
        fontWeight: 600,
    };

    const sxInputAmber = {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.line },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.lineStrong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.amber,
            borderWidth: 1,
        },
        borderRadius: 1,
        fontFamily: fonts.body,
        fontSize: '0.9rem',
        color: palette.paper,
    };

    return (
        <CardShell
            eyebrow="// CONSTANTES_TRIBUTARIAS"
            title="Constantes tributarias"
            accent={palette.amber}
            icon={<InfoIcon sx={{ fontSize: 14 }} />}
        >
            {/* Year selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Typography sx={sxMono}>Año</Typography>
                <TextField
                    type="number"
                    size="small"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || currentYear)}
                    inputProps={{ min: 2020, max: 2035 }}
                    sx={{
                        width: 100,
                        '& .MuiOutlinedInput-root': sxInputAmber,
                        '& input': {
                            color: palette.paper,
                            fontFamily: fonts.mono,
                            fontSize: '0.9rem',
                        },
                    }}
                />
            </Box>

            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={32}
                            sx={{ bgcolor: hexAlpha(palette.paper, 0.06), borderRadius: 1 }}
                        />
                    ))}
                </Box>
            )}

            {isError && (
                <Box
                    sx={{
                        p: 1.5,
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        borderRadius: 0.5,
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <Typography sx={{ ...sxMono, color: palette.error, mt: 0.1 }}>
                        {'// ERROR'}
                    </Typography>
                    <Typography
                        sx={{ fontFamily: fonts.body, fontSize: '0.85rem', color: palette.paper }}
                    >
                        {error instanceof Error
                            ? error.message
                            : 'No se pudieron cargar las constantes tributarias'}
                    </Typography>
                </Box>
            )}

            {data && !isLoading && (
                <>
                    {/* UVT row */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 1.25,
                            borderBottom: `1px solid ${palette.lineFaint}`,
                        }}
                    >
                        <Box>
                            <Typography sx={sxMono}>UVT {data.uvt.year}</Typography>
                            {editingUvt ? (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                                    <TextField
                                        size="small"
                                        label="Valor"
                                        type="number"
                                        value={uvtValue}
                                        onChange={(e) => setUvtValue(e.target.value)}
                                        sx={{
                                            width: 120,
                                            '& .MuiOutlinedInput-root': sxInputAmber,
                                            '& .MuiInputLabel-root': {
                                                fontFamily: fonts.mono,
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                color: palette.paperFaint,
                                                '&.Mui-focused': { color: palette.amber },
                                            },
                                            '& input': {
                                                color: palette.paper,
                                                fontFamily: fonts.mono,
                                            },
                                        }}
                                    />
                                    <TextField
                                        size="small"
                                        label="Decreto"
                                        value={uvtDecreto}
                                        onChange={(e) => setUvtDecreto(e.target.value)}
                                        sx={{
                                            width: 120,
                                            '& .MuiOutlinedInput-root': sxInputAmber,
                                            '& .MuiInputLabel-root': {
                                                fontFamily: fonts.mono,
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                color: palette.paperFaint,
                                                '&.Mui-focused': { color: palette.amber },
                                            },
                                            '& input': {
                                                color: palette.paper,
                                                fontFamily: fonts.mono,
                                            },
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                        <BrutalistButton
                                            variant="primary"
                                            accent={palette.amber}
                                            size="sm"
                                            onClick={handleSaveUvt}
                                            loading={upsertUvtMutation.isPending}
                                        >
                                            Guardar
                                        </BrutalistButton>
                                        <BrutalistButton
                                            variant="ghost"
                                            accent={palette.paperFaint}
                                            size="sm"
                                            onClick={() => setEditingUvt(false)}
                                        >
                                            Cancelar
                                        </BrutalistButton>
                                    </Box>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 1.5,
                                        mt: 0.25,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '1.1rem',
                                            color: palette.amber,
                                            fontWeight: 700,
                                        }}
                                    >
                                        ${data.uvt.value.toLocaleString('es-CO')}
                                    </Typography>
                                    {data.uvt.decreto && (
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.65rem',
                                                color: palette.paperFaint,
                                                letterSpacing: '0.15em',
                                            }}
                                        >
                                            DEC. {data.uvt.decreto}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                        {!editingUvt && (
                            <BrutalistButton
                                variant="outline"
                                accent={palette.amber}
                                size="sm"
                                onClick={handleEditUvt}
                            >
                                <EditIcon sx={{ fontSize: 13, mr: 0.5 }} /> Editar
                            </BrutalistButton>
                        )}
                    </Box>

                    {/* Base mínima rows */}
                    <Box sx={{ mt: 1.5 }}>
                        <Typography sx={{ ...sxMono, mb: 1 }}>Base mínima (UVT)</Typography>
                        {data.base_minima.map((row, i) => (
                            <Box
                                key={row.concepto}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderTop: i === 0 ? 'none' : `1px solid ${palette.lineFaint}`,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.85rem',
                                        color: palette.paper,
                                    }}
                                >
                                    {BASE_MINIMA_LABELS[row.concepto] ?? row.concepto}
                                </Typography>
                                {editingConcepto === row.concepto ? (
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editingUnits}
                                            onChange={(e) => setEditingUnits(e.target.value)}
                                            inputProps={{ min: 1, max: 999 }}
                                            sx={{
                                                width: 72,
                                                '& .MuiOutlinedInput-root': sxInputAmber,
                                                '& input': {
                                                    color: palette.paper,
                                                    fontFamily: fonts.mono,
                                                    textAlign: 'center',
                                                },
                                            }}
                                        />
                                        <BrutalistButton
                                            variant="primary"
                                            accent={palette.amber}
                                            size="sm"
                                            onClick={handleSaveBaseMinima}
                                            loading={upsertBaseMiniMutation.isPending}
                                        >
                                            OK
                                        </BrutalistButton>
                                        <BrutalistButton
                                            variant="ghost"
                                            accent={palette.paperFaint}
                                            size="sm"
                                            onClick={() => setEditingConcepto(null)}
                                        >
                                            ✕
                                        </BrutalistButton>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.9rem',
                                                color: palette.amber,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {row.uvt_units} UVT
                                        </Typography>
                                        <BrutalistButton
                                            variant="ghost"
                                            accent={palette.amber}
                                            size="sm"
                                            onClick={() =>
                                                handleEditBaseMinima(row.concepto, row.uvt_units)
                                            }
                                        >
                                            <EditIcon sx={{ fontSize: 12 }} />
                                        </BrutalistButton>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </>
            )}

            {/* Success toast */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(null)}
                    severity="success"
                    sx={{
                        bgcolor: hexAlpha(palette.amber, 0.15),
                        border: `1px solid ${hexAlpha(palette.amber, 0.4)}`,
                        color: palette.amber,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        '& .MuiAlert-icon': { color: palette.amber },
                    }}
                >
                    {toast}
                </Alert>
            </Snackbar>
        </CardShell>
    );
}

// ============================================================================
// Pérdidas Fiscales Card — Art. 147 ET
// ============================================================================

interface PerdidaFormData {
    year: string;
    monto_perdida: string;
    decreto: string;
    notas: string;
}

const EMPTY_PERDIDA_FORM: PerdidaFormData = {
    year: String(new Date().getFullYear()),
    monto_perdida: '',
    decreto: '',
    notas: '',
};

function PerdidasFiscalesCard() {
    const [toast, setToast] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<PerdidaFormData>(EMPTY_PERDIDA_FORM);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const { activeNit } = useCompany();
    const { data: perdidas = [], isLoading, isError, error } = usePerdidasAcumuladas();
    const upsertMutation = useUpsertPerdida();
    const deleteMutation = useDeletePerdida();

    const sxMono = {
        fontFamily: fonts.mono,
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: palette.paperFaint,
        fontWeight: 600,
    };

    const sxInputError = {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.line },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.lineStrong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.error,
            borderWidth: 1,
        },
        borderRadius: 1,
        fontFamily: fonts.body,
        fontSize: '0.9rem',
        color: palette.paper,
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm(EMPTY_PERDIDA_FORM);
        setModalOpen(true);
    };

    const handleOpenEdit = (p: PerdidaFiscal) => {
        setEditingId(p.id);
        setForm({
            year: String(p.year),
            monto_perdida: String(p.monto_perdida),
            decreto: p.decreto ?? '',
            notas: p.notas ?? '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!activeNit) return;
        try {
            await upsertMutation.mutateAsync({
                company_nit: activeNit,
                year: parseInt(form.year, 10),
                monto_perdida: parseFloat(form.monto_perdida) || 0,
                decreto: form.decreto || undefined,
                notas: form.notas || undefined,
            });
            setModalOpen(false);
            setToast(editingId ? 'Pérdida actualizada' : 'Pérdida registrada');
        } catch {
            // error surfaced via mutation
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            setConfirmDeleteId(null);
            setToast('Pérdida eliminada');
        } catch {
            // error surfaced via mutation
        }
    };

    const fmt = (v: number) =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(v);

    return (
        <CardShell
            eyebrow="// PERDIDAS_FISCALES_ART_147"
            title="Pérdidas fiscales acumuladas"
            accent={palette.error}
            icon={<GavelIcon sx={{ fontSize: 14 }} />}
        >
            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={36}
                            sx={{ bgcolor: hexAlpha(palette.paper, 0.06), borderRadius: 1 }}
                        />
                    ))}
                </Box>
            )}

            {isError && (
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        color: palette.error,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                >
                    {error instanceof Error ? error.message : 'Error al cargar pérdidas fiscales'}
                </Alert>
            )}

            {!isLoading && !isError && (
                <>
                    {perdidas.length === 0 ? (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                color: palette.paperGhost,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                py: 3,
                                textAlign: 'center',
                            }}
                        >
                            {'// SIN PERDIDAS REGISTRADAS'}
                        </Typography>
                    ) : (
                        <Box sx={{ overflowX: 'auto', mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ borderBottom: `1px solid ${palette.line}` }}>
                                        {[
                                            'Año',
                                            'Monto pérdida',
                                            'Compensado',
                                            'Pendiente',
                                            'Decreto',
                                            'Acciones',
                                        ].map((col) => (
                                            <TableCell
                                                key={col}
                                                sx={{
                                                    ...sxMono,
                                                    color: palette.paperFaint,
                                                    borderBottom: 'none',
                                                    pb: 1,
                                                }}
                                                align={col === 'Acciones' ? 'right' : 'left'}
                                            >
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {perdidas.map((p) => (
                                        <TableRow
                                            key={p.id}
                                            sx={{
                                                borderBottom: `1px solid ${palette.lineFaint}`,
                                                '&:last-child td': { borderBottom: 'none' },
                                            }}
                                        >
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.85rem',
                                                    color: palette.paper,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {p.year}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color: palette.error,
                                                }}
                                            >
                                                {fmt(p.monto_perdida)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {fmt(p.monto_compensado)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color:
                                                        p.monto_pendiente > 0
                                                            ? palette.amber
                                                            : palette.success,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fmt(p.monto_pendiente)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.75rem',
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {p.decreto ?? '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        justifyContent: 'flex-end',
                                                    }}
                                                >
                                                    <BrutalistButton
                                                        variant="ghost"
                                                        accent={palette.amber}
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(p)}
                                                    >
                                                        <EditIcon sx={{ fontSize: 13 }} />
                                                    </BrutalistButton>
                                                    <BrutalistButton
                                                        variant="ghost"
                                                        accent={palette.error}
                                                        size="sm"
                                                        onClick={() => setConfirmDeleteId(p.id)}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 13 }} />
                                                    </BrutalistButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}

                    <Box sx={{ pt: 1 }}>
                        <BrutalistButton
                            accent={palette.error}
                            icon={<AddIcon sx={{ fontSize: 15 }} />}
                            size="sm"
                            onClick={handleOpenAdd}
                        >
                            Agregar pérdida
                        </BrutalistButton>
                    </Box>
                </>
            )}

            {/* Add/Edit Modal */}
            <Dialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: palette.ink, border: `1px solid ${palette.line}` },
                }}
            >
                <DialogTitle
                    sx={{ color: palette.paper, fontWeight: 700, fontFamily: fonts.display }}
                >
                    {editingId ? 'Editar pérdida fiscal' : 'Agregar pérdida fiscal'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <BrutalistField
                        label="Año fiscal"
                        value={form.year}
                        onChange={(v) => setForm({ ...form, year: v })}
                        type="number"
                        placeholder={String(new Date().getFullYear())}
                        accent={palette.error}
                    />
                    <BrutalistField
                        label="Monto de la pérdida (COP)"
                        value={form.monto_perdida}
                        onChange={(v) => setForm({ ...form, monto_perdida: v })}
                        type="number"
                        placeholder="0"
                        accent={palette.error}
                    />
                    <BrutalistField
                        label="Decreto (opcional)"
                        value={form.decreto}
                        onChange={(v) => setForm({ ...form, decreto: v })}
                        placeholder="Ej: 1625/2016"
                        accent={palette.error}
                    />
                    <BrutalistField
                        label="Notas (opcional)"
                        value={form.notas}
                        onChange={(v) => setForm({ ...form, notas: v })}
                        placeholder="Observaciones adicionales"
                        accent={palette.error}
                    />
                    {upsertMutation.isError && (
                        <Alert
                            severity="error"
                            sx={{
                                bgcolor: hexAlpha(palette.error, 0.08),
                                border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                                color: palette.paper,
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                            }}
                        >
                            {upsertMutation.error instanceof Error
                                ? upsertMutation.error.message
                                : 'Error al guardar'}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <BrutalistButton
                        variant="outline"
                        accent={palette.paperFaint}
                        size="sm"
                        onClick={() => setModalOpen(false)}
                    >
                        Cancelar
                    </BrutalistButton>
                    <BrutalistButton
                        accent={palette.error}
                        size="sm"
                        onClick={handleSave}
                        loading={upsertMutation.isPending}
                        disabled={!form.year || !form.monto_perdida}
                    >
                        Guardar
                    </BrutalistButton>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog
                open={confirmDeleteId !== null}
                onClose={() => setConfirmDeleteId(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: palette.ink,
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        color: palette.error,
                        fontFamily: fonts.mono,
                        fontSize: '0.85rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                    }}
                >
                    {'// CONFIRMAR ELIMINACIÓN'}
                </DialogTitle>
                <DialogContent>
                    <Typography
                        sx={{ fontFamily: fonts.body, fontSize: '0.9rem', color: palette.paper }}
                    >
                        Esta acción eliminará el registro de pérdida fiscal. No se puede deshacer.
                    </Typography>
                    {deleteMutation.isError && (
                        <Alert
                            severity="error"
                            sx={{
                                mt: 1.5,
                                bgcolor: hexAlpha(palette.error, 0.08),
                                border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                                color: palette.paper,
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                            }}
                        >
                            {deleteMutation.error instanceof Error
                                ? deleteMutation.error.message
                                : 'Error al eliminar'}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <BrutalistButton
                        variant="outline"
                        accent={palette.paperFaint}
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                    >
                        Cancelar
                    </BrutalistButton>
                    <BrutalistButton
                        accent={palette.error}
                        size="sm"
                        onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
                        loading={deleteMutation.isPending}
                    >
                        Eliminar
                    </BrutalistButton>
                </DialogActions>
            </Dialog>

            {/* Success toast */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(null)}
                    severity="success"
                    sx={{
                        bgcolor: hexAlpha(palette.success, 0.15),
                        border: `1px solid ${hexAlpha(palette.success, 0.4)}`,
                        color: palette.success,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        '& .MuiAlert-icon': { color: palette.success },
                    }}
                >
                    {toast}
                </Alert>
            </Snackbar>
        </CardShell>
    );
}

// ============================================================================
// Tarifas de Renta (Regulatorias) Card
// TARIFAS_RENTA
// ============================================================================

interface TarifaFormData {
    regimen: RegimenTributario;
    actividad: ActividadEconomica | '';
    tarifa_base: string;
    sobretasa: string;
    year_from: string;
    year_to: string;
    base_legal: string;
    notas: string;
}

const EMPTY_TARIFA_FORM: TarifaFormData = {
    regimen: 'ordinario',
    actividad: '',
    tarifa_base: '0.35',
    sobretasa: '0',
    year_from: String(new Date().getFullYear()),
    year_to: '',
    base_legal: '',
    notas: '',
};

const REGIMEN_LABELS: Record<RegimenTributario, string> = {
    ordinario: 'Ordinario',
    esal: 'ESAL',
    zona_franca: 'Zona Franca',
    rst: 'RST',
};

const ACTIVIDAD_LABELS: Record<ActividadEconomica, string> = {
    general: 'General',
    financiero: 'Financiero',
    hidroelectrico: 'Hidroeléctrico',
    otro: 'Otro',
};

function TarifasRentaCard() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [toast, setToast] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<TarifaFormData>(EMPTY_TARIFA_FORM);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const { data: tarifas = [], isLoading, isError, error } = useTarifasRenta(year);
    const upsertMutation = useUpsertTarifa();
    const deleteMutation = useDeleteTarifa();

    const sxMono = {
        fontFamily: fonts.mono,
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: palette.paperFaint,
        fontWeight: 600,
    };

    const sxInput = {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.line },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.lineStrong },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.amber,
            borderWidth: 1,
        },
        borderRadius: 1,
        fontFamily: fonts.body,
        fontSize: '0.9rem',
        color: palette.paper,
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setForm({ ...EMPTY_TARIFA_FORM, year_from: String(year) });
        setModalOpen(true);
    };

    const handleOpenEdit = (t: TarifaRenta) => {
        setEditingId(t.id);
        setForm({
            regimen: t.regimen,
            actividad: t.actividad ?? '',
            tarifa_base: String(t.tarifa_base),
            sobretasa: String(t.sobretasa),
            year_from: String(t.year_from),
            year_to: t.year_to !== null ? String(t.year_to) : '',
            base_legal: t.base_legal ?? '',
            notas: t.notas ?? '',
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            await upsertMutation.mutateAsync({
                regimen: form.regimen,
                actividad: form.actividad !== '' ? (form.actividad as ActividadEconomica) : null,
                tarifa_base: parseFloat(form.tarifa_base) || 0,
                sobretasa: parseFloat(form.sobretasa) || 0,
                year_from: parseInt(form.year_from, 10),
                year_to: form.year_to ? parseInt(form.year_to, 10) : null,
                base_legal: form.base_legal || null,
                notas: form.notas || null,
            });
            setModalOpen(false);
            setToast(editingId ? 'Tarifa actualizada' : 'Tarifa registrada');
        } catch {
            // error surfaced via mutation
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            setConfirmDeleteId(null);
            setToast('Tarifa eliminada');
        } catch {
            // error surfaced via mutation
        }
    };

    const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

    return (
        <CardShell
            eyebrow="// TARIFAS_RENTA"
            title="Tarifas de renta (regulatorias)"
            accent={palette.amber}
            icon={<GavelIcon sx={{ fontSize: 14 }} />}
        >
            {/* Year selector + add button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Typography sx={sxMono}>Año</Typography>
                <TextField
                    size="small"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || currentYear)}
                    sx={{ width: 80, ...sxInput }}
                    inputProps={{ min: 2020, max: 2099 }}
                />
                <Box sx={{ flex: 1 }} />
                <BrutalistButton
                    accent={palette.amber}
                    icon={<AddIcon sx={{ fontSize: 16 }} />}
                    size="sm"
                    onClick={handleOpenAdd}
                >
                    Nueva
                </BrutalistButton>
            </Box>

            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={36}
                            sx={{ bgcolor: hexAlpha(palette.paper, 0.06), borderRadius: 1 }}
                        />
                    ))}
                </Box>
            )}

            {isError && (
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        color: palette.error,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                >
                    {error instanceof Error ? error.message : 'Error al cargar tarifas de renta'}
                </Alert>
            )}

            {!isLoading && !isError && (
                <>
                    {tarifas.length === 0 ? (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                color: palette.paperGhost,
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                py: 3,
                                textAlign: 'center',
                            }}
                        >
                            {'// SIN TARIFAS REGISTRADAS'}
                        </Typography>
                    ) : (
                        <Box sx={{ overflowX: 'auto', mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ borderBottom: `1px solid ${palette.line}` }}>
                                        {[
                                            'Régimen',
                                            'Actividad',
                                            'Tarifa base',
                                            'Sobretasa',
                                            'Efectiva',
                                            'Vigencia',
                                            'Base legal',
                                            'Acciones',
                                        ].map((col) => (
                                            <TableCell
                                                key={col}
                                                sx={{
                                                    ...sxMono,
                                                    color: palette.paperFaint,
                                                    borderBottom: 'none',
                                                    pb: 1,
                                                }}
                                                align={col === 'Acciones' ? 'right' : 'left'}
                                            >
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tarifas.map((t) => (
                                        <TableRow
                                            key={t.id}
                                            sx={{
                                                borderBottom: `1px solid ${palette.lineFaint}`,
                                                '&:last-child td': { borderBottom: 'none' },
                                            }}
                                        >
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color: palette.paper,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {REGIMEN_LABELS[t.regimen]}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.75rem',
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {t.actividad ? ACTIVIDAD_LABELS[t.actividad] : '—'}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color: palette.paperMuted,
                                                }}
                                            >
                                                {pct(t.tarifa_base)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.8rem',
                                                    color: palette.paperMuted,
                                                }}
                                            >
                                                {pct(t.sobretasa)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.85rem',
                                                    color: palette.amber,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {pct(t.tarifa_efectiva)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.75rem',
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                {t.year_from}
                                                {t.year_to ? `–${t.year_to}` : '+'}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.72rem',
                                                    color: palette.paperFaint,
                                                    maxWidth: 120,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={t.base_legal ?? ''}
                                            >
                                                {t.base_legal ?? '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        justifyContent: 'flex-end',
                                                    }}
                                                >
                                                    <BrutalistButton
                                                        variant="ghost"
                                                        accent={palette.amber}
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(t)}
                                                    >
                                                        <EditIcon sx={{ fontSize: 14 }} />
                                                    </BrutalistButton>
                                                    <BrutalistButton
                                                        variant="ghost"
                                                        accent={palette.error}
                                                        size="sm"
                                                        onClick={() => setConfirmDeleteId(t.id)}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                                    </BrutalistButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </>
            )}

            {/* Add/Edit modal */}
            <Dialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: palette.inkSoft,
                        border: `1px solid ${palette.line}`,
                        borderRadius: 2,
                        minWidth: 420,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: palette.paper,
                        borderBottom: `1px solid ${palette.line}`,
                        pb: 1.5,
                    }}
                >
                    {editingId ? 'Editar tarifa' : 'Nueva tarifa'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Régimen */}
                    <Box>
                        <Typography sx={{ ...sxMono, mb: 0.75 }}>Régimen</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={form.regimen}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        regimen: e.target.value as RegimenTributario,
                                    }))
                                }
                                sx={sxInput}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            bgcolor: palette.inkSoft,
                                            border: `1px solid ${palette.line}`,
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="ordinario">Ordinario</MenuItem>
                                <MenuItem value="esal">ESAL</MenuItem>
                                <MenuItem value="zona_franca">Zona Franca</MenuItem>
                                <MenuItem value="rst">RST</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    {/* Actividad */}
                    <Box>
                        <Typography sx={{ ...sxMono, mb: 0.75 }}>Actividad (opcional)</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={form.actividad}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        actividad: e.target.value as ActividadEconomica | '',
                                    }))
                                }
                                sx={sxInput}
                                displayEmpty
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            bgcolor: palette.inkSoft,
                                            border: `1px solid ${palette.line}`,
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="">— Todas —</MenuItem>
                                <MenuItem value="general">General</MenuItem>
                                <MenuItem value="financiero">Financiero</MenuItem>
                                <MenuItem value="hidroelectrico">Hidroeléctrico</MenuItem>
                                <MenuItem value="otro">Otro</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    {/* Numeric fields */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography sx={{ ...sxMono, mb: 0.75 }}>Tarifa base</Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={form.tarifa_base}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, tarifa_base: e.target.value }))
                                }
                                fullWidth
                                sx={sxInput}
                                inputProps={{ step: 0.01, min: 0, max: 1 }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ ...sxMono, mb: 0.75 }}>Sobretasa</Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={form.sobretasa}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, sobretasa: e.target.value }))
                                }
                                fullWidth
                                sx={sxInput}
                                inputProps={{ step: 0.01, min: 0, max: 1 }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ ...sxMono, mb: 0.75 }}>Año desde</Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={form.year_from}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, year_from: e.target.value }))
                                }
                                fullWidth
                                sx={sxInput}
                                inputProps={{ min: 2000, max: 2099 }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ ...sxMono, mb: 0.75 }}>
                                Año hasta (vacío = vigente)
                            </Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={form.year_to}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, year_to: e.target.value }))
                                }
                                fullWidth
                                sx={sxInput}
                                inputProps={{ min: 2000, max: 2099 }}
                                placeholder="—"
                            />
                        </Box>
                    </Box>
                    <Box>
                        <Typography sx={{ ...sxMono, mb: 0.75 }}>Base legal</Typography>
                        <TextField
                            size="small"
                            value={form.base_legal}
                            onChange={(e) => setForm((f) => ({ ...f, base_legal: e.target.value }))}
                            fullWidth
                            sx={sxInput}
                            placeholder="Art. 240 ET"
                        />
                    </Box>
                    <Box>
                        <Typography sx={{ ...sxMono, mb: 0.75 }}>Notas</Typography>
                        <TextField
                            size="small"
                            value={form.notas}
                            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                            fullWidth
                            multiline
                            rows={2}
                            sx={sxInput}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${palette.line}`, p: 2, gap: 1 }}>
                    <BrutalistButton
                        accent={palette.paperFaint}
                        size="sm"
                        onClick={() => setModalOpen(false)}
                    >
                        Cancelar
                    </BrutalistButton>
                    <BrutalistButton
                        accent={palette.amber}
                        size="sm"
                        icon={<SaveIcon sx={{ fontSize: 14 }} />}
                        onClick={handleSave}
                    >
                        Guardar
                    </BrutalistButton>
                </DialogActions>
            </Dialog>

            {/* Confirm delete dialog */}
            <Dialog
                open={confirmDeleteId !== null}
                onClose={() => setConfirmDeleteId(null)}
                PaperProps={{
                    sx: {
                        bgcolor: palette.inkSoft,
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        borderRadius: 2,
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: palette.error,
                    }}
                >
                    ¿Eliminar tarifa?
                </DialogTitle>
                <DialogContent>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            color: palette.paperMuted,
                            fontSize: '0.9rem',
                        }}
                    >
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <BrutalistButton
                        accent={palette.paperFaint}
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                    >
                        Cancelar
                    </BrutalistButton>
                    <BrutalistButton
                        accent={palette.error}
                        size="sm"
                        icon={<DeleteIcon sx={{ fontSize: 14 }} />}
                        onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
                    >
                        Eliminar
                    </BrutalistButton>
                </DialogActions>
            </Dialog>

            {/* Toast */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(null)}
                    severity="success"
                    sx={{
                        bgcolor: hexAlpha(palette.success, 0.15),
                        border: `1px solid ${hexAlpha(palette.success, 0.4)}`,
                        color: palette.success,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        '& .MuiAlert-icon': { color: palette.success },
                    }}
                >
                    {toast}
                </Alert>
            </Snackbar>
        </CardShell>
    );
}

// Main page
export default function SettingsPage() {
    const { activeNit } = useCompany();
    const { data: health } = useHealthCheck();
    const [nit, setNit] = useState('');
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [codigoCiiu, setCodigoCiiu] = useState('');
    const [ivaResponsable, setIvaResponsable] = useState(true);
    const [esDeclarante, setEsDeclarante] = useState<boolean | undefined>(undefined);
    const [tasaReteica, setTasaReteica] = useState('0.0069');
    const [tasaIva, setTasaIva] = useState('0.19');
    const [tasaRetefuenteServicios, setTasaRetefuenteServicios] = useState('0.11');
    const [tasaRetefuenteBienes, setTasaRetefuenteBienes] = useState('0.03');
    const [tasaRetefuenteArrendamiento, setTasaRetefuenteArrendamiento] = useState('0.10');
    const [tasaIca, setTasaIca] = useState('0.0069');
    const [tasaRenta, setTasaRenta] = useState('0.35');
    const [regimenTributario, setRegimenTributario] = useState<RegimenTributario>('ordinario');
    const [actividadEconomica, setActividadEconomica] = useState<ActividadEconomica>('general');
    const [settingsLookupEnabled, setSettingsLookupEnabled] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Seed NIT from global company context so "Guardar tasas" works without
    // the user having to re-enter the NIT in this page's own input.
    useEffect(() => {
        if (activeNit) {
            setNit(activeNit);
            setSettingsLookupEnabled(true);
        }
    }, [activeNit]);

    // PUC modal state
    const [pucModalOpen, setPucModalOpen] = useState(false);
    const [pucSearchTerm, setPucSearchTerm] = useState('');
    const [pucFormData, setPucFormData] = useState<CuentaPUCRequest>({
        codigo: '',
        nombre: '',
        clase: 5,
        naturaleza: 'debito',
    });
    const [pucEditingCodigo, setPucEditingCodigo] = useState<string | null>(null);

    // ReteicaTarifa state
    const [reteicaForm, setReteicaForm] = useState<{
        municipio: string;
        ciiu_seccion: string;
        tasa: string;
        fuente: string;
        base_minima_uvt: string;
    }>({ municipio: '', ciiu_seccion: 'general', tasa: '', fuente: '', base_minima_uvt: '4' });
    const [editingReteicaId, setEditingReteicaId] = useState<number | null>(null);
    const [showReteicaForm, setShowReteicaForm] = useState(false);

    // TaxConcepts state
    const [editingConceptCode, setEditingConceptCode] = useState<string | null>(null);
    const [conceptForm, setConceptForm] = useState<{
        label: string;
        renglon_350: string;
        aplica_a: string;
        categoria: string;
        tarifa_default: string;
        base_minima_uvt: string;
        art_referencia: string;
        activo: boolean;
    }>({
        label: '',
        renglon_350: '',
        aplica_a: 'PJ',
        categoria: 'compras',
        tarifa_default: '',
        base_minima_uvt: '',
        art_referencia: '',
        activo: true,
    });

    // Page-level toast. severity 'success' confirms a DB write completed;
    // 'error' surfaces a failed mutation. Set ONLY after the awaited mutation
    // settles, never optimistically.
    const [pageToast, setPageToast] = useState<{
        text: string;
        severity: 'success' | 'error';
    } | null>(null);

    const { data: companySettings, isFetching } = useCompanySettings(
        nit,
        settingsLookupEnabled && !!nit
    );
    const setupMutation = useSetupCompanySettings();
    const upsertMutation = useUpsertCompanySettings();
    const { data: municipios = [] } = useMunicipios();
    const { data: pucList = [], isLoading: pucLoading } = usePucList({
        search: pucSearchTerm,
        limit: 200,
    });
    const createPucMutation = useCreatePuc();
    const updatePucMutation = useUpdatePuc();
    const deletePucMutation = useDeletePuc();
    const currentYear = new Date().getFullYear();
    const { data: tarifasCurrentYear = [] } = useTarifasRenta(currentYear);
    const { data: reteicaTarifas, isLoading: reteicaLoading } = useReteicaTarifas();
    const upsertReteicaMutation = useUpsertReteicaTarifa();
    const deleteReteicaMutation = useDeleteReteicaTarifa();
    const { data: taxConcepts, isLoading: conceptsLoading } = useTaxConcepts(undefined);
    const upsertConceptMutation = useUpsertTaxConcept();
    const softDeleteConceptMutation = useSoftDeleteTaxConcept();

    useEffect(() => {
        if (!companySettings) return;
        setNombre(companySettings.nombre || '');
        setCiudad(companySettings.ciudad || '');
        setCodigoCiiu(companySettings.codigo_ciiu || '');
        setIvaResponsable(companySettings.iva_responsable);
        setEsDeclarante(companySettings.es_declarante);
        setTasaReteica(String(companySettings.tasa_reteica));
        setTasaIva(String(companySettings.tasa_iva_general));
        setTasaRetefuenteServicios(String(companySettings.tasa_retefuente_servicios));
        setTasaRetefuenteBienes(String(companySettings.tasa_retefuente_bienes));
        setTasaRetefuenteArrendamiento(String(companySettings.tasa_retefuente_arrendamiento));
        setTasaIca(String(companySettings.tasa_ica));
        setTasaRenta(String(companySettings.tasa_renta));
        if (companySettings.regimen_tributario) {
            setRegimenTributario(companySettings.regimen_tributario);
        }
        if (companySettings.actividad_economica) {
            setActividadEconomica(companySettings.actividad_economica);
        }
    }, [companySettings]);

    const handleLoadCompany = () => setSettingsLookupEnabled(true);

    const handleSave = async () => {
        setErrorMessage(null);
        try {
            if (!nit) {
                setErrorMessage('Debes ingresar un NIT.');
                return;
            }
            await upsertMutation.mutateAsync({
                nit,
                payload: {
                    nombre,
                    ciudad,
                    codigo_ciiu: codigoCiiu,
                    iva_responsable: ivaResponsable,
                    es_declarante: esDeclarante,
                    tasa_retefuente_servicios: Number(tasaRetefuenteServicios),
                    tasa_retefuente_bienes: Number(tasaRetefuenteBienes),
                    tasa_retefuente_arrendamiento: Number(tasaRetefuenteArrendamiento),
                    tasa_reteica: Number(tasaReteica),
                    tasa_iva_general: Number(tasaIva),
                    tasa_ica: Number(tasaIca),
                    tasa_renta: Number(tasaRenta),
                    regimen_tributario: regimenTributario,
                    actividad_economica: actividadEconomica,
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            setPageToast({ text: 'Configuración guardada correctamente', severity: 'success' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo guardar la configuración';
            setErrorMessage(msg);
            setPageToast({ text: msg, severity: 'error' });
        }
    };

    const handleAutoSetup = async () => {
        setErrorMessage(null);
        try {
            if (!nit || !ciudad || !codigoCiiu) {
                setErrorMessage('Para setup automático debes completar NIT, ciudad y código CIIU.');
                return;
            }
            const result = await setupMutation.mutateAsync({
                nit,
                payload: {
                    nombre,
                    ciudad,
                    codigo_ciiu: codigoCiiu,
                    iva_responsable: ivaResponsable,
                },
            });
            setTasaRetefuenteServicios(String(result.tasa_retefuente_servicios ?? 0.11));
            setTasaRetefuenteBienes(String(result.tasa_retefuente_bienes ?? 0.03));
            setTasaRetefuenteArrendamiento(String(result.tasa_retefuente_arrendamiento ?? 0.1));
            setTasaReteica(String(result.tasa_reteica ?? 0.0069));
            setTasaIva(String(result.tasa_iva_general ?? 0.19));
            setTasaIca(String(result.tasa_ica ?? 0.0069));
            setTasaRenta(String(result.tasa_renta ?? 0.35));
            if (result.regimen_tributario) setRegimenTributario(result.regimen_tributario);
            if (result.actividad_economica) setActividadEconomica(result.actividad_economica);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            setPageToast({ text: 'Tasas calculadas y guardadas', severity: 'success' });
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'No se pudo ejecutar el setup automático';
            setErrorMessage(msg);
            setPageToast({ text: msg, severity: 'error' });
        }
    };

    const handleOpenPucModal = (codigo?: string) => {
        if (codigo) {
            const existing = pucList.find((p) => p.codigo === codigo);
            if (existing) {
                setPucFormData({
                    codigo: existing.codigo,
                    nombre: existing.nombre,
                    clase: existing.clase,
                    naturaleza: existing.naturaleza as 'debito' | 'credito',
                    grupo: existing.grupo,
                    cuenta: existing.cuenta,
                    subcuenta: existing.subcuenta,
                    descripcion: existing.descripcion,
                    activa: existing.activa,
                });
                setPucEditingCodigo(codigo);
            }
        } else {
            setPucFormData({ codigo: '', nombre: '', clase: 5, naturaleza: 'debito' });
            setPucEditingCodigo(null);
        }
        setPucModalOpen(true);
    };

    const handleClosePucModal = () => {
        setPucModalOpen(false);
        setPucEditingCodigo(null);
    };

    const handleDeletePuc = async (codigo: string) => {
        if (!window.confirm(`¿Desactivar cuenta PUC ${codigo}?`)) return;
        try {
            await deletePucMutation.mutateAsync(codigo);
            setPageToast({ text: 'Cuenta PUC desactivada', severity: 'success' });
        } catch {
            setPageToast({ text: 'Error al desactivar cuenta PUC', severity: 'error' });
        }
    };

    const handleSavePuc = async () => {
        try {
            if (pucEditingCodigo) {
                await updatePucMutation.mutateAsync({
                    codigo: pucEditingCodigo,
                    payload: pucFormData,
                });
            } else {
                await createPucMutation.mutateAsync(pucFormData);
            }
            const wasEditing = pucEditingCodigo !== null;
            handleClosePucModal();
            setPageToast({
                text: wasEditing ? 'Cuenta PUC actualizada' : 'Cuenta PUC creada',
                severity: 'success',
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al guardar PUC';
            setErrorMessage(msg);
            setPageToast({ text: msg, severity: 'error' });
        }
    };

    const handleSaveReteica = async () => {
        try {
            await upsertReteicaMutation.mutateAsync({
                municipio: reteicaForm.municipio,
                ciiu_seccion: reteicaForm.ciiu_seccion,
                tasa: Number(reteicaForm.tasa),
                fuente: reteicaForm.fuente || undefined,
                base_minima_uvt: reteicaForm.base_minima_uvt
                    ? Number(reteicaForm.base_minima_uvt)
                    : undefined,
            });
            setShowReteicaForm(false);
            setEditingReteicaId(null);
            setPageToast({ text: 'Tarifa ReteICA guardada', severity: 'success' });
        } catch {
            setPageToast({ text: 'Error al guardar tarifa ReteICA', severity: 'error' });
        }
    };

    const handleEditReteica = (row: ReteicaTarifa) => {
        setEditingReteicaId(row.id);
        setReteicaForm({
            municipio: row.municipio,
            ciiu_seccion: row.ciiu_seccion,
            tasa: String(row.tasa),
            fuente: row.fuente ?? '',
            base_minima_uvt: row.base_minima_uvt !== null ? String(row.base_minima_uvt) : '',
        });
        setShowReteicaForm(true);
    };

    const handleDeleteReteica = async (id: number) => {
        if (!window.confirm('¿Eliminar esta tarifa ReteICA? Esta acción no se puede deshacer.'))
            return;
        try {
            await deleteReteicaMutation.mutateAsync(id);
            setPageToast({ text: 'Tarifa eliminada', severity: 'success' });
        } catch {
            setPageToast({ text: 'Error al eliminar tarifa ReteICA', severity: 'error' });
        }
    };

    const handleEditConcept = (concept: TaxConcept) => {
        setEditingConceptCode(concept.code);
        setConceptForm({
            label: concept.label,
            renglon_350: concept.renglon_350,
            aplica_a: concept.aplica_a,
            categoria: concept.categoria,
            tarifa_default:
                concept.tarifa_default !== null ? String(concept.tarifa_default * 100) : '',
            base_minima_uvt:
                concept.base_minima_uvt !== null ? String(concept.base_minima_uvt) : '',
            art_referencia: concept.art_referencia ?? '',
            activo: concept.activo,
        });
    };

    const handleSaveConcept = async () => {
        if (!editingConceptCode) return;
        try {
            await upsertConceptMutation.mutateAsync({
                code: editingConceptCode,
                label: conceptForm.label,
                renglon_350: conceptForm.renglon_350,
                aplica_a: conceptForm.aplica_a,
                categoria: conceptForm.categoria,
                tarifa_default: conceptForm.tarifa_default
                    ? Number(conceptForm.tarifa_default) / 100
                    : undefined,
                base_minima_uvt: conceptForm.base_minima_uvt
                    ? Number(conceptForm.base_minima_uvt)
                    : undefined,
                art_referencia: conceptForm.art_referencia || undefined,
                activo: conceptForm.activo,
            });
            setEditingConceptCode(null);
            setPageToast({ text: 'Concepto de retención actualizado', severity: 'success' });
        } catch {
            setPageToast({ text: 'Error al actualizar concepto', severity: 'error' });
        }
    };

    const handleToggleConceptActivo = async (concept: TaxConcept) => {
        try {
            await upsertConceptMutation.mutateAsync({
                code: concept.code,
                label: concept.label,
                renglon_350: concept.renglon_350,
                aplica_a: concept.aplica_a,
                categoria: concept.categoria,
                tarifa_default: concept.tarifa_default ?? undefined,
                base_minima_uvt: concept.base_minima_uvt ?? undefined,
                art_referencia: concept.art_referencia ?? undefined,
                activo: !concept.activo,
            });
            setPageToast({
                text: concept.activo ? 'Concepto desactivado' : 'Concepto activado',
                severity: 'success',
            });
        } catch {
            setPageToast({ text: 'Error al cambiar estado del concepto', severity: 'error' });
        }
    };

    const isOnline = health?.status === 'ok';

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_9 // CONFIGURACIÓN"
                title={
                    <>
                        Ajustes
                        <br />
                        del sistema.
                    </>
                }
                subtitle="conexión · empresa · preferencias"
                lede="Configura la URL del backend, tarifas tributarias por empresa y Plan de Cuentas."
                accent={ACCENT}
                ghostNumber="9"
                action={
                    <BrutalistButton
                        accent={palette.chartreuse}
                        icon={<SaveIcon sx={{ fontSize: 18 }} />}
                        size="md"
                        onClick={handleSave}
                        loading={upsertMutation.isPending}
                    >
                        Guardar
                    </BrutalistButton>
                }
            />

            {saved && (
                <Box
                    sx={{
                        mb: 3,
                        p: 1.75,
                        border: `1px solid ${hexAlpha(palette.success, 0.4)}`,
                        bgcolor: hexAlpha(palette.success, 0.08),
                        borderRadius: 0.5,
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            bgcolor: palette.success,
                            borderRadius: '50%',
                            boxShadow: `0 0 8px ${palette.success}`,
                        }}
                    />
                    <Typography sx={{ ...sxLabelSmall, color: palette.success }}>
                        {'// GUARDADO'}
                    </Typography>
                    <Typography
                        sx={{ fontFamily: fonts.body, fontSize: '0.85rem', color: palette.paper }}
                    >
                        Configuración aplicada correctamente.
                    </Typography>
                </Box>
            )}

            {errorMessage && (
                <Box
                    sx={{
                        mb: 3,
                        p: 1.75,
                        border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        borderRadius: 0.5,
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                    }}
                >
                    <Typography sx={{ ...sxLabelSmall, color: palette.error, mt: 0.25 }}>
                        {'// ERROR'}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.85rem',
                            color: palette.paper,
                            flex: 1,
                        }}
                    >
                        {errorMessage}
                    </Typography>
                </Box>
            )}

            <Box sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
                <Grid container spacing={2.5}>
                    {/* API Connection */}
                    <Grid item xs={12} md={6}>
                        <CardShell
                            eyebrow="// API · CONEXIÓN"
                            title="Backend"
                            accent={palette.chartreuse}
                            icon={<ApiIcon sx={{ fontSize: 14 }} />}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <BrutalistField
                                    label="URL del backend"
                                    value={
                                        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                                    }
                                    helper="Configura en .env.local como NEXT_PUBLIC_API_URL"
                                    disabled
                                />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        py: 0.5,
                                    }}
                                >
                                    <Typography sx={{ ...sxLabelSmall, color: palette.paperFaint }}>
                                        ESTADO
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            px: 1,
                                            py: 0.4,
                                            border: `1px solid ${hexAlpha(isOnline ? palette.success : palette.error, 0.4)}`,
                                            bgcolor: hexAlpha(
                                                isOnline ? palette.success : palette.error,
                                                0.08
                                            ),
                                            borderRadius: 0.5,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 6,
                                                height: 6,
                                                bgcolor: isOnline ? palette.success : palette.error,
                                                borderRadius: '50%',
                                                boxShadow: `0 0 8px ${isOnline ? palette.success : palette.error}`,
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                color: isOnline ? palette.success : palette.error,
                                                letterSpacing: '0.18em',
                                            }}
                                        >
                                            {isOnline ? 'CONECTADO' : 'SIN_CONEXIÓN'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <BrutalistField
                                    label="NIT empresa"
                                    value={nit}
                                    onChange={setNit}
                                    maxLength={15}
                                    helper="Ingresa el NIT y carga datos para auto-llenar el formulario"
                                />
                                <Box>
                                    <BrutalistButton
                                        variant="outline"
                                        accent={palette.chartreuse}
                                        size="sm"
                                        onClick={handleLoadCompany}
                                        disabled={!nit}
                                        loading={isFetching}
                                    >
                                        {isFetching ? 'Cargando' : 'Cargar datos'}
                                    </BrutalistButton>
                                </Box>
                            </Box>
                        </CardShell>
                    </Grid>

                    {/* Company / Tax */}
                    <Grid item xs={12} md={6}>
                        <CardShell
                            eyebrow="// EMPRESA · TARIFAS"
                            title="Datos fiscales"
                            accent={palette.accent}
                            icon={<SecurityIcon sx={{ fontSize: 14 }} />}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <BrutalistField
                                    label="Razón social"
                                    value={nombre}
                                    onChange={setNombre}
                                    maxLength={200}
                                    accent={palette.accent}
                                />

                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                        gap: 2,
                                    }}
                                >
                                    <FormControl size="small" fullWidth>
                                        <InputLabel
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.7rem',
                                                letterSpacing: '0.12em',
                                                textTransform: 'uppercase',
                                                color: palette.paperFaint,
                                                '&.Mui-focused': { color: palette.accent },
                                            }}
                                        >
                                            Ciudad
                                        </InputLabel>
                                        <Select
                                            value={ciudad}
                                            label="Ciudad"
                                            onChange={(e) => setCiudad(e.target.value)}
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.9rem',
                                                borderRadius: 1,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.line,
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.lineStrong,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.accent,
                                                    borderWidth: 1,
                                                },
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em
                                                    style={{
                                                        fontFamily: fonts.mono,
                                                        fontSize: '0.8rem',
                                                    }}
                                                >
                                                    Sin especificar
                                                </em>
                                            </MenuItem>
                                            {ciudad && !municipios.includes(ciudad) && (
                                                <MenuItem value={ciudad}>
                                                    {ciudad.charAt(0).toUpperCase() +
                                                        ciudad.slice(1)}
                                                </MenuItem>
                                            )}
                                            {municipios.map((m) => (
                                                <MenuItem key={m} value={m}>
                                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <BrutalistField
                                        label="Código CIIU"
                                        value={codigoCiiu}
                                        onChange={setCodigoCiiu}
                                        placeholder="6201"
                                        accent={palette.accent}
                                    />
                                </Box>

                                <BrutalistSwitch
                                    label="Responsable de IVA"
                                    description="Aplica IVA 19% en facturación"
                                    checked={ivaResponsable}
                                    onChange={setIvaResponsable}
                                    accent={palette.accent}
                                />

                                <BrutalistSwitch
                                    label="Declarante de Renta"
                                    description="Tarifas reducidas de retención"
                                    checked={esDeclarante ?? false}
                                    onChange={setEsDeclarante}
                                    accent={palette.accent}
                                />

                                <Box sx={{ pt: 1 }}>
                                    <BrutalistButton
                                        variant="outline"
                                        accent={palette.accent}
                                        size="sm"
                                        onClick={handleAutoSetup}
                                        loading={setupMutation.isPending}
                                    >
                                        Setup automático · CIIU
                                    </BrutalistButton>
                                </Box>
                            </Box>
                        </CardShell>
                    </Grid>

                    {/* Tax Rates */}
                    <Grid item xs={12}>
                        <CardShell
                            eyebrow="// TARIFAS · COMPLETO"
                            title="Tasas tributarias"
                            accent={palette.amber}
                        >
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                                    gap: 2,
                                }}
                            >
                                <BrutalistField
                                    label="IVA General"
                                    value={tasaIva}
                                    onChange={setTasaIva}
                                    type="number"
                                    placeholder="0.19"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="Retefuente Servicios"
                                    value={tasaRetefuenteServicios}
                                    onChange={setTasaRetefuenteServicios}
                                    type="number"
                                    placeholder="0.04"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="Retefuente Bienes"
                                    value={tasaRetefuenteBienes}
                                    onChange={setTasaRetefuenteBienes}
                                    type="number"
                                    placeholder="0.025"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="Retefuente Arrendamiento"
                                    value={tasaRetefuenteArrendamiento}
                                    onChange={setTasaRetefuenteArrendamiento}
                                    type="number"
                                    placeholder="0.035"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="ReteICA"
                                    value={tasaReteica}
                                    onChange={setTasaReteica}
                                    type="number"
                                    placeholder="0.0069"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="ICA"
                                    value={tasaIca}
                                    onChange={setTasaIca}
                                    type="number"
                                    placeholder="0.0069"
                                    accent={palette.amber}
                                />
                                <BrutalistField
                                    label="Renta (PJ)"
                                    value={tasaRenta}
                                    onChange={setTasaRenta}
                                    type="number"
                                    placeholder="0.35"
                                    accent={palette.amber}
                                />
                            </Box>

                            {/* Régimen tributario + Actividad económica */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                    gap: 2,
                                    mt: 2,
                                    pt: 2,
                                    borderTop: `1px solid ${palette.line}`,
                                }}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.62rem',
                                            color: palette.paperFaint,
                                            letterSpacing: '0.22em',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                            mb: 0.75,
                                        }}
                                    >
                                        Régimen tributario
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={regimenTributario}
                                            onChange={(e) =>
                                                setRegimenTributario(
                                                    e.target.value as RegimenTributario
                                                )
                                            }
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.9rem',
                                                color: palette.paper,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.line,
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.lineStrong,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.amber,
                                                    borderWidth: 1,
                                                },
                                                '& .MuiSelect-icon': { color: palette.paperFaint },
                                                borderRadius: 1,
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: palette.inkSoft,
                                                        border: `1px solid ${palette.line}`,
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="ordinario">Ordinario</MenuItem>
                                            <MenuItem value="esal">ESAL</MenuItem>
                                            <MenuItem value="zona_franca">Zona Franca</MenuItem>
                                            <MenuItem value="rst">RST</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.62rem',
                                            color: palette.paperFaint,
                                            letterSpacing: '0.22em',
                                            textTransform: 'uppercase',
                                            fontWeight: 600,
                                            mb: 0.75,
                                        }}
                                    >
                                        Actividad económica
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={actividadEconomica}
                                            onChange={(e) =>
                                                setActividadEconomica(
                                                    e.target.value as ActividadEconomica
                                                )
                                            }
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.9rem',
                                                color: palette.paper,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.line,
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.lineStrong,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: palette.amber,
                                                    borderWidth: 1,
                                                },
                                                '& .MuiSelect-icon': { color: palette.paperFaint },
                                                borderRadius: 1,
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: palette.inkSoft,
                                                        border: `1px solid ${palette.line}`,
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem value="general">General</MenuItem>
                                            <MenuItem value="financiero">Financiero</MenuItem>
                                            <MenuItem value="hidroelectrico">
                                                Hidroeléctrico
                                            </MenuItem>
                                            <MenuItem value="otro">Otro</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            {/* Tarifa efectiva display */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    mt: 2,
                                    pt: 2,
                                    borderTop: `1px solid ${palette.line}`,
                                }}
                            >
                                <BrutalistButton
                                    accent={palette.amber}
                                    size="sm"
                                    loading={upsertMutation.isPending}
                                    onClick={handleSave}
                                >
                                    Guardar tasas
                                </BrutalistButton>
                            </Box>

                            {(() => {
                                const matched = tarifasCurrentYear.find(
                                    (t) =>
                                        t.regimen === regimenTributario &&
                                        (t.actividad === actividadEconomica || t.actividad === null)
                                );
                                if (!matched) return null;
                                const pct = `${(matched.tarifa_efectiva * 100).toFixed(0)}%`;
                                const legal = matched.base_legal ?? '';
                                return (
                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 1.5,
                                            border: `1px solid ${hexAlpha(palette.amber, 0.3)}`,
                                            borderRadius: 1,
                                            bgcolor: hexAlpha(palette.amber, 0.05),
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.72rem',
                                                color: palette.amber,
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Tarifa efectiva {currentYear}: {pct}
                                            {legal ? ` (${legal})` : ''}
                                        </Typography>
                                    </Box>
                                );
                            })()}
                        </CardShell>
                    </Grid>

                    {/* PUC */}
                    <Grid item xs={12}>
                        <CardShell eyebrow="// PLAN DE CUENTAS" title="PUC" accent={palette.pink}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end' }}>
                                <Box sx={{ flex: 1 }}>
                                    <BrutalistField
                                        label="Buscar"
                                        value={pucSearchTerm}
                                        onChange={setPucSearchTerm}
                                        placeholder="Código o nombre"
                                        accent={palette.pink}
                                    />
                                </Box>
                                <BrutalistButton
                                    accent={palette.pink}
                                    icon={<AddIcon sx={{ fontSize: 16 }} />}
                                    size="sm"
                                    onClick={() => handleOpenPucModal()}
                                >
                                    Nueva
                                </BrutalistButton>
                            </Box>

                            {pucLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '1px',
                                            bgcolor: palette.lineFaint,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            color: palette.paperGhost,
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {'// CARGANDO'}
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '1px',
                                            bgcolor: palette.lineFaint,
                                        }}
                                    />
                                </Box>
                            ) : pucList.length > 0 ? (
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow
                                                sx={{ borderBottom: `1px solid ${palette.line}` }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Código
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Nombre
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Clase
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Naturaleza
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Activa
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: palette.paper,
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                    }}
                                                    align="right"
                                                >
                                                    Acción
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pucList.map((puc) => (
                                                <TableRow
                                                    key={puc.codigo}
                                                    sx={{
                                                        borderBottom: `1px solid ${palette.lineFaint}`,
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            color: palette.paper,
                                                            fontSize: '0.8rem',
                                                            fontFamily: fonts.mono,
                                                        }}
                                                    >
                                                        {puc.codigo}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: palette.paper,
                                                            fontSize: '0.8rem',
                                                        }}
                                                    >
                                                        {puc.nombre}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: palette.paperGhost,
                                                            fontSize: '0.8rem',
                                                        }}
                                                    >
                                                        {puc.clase}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: palette.paperGhost,
                                                            fontSize: '0.8rem',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {puc.naturaleza}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: puc.activa
                                                                ? palette.success
                                                                : palette.error,
                                                            fontSize: '0.8rem',
                                                        }}
                                                    >
                                                        {puc.activa ? '✓' : '✗'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                gap: 0.5,
                                                                justifyContent: 'flex-end',
                                                            }}
                                                        >
                                                            <BrutalistButton
                                                                variant="ghost"
                                                                accent={palette.pink}
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleOpenPucModal(puc.codigo)
                                                                }
                                                            >
                                                                <EditIcon sx={{ fontSize: 14 }} />
                                                            </BrutalistButton>
                                                            {puc.activa && (
                                                                <BrutalistButton
                                                                    variant="ghost"
                                                                    accent={palette.error}
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDeletePuc(puc.codigo)
                                                                    }
                                                                >
                                                                    <DeleteIcon
                                                                        sx={{ fontSize: 14 }}
                                                                    />
                                                                </BrutalistButton>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            ) : (
                                <Typography
                                    sx={{
                                        color: palette.paperGhost,
                                        fontSize: '0.85rem',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {'// NO_RESULTS'}
                                </Typography>
                            )}
                        </CardShell>
                    </Grid>

                    {/* Account security — change password */}
                    <Grid item xs={12} md={6}>
                        <PasswordUpdateCard />
                    </Grid>

                    {/* Tax Constants — UVT + Base Mínima */}
                    <Grid item xs={12} md={6}>
                        <TaxConstantsCard />
                    </Grid>

                    {/* Pérdidas Fiscales Acumuladas — Art. 147 ET */}
                    <Grid item xs={12} md={6}>
                        <PerdidasFiscalesCard />
                    </Grid>

                    {/* Tarifas de Renta (Regulatorias) */}
                    <Grid item xs={12} md={6}>
                        <TarifasRentaCard />
                    </Grid>

                    {/* System Info */}
                    <Grid item xs={12} md={6}>
                        <CardShell
                            eyebrow="// SISTEMA · BUILD"
                            title="Información"
                            accent={palette.amber}
                            icon={<InfoIcon sx={{ fontSize: 14 }} />}
                        >
                            <Box>
                                {[
                                    { label: 'Frontend', value: 'Next.js 14 · App Router' },
                                    { label: 'UI Library', value: 'MUI v5 + brutalist' },
                                    { label: 'Estado', value: 'TanStack Query v5' },
                                    { label: 'Backend', value: 'FastAPI · Python 3.11' },
                                    { label: 'Agentes', value: 'LangGraph multi-agent' },
                                    { label: 'Versión', value: 'v0.1.0' },
                                ].map((row, i) => (
                                    <Box
                                        key={row.label}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 1,
                                            borderTop:
                                                i === 0 ? 'none' : `1px solid ${palette.lineFaint}`,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.65rem',
                                                color: palette.paperFaint,
                                                letterSpacing: '0.18em',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {row.label}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.78rem',
                                                color: palette.paper,
                                                fontWeight: 600,
                                                letterSpacing: '0.02em',
                                            }}
                                        >
                                            {row.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardShell>
                    </Grid>

                    {/* Bottom save button */}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                mt: 2,
                                pt: 3,
                                borderTop: `1px solid ${palette.line}`,
                            }}
                        >
                            <BrutalistButton
                                accent={palette.chartreuse}
                                icon={<SaveIcon sx={{ fontSize: 18 }} />}
                                size="lg"
                                onClick={handleSave}
                                loading={upsertMutation.isPending}
                            >
                                Guardar cambios
                            </BrutalistButton>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* ── ReteICA Municipal Tarifas ── */}
            <Box sx={{ mt: 6 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                    }}
                >
                    <Typography sx={{ ...sxLabelSmall, color: ACCENT }}>
                        {'// TARIFAS RETEICA MUNICIPALES'}
                    </Typography>
                    <BrutalistButton
                        size="sm"
                        onClick={() => {
                            setReteicaForm({
                                municipio: '',
                                ciiu_seccion: 'general',
                                tasa: '',
                                fuente: '',
                                base_minima_uvt: '4',
                            });
                            setEditingReteicaId(null);
                            setShowReteicaForm(true);
                        }}
                        variant="outline"
                        accent={ACCENT}
                    >
                        + AGREGAR TARIFA
                    </BrutalistButton>
                </Box>

                {showReteicaForm && (
                    <Box
                        sx={{
                            border: `1px solid ${ACCENT}`,
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            display: 'flex',
                            gap: 1.5,
                            flexWrap: 'wrap',
                        }}
                    >
                        <BrutalistField
                            label="Municipio"
                            value={reteicaForm.municipio}
                            onChange={(v) => setReteicaForm((f) => ({ ...f, municipio: v }))}
                            placeholder="bogota"
                            accent={ACCENT}
                        />
                        <BrutalistField
                            label="Sección CIIU"
                            value={reteicaForm.ciiu_seccion}
                            onChange={(v) => setReteicaForm((f) => ({ ...f, ciiu_seccion: v }))}
                            placeholder="J"
                            accent={ACCENT}
                        />
                        <BrutalistField
                            label="Tasa (decimal)"
                            value={reteicaForm.tasa}
                            onChange={(v) => setReteicaForm((f) => ({ ...f, tasa: v }))}
                            placeholder="0.00966"
                            type="number"
                            accent={ACCENT}
                        />
                        <BrutalistField
                            label="Base mínima UVT"
                            value={reteicaForm.base_minima_uvt}
                            onChange={(v) => setReteicaForm((f) => ({ ...f, base_minima_uvt: v }))}
                            placeholder="4"
                            type="number"
                            accent={ACCENT}
                        />
                        <BrutalistField
                            label="Fuente"
                            value={reteicaForm.fuente}
                            onChange={(v) => setReteicaForm((f) => ({ ...f, fuente: v }))}
                            placeholder="Acuerdo 065 Bogotá 2016"
                            accent={ACCENT}
                        />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                            <BrutalistButton
                                size="sm"
                                variant="outline"
                                accent={ACCENT}
                                onClick={handleSaveReteica}
                                disabled={!reteicaForm.municipio || !reteicaForm.tasa}
                            >
                                GUARDAR
                            </BrutalistButton>
                            <BrutalistButton
                                size="sm"
                                variant="ghost"
                                accent={palette.paperFaint}
                                onClick={() => setShowReteicaForm(false)}
                            >
                                CANCELAR
                            </BrutalistButton>
                        </Box>
                    </Box>
                )}

                {reteicaLoading ? (
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                ) : !reteicaTarifas || reteicaTarifas.length === 0 ? (
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperFaint }}>
                        {'// SIN TARIFAS REGISTRADAS'}
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Municipio', 'CIIU', 'Tasa', 'Base Mín UVT', 'Fuente', ''].map(
                                    (h) => (
                                        <TableCell
                                            key={h}
                                            sx={{
                                                ...sxLabelSmall,
                                                color: palette.paperFaint,
                                                borderColor: palette.line,
                                            }}
                                        >
                                            {h}
                                        </TableCell>
                                    )
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(reteicaTarifas as ReteicaTarifa[]).map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell
                                        sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                    >
                                        {row.municipio}
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                    >
                                        {row.ciiu_seccion}
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                    >
                                        {(row.tasa * 100).toFixed(3)}%
                                    </TableCell>
                                    <TableCell sx={{ color: palette.paper }}>
                                        {row.base_minima_uvt ?? '—'} UVT
                                    </TableCell>
                                    <TableCell
                                        sx={{ color: palette.paperFaint, fontSize: '0.8rem' }}
                                    >
                                        {row.fuente ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <BrutalistButton
                                                size="sm"
                                                variant="ghost"
                                                accent={palette.accent}
                                                onClick={() => handleEditReteica(row)}
                                            >
                                                EDITAR
                                            </BrutalistButton>
                                            <BrutalistButton
                                                size="sm"
                                                variant="outline"
                                                accent={palette.error}
                                                onClick={() => handleDeleteReteica(row.id)}
                                            >
                                                ELIMINAR
                                            </BrutalistButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>

            {/* ── TaxConcepts (F350 catalog) ── */}
            <Box sx={{ mt: 6 }}>
                <Typography sx={{ ...sxLabelSmall, color: ACCENT, mb: 2 }}>
                    {'// CONCEPTOS DE RETENCIÓN F350'}
                </Typography>

                {conceptsLoading ? (
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                ) : !taxConcepts || taxConcepts.length === 0 ? (
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperFaint }}>
                        {'// SIN CONCEPTOS'}
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {[
                                    'Renglón',
                                    'Código',
                                    'Descripción',
                                    'Aplica a',
                                    'Tarifa %',
                                    'Base UVT',
                                    'Estado',
                                    '',
                                ].map((h) => (
                                    <TableCell
                                        key={h}
                                        sx={{
                                            ...sxLabelSmall,
                                            color: palette.paperFaint,
                                            borderColor: palette.line,
                                        }}
                                    >
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(taxConcepts as TaxConcept[]).map((concept) => (
                                <React.Fragment key={concept.code}>
                                    <TableRow sx={{ opacity: concept.activo ? 1 : 0.5 }}>
                                        <TableCell
                                            sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                        >
                                            {concept.renglon_350}
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                        >
                                            {concept.code}
                                        </TableCell>
                                        <TableCell sx={{ color: palette.paper }}>
                                            {concept.label}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: palette.paperFaint,
                                                fontFamily: fonts.mono,
                                            }}
                                        >
                                            {concept.aplica_a}
                                        </TableCell>
                                        <TableCell
                                            sx={{ color: palette.paper, fontFamily: fonts.mono }}
                                        >
                                            {concept.tarifa_default !== null
                                                ? `${(concept.tarifa_default * 100).toFixed(1)}%`
                                                : '—'}
                                        </TableCell>
                                        <TableCell sx={{ color: palette.paper }}>
                                            {concept.base_minima_uvt !== null
                                                ? `${concept.base_minima_uvt} UVT`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                size="small"
                                                checked={concept.activo}
                                                onChange={() => handleToggleConceptActivo(concept)}
                                                sx={{
                                                    '& .MuiSwitch-thumb': {
                                                        bgcolor: concept.activo
                                                            ? ACCENT
                                                            : palette.paperFaint,
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <BrutalistButton
                                                size="sm"
                                                variant="outline"
                                                accent={ACCENT}
                                                onClick={() => handleEditConcept(concept)}
                                            >
                                                EDITAR
                                            </BrutalistButton>
                                        </TableCell>
                                    </TableRow>
                                    {editingConceptCode === concept.code && (
                                        <TableRow>
                                            <TableCell colSpan={8}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 1.5,
                                                        flexWrap: 'wrap',
                                                        p: 1,
                                                        border: `1px solid ${ACCENT}`,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <BrutalistField
                                                        label="Descripción"
                                                        value={conceptForm.label}
                                                        onChange={(v) =>
                                                            setConceptForm((f) => ({
                                                                ...f,
                                                                label: v,
                                                            }))
                                                        }
                                                        accent={ACCENT}
                                                    />
                                                    <BrutalistField
                                                        label="Tarifa %"
                                                        value={conceptForm.tarifa_default}
                                                        onChange={(v) =>
                                                            setConceptForm((f) => ({
                                                                ...f,
                                                                tarifa_default: v,
                                                            }))
                                                        }
                                                        type="number"
                                                        placeholder="2.5"
                                                        accent={ACCENT}
                                                    />
                                                    <BrutalistField
                                                        label="Base mín UVT"
                                                        value={conceptForm.base_minima_uvt}
                                                        onChange={(v) =>
                                                            setConceptForm((f) => ({
                                                                ...f,
                                                                base_minima_uvt: v,
                                                            }))
                                                        }
                                                        type="number"
                                                        placeholder="27"
                                                        accent={ACCENT}
                                                    />
                                                    <BrutalistField
                                                        label="Art. referencia"
                                                        value={conceptForm.art_referencia}
                                                        onChange={(v) =>
                                                            setConceptForm((f) => ({
                                                                ...f,
                                                                art_referencia: v,
                                                            }))
                                                        }
                                                        placeholder="Art. 392 ET"
                                                        accent={ACCENT}
                                                    />
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 1,
                                                            alignItems: 'flex-end',
                                                        }}
                                                    >
                                                        <BrutalistButton
                                                            size="sm"
                                                            variant="outline"
                                                            accent={ACCENT}
                                                            onClick={handleSaveConcept}
                                                        >
                                                            GUARDAR
                                                        </BrutalistButton>
                                                        <BrutalistButton
                                                            size="sm"
                                                            variant="ghost"
                                                            accent={palette.paperFaint}
                                                            onClick={() =>
                                                                setEditingConceptCode(null)
                                                            }
                                                        >
                                                            CANCELAR
                                                        </BrutalistButton>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>

            {/* Page-level toast — green confirms a DB write, red surfaces a failure */}
            <Snackbar
                open={!!pageToast}
                autoHideDuration={3000}
                onClose={() => setPageToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setPageToast(null)}
                    severity={pageToast?.severity ?? 'success'}
                    sx={{
                        bgcolor: hexAlpha(
                            pageToast?.severity === 'error' ? palette.error : palette.success,
                            0.15
                        ),
                        border: `1px solid ${hexAlpha(
                            pageToast?.severity === 'error' ? palette.error : palette.success,
                            0.4
                        )}`,
                        color: pageToast?.severity === 'error' ? palette.error : palette.success,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        '& .MuiAlert-icon': {
                            color:
                                pageToast?.severity === 'error' ? palette.error : palette.success,
                        },
                    }}
                >
                    {pageToast?.text}
                </Alert>
            </Snackbar>

            {/* PUC Modal */}
            <Dialog
                open={pucModalOpen}
                onClose={handleClosePucModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: palette.ink,
                        border: `1px solid ${palette.line}`,
                    },
                }}
            >
                <DialogTitle sx={{ color: palette.paper, fontWeight: 700 }}>
                    {pucEditingCodigo ? 'Editar PUC' : 'Nueva PUC'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                    <BrutalistField
                        label="Código"
                        value={pucFormData.codigo}
                        onChange={(v) => setPucFormData({ ...pucFormData, codigo: v })}
                        disabled={!!pucEditingCodigo}
                        accent={palette.pink}
                    />
                    <BrutalistField
                        label="Nombre"
                        value={pucFormData.nombre}
                        onChange={(v) => setPucFormData({ ...pucFormData, nombre: v })}
                        accent={palette.pink}
                    />
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: palette.paperFaint,
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 0.75,
                            }}
                        >
                            Clase
                        </Typography>
                        <Select
                            value={pucFormData.clase}
                            onChange={(e) =>
                                setPucFormData({ ...pucFormData, clase: e.target.value as number })
                            }
                            fullWidth
                            size="small"
                            sx={{
                                bgcolor: hexAlpha(palette.paper, 0.03),
                                color: palette.paper,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.line },
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6].map((c) => (
                                <MenuItem key={c} value={c}>
                                    {c === 1
                                        ? 'Activo'
                                        : c === 2
                                          ? 'Pasivo'
                                          : c === 3
                                            ? 'Patrimonio'
                                            : c === 4
                                              ? 'Ingreso'
                                              : c === 5
                                                ? 'Gasto'
                                                : 'Costo'}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: palette.paperFaint,
                                letterSpacing: '0.22em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                mb: 0.75,
                            }}
                        >
                            Naturaleza
                        </Typography>
                        <Select
                            value={pucFormData.naturaleza}
                            onChange={(e) =>
                                setPucFormData({
                                    ...pucFormData,
                                    naturaleza: e.target.value as 'debito' | 'credito',
                                })
                            }
                            fullWidth
                            size="small"
                            sx={{
                                bgcolor: hexAlpha(palette.paper, 0.03),
                                color: palette.paper,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.line },
                            }}
                        >
                            <MenuItem value="debito">Débito</MenuItem>
                            <MenuItem value="credito">Crédito</MenuItem>
                        </Select>
                    </Box>
                    <BrutalistField
                        label="Grupo (opcional)"
                        value={pucFormData.grupo || ''}
                        onChange={(v) => setPucFormData({ ...pucFormData, grupo: v })}
                        accent={palette.pink}
                    />
                    <BrutalistField
                        label="Cuenta (opcional)"
                        value={pucFormData.cuenta || ''}
                        onChange={(v) => setPucFormData({ ...pucFormData, cuenta: v })}
                        accent={palette.pink}
                    />
                    <BrutalistField
                        label="Subcuenta (opcional)"
                        value={pucFormData.subcuenta || ''}
                        onChange={(v) => setPucFormData({ ...pucFormData, subcuenta: v })}
                        accent={palette.pink}
                    />
                    <BrutalistField
                        label="Descripción (opcional)"
                        value={pucFormData.descripcion || ''}
                        onChange={(v) => setPucFormData({ ...pucFormData, descripcion: v })}
                        accent={palette.pink}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <BrutalistButton
                        variant="outline"
                        accent={palette.pink}
                        size="sm"
                        onClick={handleClosePucModal}
                    >
                        Cancelar
                    </BrutalistButton>
                    <BrutalistButton
                        accent={palette.pink}
                        size="sm"
                        onClick={handleSavePuc}
                        loading={createPucMutation.isPending || updatePucMutation.isPending}
                    >
                        Guardar
                    </BrutalistButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
