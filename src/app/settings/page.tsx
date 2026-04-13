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
    Receipt as TaxIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import { useEffect, useState } from 'react';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import {
    useCompanySettings,
    useSetupCompanySettings,
    useUpsertCompanySettings,
} from '@/hooks/useSettings';
import { useCompany } from '@/context/CompanyContext';

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

type TaxRateKey =
    | 'tasa_retefuente_servicios'
    | 'tasa_retefuente_bienes'
    | 'tasa_retefuente_arrendamiento'
    | 'tasa_reteica'
    | 'tasa_iva_general'
    | 'tasa_ica'
    | 'tasa_renta';

type TaxRates = Record<TaxRateKey, string>;

interface TaxFieldConfig {
    key: TaxRateKey;
    label: string;
    helperText: string;
    step: string;
}

const RETEFUENTE_FIELDS: TaxFieldConfig[] = [
    { key: 'tasa_retefuente_servicios', label: 'Retefuente servicios', helperText: 'Art. 383 ET', step: '0.01' },
    { key: 'tasa_retefuente_bienes', label: 'Retefuente compra de bienes', helperText: 'Art. 401 ET', step: '0.01' },
    { key: 'tasa_retefuente_arrendamiento', label: 'Retefuente arrendamientos', helperText: 'Art. 401 ET', step: '0.01' },
];

const ICA_FIELDS: TaxFieldConfig[] = [
    { key: 'tasa_reteica', label: 'Tasa ReteICA', helperText: 'Varía por municipio/CIIU', step: '0.0001' },
    { key: 'tasa_ica', label: 'Tasa ICA', helperText: 'Ley 14/1983', step: '0.0001' },
];

function taxRatesFromCompany(company: {
    tasa_retefuente_servicios: number;
    tasa_retefuente_bienes: number;
    tasa_retefuente_arrendamiento: number;
    tasa_reteica: number;
    tasa_iva_general: number;
    tasa_ica: number;
    tasa_renta: number;
}): TaxRates {
    return {
        tasa_retefuente_servicios: String(company.tasa_retefuente_servicios),
        tasa_retefuente_bienes: String(company.tasa_retefuente_bienes),
        tasa_retefuente_arrendamiento: String(company.tasa_retefuente_arrendamiento),
        tasa_reteica: String(company.tasa_reteica),
        tasa_iva_general: String(company.tasa_iva_general),
        tasa_ica: String(company.tasa_ica),
        tasa_renta: String(company.tasa_renta),
    };
}

const EMPTY_TAX_RATES: TaxRates = {
    tasa_retefuente_servicios: '',
    tasa_retefuente_bienes: '',
    tasa_retefuente_arrendamiento: '',
    tasa_reteica: '',
    tasa_iva_general: '',
    tasa_ica: '',
    tasa_renta: '',
};

export default function SettingsPage() {
    const { data: health } = useHealthCheck();
    const { activeCompany, activeNit } = useCompany();

    const [nit, setNit] = useState('');
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [codigoCiiu, setCodigoCiiu] = useState('');
    const [ivaResponsable, setIvaResponsable] = useState(true);
    const [taxRates, setTaxRates] = useState<TaxRates>(EMPTY_TAX_RATES);
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

    // Populate form from active company on mount
    useEffect(() => {
        if (!activeCompany) return;
        setNit(activeCompany.nit);
        setNombre(activeCompany.nombre || '');
        setCiudad(activeCompany.ciudad || '');
        setCodigoCiiu(activeCompany.codigo_ciiu || '');
        setIvaResponsable(activeCompany.iva_responsable);
        setTaxRates(taxRatesFromCompany(activeCompany));
    }, [activeCompany]);

    // Populate form when loading a different company by NIT
    useEffect(() => {
        if (!companySettings) return;
        setNombre(companySettings.nombre || '');
        setCiudad(companySettings.ciudad || '');
        setCodigoCiiu(companySettings.codigo_ciiu || '');
        setIvaResponsable(companySettings.iva_responsable);
        setTaxRates(taxRatesFromCompany(companySettings));
    }, [companySettings]);

    const handleTaxRateChange = (key: TaxRateKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setTaxRates((prev) => ({ ...prev, [key]: e.target.value }));
    };

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
                    tasa_retefuente_servicios: Number(taxRates.tasa_retefuente_servicios),
                    tasa_retefuente_bienes: Number(taxRates.tasa_retefuente_bienes),
                    tasa_retefuente_arrendamiento: Number(taxRates.tasa_retefuente_arrendamiento),
                    tasa_reteica: Number(taxRates.tasa_reteica),
                    tasa_iva_general: Number(taxRates.tasa_iva_general),
                    tasa_ica: Number(taxRates.tasa_ica),
                    tasa_renta: Number(taxRates.tasa_renta),
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

            setTaxRates(taxRatesFromCompany(result));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No se pudo ejecutar el setup automático';
            setErrorMessage(message);
        }
    };

    const renderTaxField = (field: TaxFieldConfig) => (
        <TextField
            key={field.key}
            size="small"
            type="number"
            label={field.label}
            value={taxRates[field.key]}
            onChange={handleTaxRateChange(field.key)}
            helperText={field.helperText}
            inputProps={{ step: field.step, min: '0', max: '1' }}
            fullWidth
        />
    );

    return (
        <Box>
            <PageHeader
                title="Configuración"
                subtitle="Ajustes generales, conexión con el backend y parámetros tributarios."
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

                    {/* Company Info */}
                    <SettingSection title="Datos de la empresa" icon={<BusinessIcon fontSize="small" />}>
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
                    {/* Tax Parameters */}
                    <SettingSection title="Parámetros Tributarios" icon={<TaxIcon fontSize="small" />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Retención en la fuente */}
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                                    Retención en la fuente
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {RETEFUENTE_FIELDS.map(renderTaxField)}
                                </Box>
                            </Box>

                            <Divider />

                            {/* IVA */}
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                                    IVA
                                </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Tasa IVA general"
                                    value={taxRates.tasa_iva_general}
                                    onChange={handleTaxRateChange('tasa_iva_general')}
                                    helperText="Art. 468 ET"
                                    inputProps={{ step: '0.01', min: '0', max: '1' }}
                                    fullWidth
                                />
                            </Box>

                            <Divider />

                            {/* ReteICA / ICA */}
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                                    ReteICA / ICA
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {ICA_FIELDS.map(renderTaxField)}
                                </Box>
                            </Box>

                            <Divider />

                            {/* Renta */}
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                                    Declaración de renta
                                </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    label="Tasa de renta"
                                    value={taxRates.tasa_renta}
                                    onChange={handleTaxRateChange('tasa_renta')}
                                    helperText="Art. 240 ET, Ley 2277/2022"
                                    inputProps={{ step: '0.01', min: '0', max: '1' }}
                                    fullWidth
                                />
                            </Box>
                        </Box>
                    </SettingSection>

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
