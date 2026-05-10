'use client';

import { useEffect, useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Save as SaveIcon,
    Wifi as ApiIcon,
    Notifications as NotifIcon,
    Security as SecurityIcon,
    Info as InfoIcon,
    Add as AddIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { palette, fonts, motion, sxLabelSmall, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import {
    useCompanySettings,
    useSetupCompanySettings,
    useUpsertCompanySettings,
} from '@/hooks/useSettings';
import { usePucList, useCreatePuc, useUpdatePuc } from '@/hooks/usePuc';
import type { CuentaPUCRequest } from '@/types/api';
import { createClient } from '@/lib/supabase/client';

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

// Main page
export default function SettingsPage() {
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
    const [settingsLookupEnabled, setSettingsLookupEnabled] = useState(false);
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState({
        vencimientos: true,
        errores: true,
        procesados: false,
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const { data: companySettings, isFetching } = useCompanySettings(
        nit,
        settingsLookupEnabled && !!nit
    );
    const setupMutation = useSetupCompanySettings();
    const upsertMutation = useUpsertCompanySettings();
    const { data: pucList = [], isLoading: pucLoading } = usePucList({
        search: pucSearchTerm,
        limit: 200,
    });
    const createPucMutation = useCreatePuc();
    const updatePucMutation = useUpdatePuc();

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
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo guardar la configuración';
            setErrorMessage(msg);
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
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'No se pudo ejecutar el setup automático';
            setErrorMessage(msg);
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
            handleClosePucModal();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al guardar PUC';
            setErrorMessage(msg);
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
                                value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                                helper="Configura en .env.local como NEXT_PUBLIC_API_URL"
                                disabled
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
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
                                accent={palette.accent}
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <BrutalistField
                                    label="Ciudad"
                                    value={ciudad}
                                    onChange={setCiudad}
                                    placeholder="Bogotá"
                                    accent={palette.accent}
                                />
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
                                                    <BrutalistButton
                                                        variant="outline"
                                                        accent={palette.pink}
                                                        icon={<EditIcon sx={{ fontSize: 14 }} />}
                                                        size="sm"
                                                        onClick={() =>
                                                            handleOpenPucModal(puc.codigo)
                                                        }
                                                    >
                                                        Editar
                                                    </BrutalistButton>
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

                {/* Notifications */}
                <Grid item xs={12} md={6}>
                    <CardShell
                        eyebrow="// NOTIFICACIONES"
                        title="Alertas"
                        accent={palette.pink}
                        icon={<NotifIcon sx={{ fontSize: 14 }} />}
                    >
                        <Box>
                            <BrutalistSwitch
                                label="Alertas de vencimientos fiscales"
                                description="IVA, retefuente, ICA, renta"
                                checked={notifications.vencimientos}
                                onChange={(v) =>
                                    setNotifications((n) => ({ ...n, vencimientos: v }))
                                }
                                accent={palette.pink}
                            />
                            <BrutalistSwitch
                                label="Errores en el pipeline"
                                description="Cuando un agente rechaza una transacción"
                                checked={notifications.errores}
                                onChange={(v) => setNotifications((n) => ({ ...n, errores: v }))}
                                accent={palette.pink}
                            />
                            <BrutalistSwitch
                                label="Documentos procesados"
                                description="Confirmación cuando una transacción queda POSTED"
                                checked={notifications.procesados}
                                onChange={(v) => setNotifications((n) => ({ ...n, procesados: v }))}
                                accent={palette.pink}
                            />
                        </Box>
                    </CardShell>
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
