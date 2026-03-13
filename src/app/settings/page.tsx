'use client';

import {
    Box,
    Grid,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Chip,
    Divider,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
    Wifi as ApiIcon,
    Notifications as NotifIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import { useEffect, useState } from 'react';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import {
    useCompanySettings,
    useSetupCompanySettings,
    useUpsertCompanySettings,
} from '@/hooks/useSettings';

interface SettingSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function SettingSection({ title, icon, children }: SettingSectionProps) {
    return (
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color: 'primary.main' }}>{icon}</Box>
                <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {children}
        </Paper>
    );
}

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

    const handleLoadCompany = () => {
        setSettingsLookupEnabled(true);
    };

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
            const message = err instanceof Error ? err.message : 'No se pudo guardar la configuración';
            setErrorMessage(message);
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
            const message = err instanceof Error ? err.message : 'No se pudo ejecutar el setup automático';
            setErrorMessage(message);
        }
    };

    return (
        <Box>
            <PageHeader
                title="Configuración"
                subtitle="Ajustes generales, conexión con el backend y preferencias del sistema."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Configuración' }]}
            />

            {saved && (
                <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                    Configuración guardada correctamente.
                </Alert>
            )}

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                    {/* API Connection */}
                    <SettingSection title="Conexión Backend" icon={<ApiIcon fontSize="small" />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                                size="small"
                                label="URL del backend"
                                defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                                helperText="Configura en .env.local como NEXT_PUBLIC_API_URL"
                                disabled
                                fullWidth
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">Estado:</Typography>
                                <Chip
                                    size="small"
                                    label={health?.status === 'ok' ? 'Conectado' : 'Sin conexión'}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        fontWeight: 600,
                                        bgcolor: health?.status === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                        color: health?.status === 'ok' ? 'success.main' : 'error.main',
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    size="small"
                                    label="NIT"
                                    value={nit}
                                    onChange={(e) => setNit(e.target.value)}
                                    sx={{ maxWidth: 220 }}
                                />
                                <Button size="small" variant="outlined" onClick={handleLoadCompany} disabled={!nit || isFetching}>
                                    {isFetching ? 'Cargando...' : 'Cargar datos'}
                                </Button>
                            </Box>
                        </Box>
                    </SettingSection>

                    {/* Security */}
                    <SettingSection title="Seguridad" icon={<SecurityIcon fontSize="small" />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                                size="small"
                                label="Nombre de la empresa"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                size="small"
                                label="Ciudad"
                                value={ciudad}
                                onChange={(e) => setCiudad(e.target.value)}
                                placeholder="Bogotá"
                                fullWidth
                            />
                            <TextField
                                size="small"
                                label="Código CIIU"
                                value={codigoCiiu}
                                onChange={(e) => setCodigoCiiu(e.target.value)}
                                placeholder="6201"
                                fullWidth
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={ivaResponsable}
                                        onChange={(e) => setIvaResponsable(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">Responsable de IVA</Typography>}
                            />
                            <TextField
                                size="small"
                                label="Tasa ReteICA"
                                value={tasaReteica}
                                onChange={(e) => setTasaReteica(e.target.value)}
                                helperText="Ejemplo: 0.0069"
                                fullWidth
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleAutoSetup}
                                disabled={setupMutation.isPending}
                            >
                                {setupMutation.isPending ? 'Calculando...' : 'Setup automático (ciudad + CIIU)'}
                            </Button>
                        </Box>
                    </SettingSection>
                </Grid>

                <Grid item xs={12} md={6}>
                    {/* Notifications */}
                    <SettingSection title="Notificaciones" icon={<NotifIcon fontSize="small" />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.vencimientos}
                                        onChange={(e) => setNotifications((n) => ({ ...n, vencimientos: e.target.checked }))}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">Alertas de vencimientos fiscales</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.errores}
                                        onChange={(e) => setNotifications((n) => ({ ...n, errores: e.target.checked }))}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">Errores en el pipeline de agentes</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.procesados}
                                        onChange={(e) => setNotifications((n) => ({ ...n, procesados: e.target.checked }))}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">Documentos procesados exitosamente</Typography>}
                            />
                        </Box>
                    </SettingSection>

                    {/* System info */}
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Información del sistema</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        {[
                            { label: 'Frontend', value: 'Next.js 14 (App Router)' },
                            { label: 'UI Library', value: 'MUI v5' },
                            { label: 'Estado', value: 'TanStack Query v5' },
                            { label: 'Backend', value: 'FastAPI (Python)' },
                            { label: 'Agentes', value: 'LangGraph multi-agent' },
                            { label: 'Versión', value: 'v1.0.0-beta' },
                        ].map((row) => (
                            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                                <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{row.value}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={upsertMutation.isPending}
                            size="large"
                            id="btn-save-settings"
                            sx={{ px: 4 }}
                        >
                            {upsertMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
