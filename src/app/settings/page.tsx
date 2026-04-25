'use client';

import { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Typography,
    Switch,
    TextField,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
    Wifi as ApiIcon,
    Notifications as NotifIcon,
    Security as SecurityIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { palette, fonts, motion, sxLabelSmall, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import {
    useCompanySettings,
    useSetupCompanySettings,
    useUpsertCompanySettings,
} from '@/hooks/useSettings';

const ACCENT = moduleAccents.settings;

// ---------------------------------------------------------------------------
// Brutalist text field — wraps MUI TextField with our tokens
// ---------------------------------------------------------------------------

interface BrutalistFieldProps {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    helper?: string;
    disabled?: boolean;
    accent?: string;
}

function BrutalistField({
    label,
    value,
    onChange,
    placeholder,
    helper,
    disabled = false,
    accent = palette.chartreuse,
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

// ---------------------------------------------------------------------------
// Brutalist switch row
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Brutalist card shell
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
    const { data: health } = useHealthCheck();
    const [nit, setNit] = useState('900123456');
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [codigoCiiu, setCodigoCiiu] = useState('');
    const [ivaResponsable, setIvaResponsable] = useState(true);
    const [tasaReteica, setTasaReteica] = useState('0.0069');
    const [settingsLookupEnabled, setSettingsLookupEnabled] = useState(false);

    const { data: companySettings, isFetching } = useCompanySettings(
        nit,
        settingsLookupEnabled && !!nit
    );
    const setupMutation = useSetupCompanySettings();
    const upsertMutation = useUpsertCompanySettings();

    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState({ vencimientos: true, errores: true, procesados: false });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!companySettings) return;
        setNombre(companySettings.nombre || '');
        setCiudad(companySettings.ciudad || '');
        setCodigoCiiu(companySettings.codigo_ciiu || '');
        setIvaResponsable(companySettings.iva_responsable);
        setTasaReteica(String(companySettings.tasa_reteica));
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
                    tasa_retefuente_servicios: 0.11,
                    tasa_retefuente_bienes: 0.03,
                    tasa_retefuente_arrendamiento: 0.10,
                    tasa_reteica: Number(tasaReteica) || 0.0069,
                    tasa_iva_general: ivaResponsable ? 0.19 : 0,
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
            setTasaReteica(String(result.tasa_reteica));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo ejecutar el setup automático';
            setErrorMessage(msg);
        }
    };

    const isOnline = health?.status === 'ok';

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_08 // CONFIGURACIÓN"
                title={<>Ajustes<br />del sistema.</>}
                subtitle="conexión · empresa · preferencias"
                lede="Configura la URL del backend, tarifas tributarias por empresa y preferencias generales del sistema."
                accent={ACCENT}
                ghostNumber="08"
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
                    <Box sx={{ width: 8, height: 8, bgcolor: palette.success, borderRadius: '50%', boxShadow: `0 0 8px ${palette.success}` }} />
                    <Typography sx={{ ...sxLabelSmall, color: palette.success }}>{'// GUARDADO'}</Typography>
                    <Typography sx={{ fontFamily: fonts.body, fontSize: '0.85rem', color: palette.paper }}>
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
                    <Typography sx={{ ...sxLabelSmall, color: palette.error, mt: 0.25 }}>{'// ERROR'}</Typography>
                    <Typography sx={{ fontFamily: fonts.body, fontSize: '0.85rem', color: palette.paper, flex: 1 }}>
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

                            {/* Status row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                                <Typography sx={{ ...sxLabelSmall, color: palette.paperFaint }}>ESTADO</Typography>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        px: 1,
                                        py: 0.4,
                                        border: `1px solid ${hexAlpha(isOnline ? palette.success : palette.error, 0.4)}`,
                                        bgcolor: hexAlpha(isOnline ? palette.success : palette.error, 0.08),
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
                            <BrutalistField label="Razón social" value={nombre} onChange={setNombre} accent={palette.accent} />

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

                            <BrutalistField
                                label="Tasa ReteICA"
                                value={tasaReteica}
                                onChange={setTasaReteica}
                                helper="Ej. 0.0069 = 6.9‰ (Bogotá PYMES)"
                                accent={palette.accent}
                            />

                            <Box sx={{ pt: 1 }}>
                                <BrutalistSwitch
                                    label="Responsable de IVA"
                                    description="Aplica IVA 19% en facturación"
                                    checked={ivaResponsable}
                                    onChange={setIvaResponsable}
                                    accent={palette.accent}
                                />
                            </Box>

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
                                onChange={(v) => setNotifications((n) => ({ ...n, vencimientos: v }))}
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
                                        borderTop: i === 0 ? 'none' : `1px solid ${palette.lineFaint}`,
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

                {/* Bottom save action (also visible at top) */}
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
                            subLabel="POST /settings/company/{nit}"
                        >
                            Guardar cambios
                        </BrutalistButton>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
