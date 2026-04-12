'use client';

import { useState } from 'react';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Avatar,
    Chip,
    Tooltip,
    Badge,
    Autocomplete,
    TextField,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    CircularProgress,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Circle as CircleIcon,
    Business as BusinessIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useCompany } from '@/context/CompanyContext';
import { useUpsertCompanySettings } from '@/hooks/useSettings';
import { useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Nueva empresa dialog
// ---------------------------------------------------------------------------

function NuevaEmpresaDialog({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (nit: string) => void;
}) {
    const [nit, setNit] = useState('');
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [error, setError] = useState('');
    const queryClient = useQueryClient();
    const { mutateAsync: upsert, isPending } = useUpsertCompanySettings();

    const handleCreate = async () => {
        if (!nit.trim()) { setError('El NIT es obligatorio'); return; }
        if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
        setError('');
        try {
            await upsert({
                nit: nit.trim(),
                payload: {
                    nombre: nombre.trim(),
                    ciudad: ciudad.trim() || undefined,
                    iva_responsable: true,
                    tasa_retefuente_servicios: 0.11,
                    tasa_retefuente_bienes: 0.03,
                    tasa_retefuente_arrendamiento: 0.10,
                    tasa_reteica: 0.0069,
                    tasa_iva_general: 0.19,
                    tasa_ica: 0.0069,
                    tasa_renta: 0.35,
                },
            });
            await queryClient.invalidateQueries({ queryKey: ['companies'] });
            onCreated(nit.trim());
            setNit(''); setNombre(''); setCiudad('');
        } catch {
            setError('Error al crear la empresa. Verifica que el NIT no exista ya.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                Nueva empresa
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="NIT *"
                        size="small"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="900123456-1"
                        fullWidth
                    />
                    <TextField
                        label="Razón social *"
                        size="small"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Ciudad"
                        size="small"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        fullWidth
                    />
                    {error && (
                        <Typography variant="caption" color="error.main">
                            {error}
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                        Las tarifas tributarias se configuran con valores por defecto y pueden ajustarse en Configuración.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} size="small" disabled={isPending}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreate}
                    disabled={isPending}
                    startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
                >
                    Crear
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

interface TopBarProps {
    onMobileMenuOpen?: () => void;
    pageTitle?: string;
}

const NEW_COMPANY_SENTINEL = '__new_company__';

export default function TopBar({ onMobileMenuOpen, pageTitle }: TopBarProps) {
    const { data: health } = useHealthCheck();
    const { companies, activeNit, setActiveNit, isLoading: companyLoading } = useCompany();
    const [dialogOpen, setDialogOpen] = useState(false);

    const statusColor =
        health?.status === 'ok' ? '#10B981' :
        health?.status === 'degraded' ? '#F59E0B' :
        '#EF4444';
    const statusLabel =
        health?.status === 'ok' ? 'API Online' :
        health?.status === 'degraded' ? 'API Degradada' :
        health === undefined ? 'Verificando...' :
        'API Offline';
    const statusBorderColor =
        health?.status === 'ok' ? 'rgba(16,185,129,0.3)' :
        health?.status === 'degraded' ? 'rgba(245,158,11,0.3)' :
        'rgba(239,68,68,0.3)';

    const options = [
        ...companies.map((c) => ({ nit: c.nit, label: c.nombre ?? c.nit })),
        { nit: NEW_COMPANY_SENTINEL, label: '+ Nueva empresa' },
    ];

    const activeOption = options.find((o) => o.nit === activeNit) ?? null;

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, md: 3 } }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={onMobileMenuOpen}
                        sx={{ mr: 1, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {pageTitle && (
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{ display: { md: 'none' }, flex: 1, color: 'text.primary' }}
                        >
                            {pageTitle}
                        </Typography>
                    )}

                    <Box sx={{ flex: 1 }} />

                    {/* Company selector */}
                    <Box sx={{ mr: 2, display: { xs: 'none', md: 'block' }, width: 220 }}>
                        {companyLoading ? (
                            <Skeleton variant="rounded" height={30} />
                        ) : (
                            <Autocomplete
                                size="small"
                                options={options}
                                value={activeOption ?? undefined}
                                getOptionLabel={(o) => o.label}
                                isOptionEqualToValue={(a, b) => a.nit === b.nit}
                                onChange={(_, val) => {
                                    if (!val) return;
                                    if (val.nit === NEW_COMPANY_SENTINEL) {
                                        setDialogOpen(true);
                                    } else {
                                        setActiveNit(val.nit);
                                    }
                                }}
                                disableClearable
                                renderOption={(props, option) => {
                                    const isNew = option.nit === NEW_COMPANY_SENTINEL;
                                    return (
                                        <li {...props} key={option.nit}>
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={isNew ? 700 : 600}
                                                    display="block"
                                                    color={isNew ? 'primary.main' : 'text.primary'}
                                                >
                                                    {option.label}
                                                </Typography>
                                                {!isNew && (
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                        NIT {option.nit}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </li>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Buscar empresa…"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <BusinessIcon sx={{ fontSize: 14, color: 'primary.main', mr: 0.5 }} />
                                            ),
                                            sx: {
                                                fontSize: '0.78rem',
                                                height: 30,
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255,255,255,0.12)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(99,102,241,0.5)',
                                                },
                                            },
                                        }}
                                    />
                                )}
                            />
                        )}
                    </Box>

                    {/* Backend status */}
                    <Tooltip title={statusLabel} arrow>
                        <Chip
                            size="small"
                            icon={<CircleIcon sx={{ fontSize: '10px !important', color: `${statusColor} !important` }} />}
                            label={statusLabel}
                            variant="outlined"
                            sx={{
                                mr: 2,
                                display: { xs: 'none', sm: 'flex' },
                                fontSize: '0.72rem',
                                height: 26,
                                borderColor: statusBorderColor,
                                color: statusColor,
                                '& .MuiChip-icon': { ml: 0.5 },
                            }}
                        />
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Notificaciones" arrow>
                        <IconButton
                            size="small"
                            sx={{
                                mr: 1.5,
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main', bgcolor: 'rgba(99,102,241,0.08)' },
                            }}
                        >
                            <Badge badgeContent={3} color="error" max={9}>
                                <NotificationsIcon fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* User avatar */}
                    <Tooltip title="Contador — PAE" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                }}
                            >
                                SC
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, fontWeight: 600, color: 'text.primary' }}>
                                    Samuel Castano
                                </Typography>
                                <Typography variant="caption" sx={{ lineHeight: 1, color: 'text.secondary', fontSize: '0.67rem' }}>
                                    Contador
                                </Typography>
                            </Box>
                        </Box>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <NuevaEmpresaDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={(nit) => {
                    setActiveNit(nit);
                    setDialogOpen(false);
                }}
            />
        </>
    );
}
