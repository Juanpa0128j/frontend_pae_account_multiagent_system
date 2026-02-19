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
import { useState } from 'react';
import { useHealthCheck } from '@/hooks/useHealthCheck';

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
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState({ vencimientos: true, errores: true, procesados: false });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
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
                        </Box>
                    </SettingSection>

                    {/* Security */}
                    <SettingSection title="Seguridad" icon={<SecurityIcon fontSize="small" />}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField size="small" label="Empresa / NIT" placeholder="Mi empresa S.A.S — 900.XXX.XXX-X" fullWidth />
                            <TextField size="small" label="Email del administrador" type="email" placeholder="admin@empresa.com" fullWidth />
                            <TextField size="small" label="Período contable activo" placeholder="2026" type="number" fullWidth />
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
                            size="large"
                            id="btn-save-settings"
                            sx={{ px: 4 }}
                        >
                            Guardar cambios
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
