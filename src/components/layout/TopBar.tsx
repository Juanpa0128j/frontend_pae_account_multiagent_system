'use client';

import { useState } from 'react';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Tooltip,
    Badge,
    Autocomplete,
    TextField,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    keyframes,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Business as BusinessIcon,
    Add as AddIcon,
    HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useCompany } from '@/context/CompanyContext';
import { useUpsertCompanySettings } from '@/hooks/useSettings';
import { useQueryClient } from '@tanstack/react-query';
import HelpQuickDrawer from '@/components/help/HelpQuickDrawer';
import { BrutalistButton } from '@/components/brutalist';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';

const flicker = keyframes`
    0%, 100% { opacity: 1; }
    97% { opacity: 1; }
    98% { opacity: 0.2; }
    99% { opacity: 1; }
`;

// ---------------------------------------------------------------------------
// Nueva empresa dialog (brutalist styled)
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
                },
            });
            await queryClient.invalidateQueries({ queryKey: ['companies'] });
            onCreated(nit.trim());
            setNit(''); setNombre(''); setCiudad('');
        } catch {
            setError('Error al crear la empresa. Verifica que el NIT no exista ya.');
        }
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            fontFamily: fonts.body,
            fontSize: '0.92rem',
            bgcolor: hexAlpha(palette.paper, 0.03),
            '& fieldset': { borderColor: palette.line },
            '&:hover fieldset': { borderColor: palette.lineStrong },
            '&.Mui-focused fieldset': { borderColor: palette.chartreuse, borderWidth: 1 },
        },
        '& .MuiInputLabel-root': {
            fontFamily: fonts.mono,
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: palette.paperFaint,
            '&.Mui-focused': { color: palette.chartreuse },
        },
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: palette.ink,
                    backgroundImage: 'none',
                    border: `1px solid ${palette.line}`,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                },
            }}
        >
            {/* Top accent strip */}
            <Box sx={{ height: 4, bgcolor: palette.chartreuse }} />
            <DialogTitle sx={{ pt: 3, pb: 1 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.chartreuse, mb: 1 }}>
                    {'// NUEVA_EMPRESA'}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                    }}
                >
                    Crear empresa.
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="NIT *" size="small" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="900123456-1" fullWidth sx={inputSx} />
                    <TextField label="Razón social *" size="small" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth sx={inputSx} />
                    <TextField label="Ciudad" size="small" value={ciudad} onChange={(e) => setCiudad(e.target.value)} fullWidth sx={inputSx} />
                    {error && (
                        <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.75rem', color: palette.error, letterSpacing: '0.05em' }}>
                            {'// ERROR · '}{error}
                        </Typography>
                    )}
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: palette.paperGhost, letterSpacing: '0.1em', mt: 1 }}>
                        Las tarifas tributarias se setean con valores por defecto razonables y son ajustables en /settings.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                <BrutalistButton variant="ghost" size="sm" accent={palette.paperFaint} onClick={onClose} disabled={isPending}>
                    Cancelar
                </BrutalistButton>
                <BrutalistButton
                    variant="primary"
                    size="sm"
                    accent={palette.chartreuse}
                    icon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={handleCreate}
                    loading={isPending}
                >
                    Crear
                </BrutalistButton>
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
    const [helpOpen, setHelpOpen] = useState(false);

    const statusColor =
        health?.status === 'ok' ? palette.success :
        health?.status === 'degraded' ? palette.amber :
        palette.error;
    const statusLabel =
        health?.status === 'ok' ? 'API_LIVE' :
        health?.status === 'degraded' ? 'API_DEGRADED' :
        health === undefined ? 'CONNECTING' :
        'API_OFFLINE';

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
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: palette.ink,
                    backgroundImage: 'none',
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, md: 3 } }}>
                    <IconButton
                        edge="start"
                        onClick={onMobileMenuOpen}
                        sx={{
                            mr: 1.5,
                            color: palette.paperFaint,
                            display: { md: 'none' },
                            '&:hover': { color: palette.chartreuse },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {pageTitle && (
                        <Typography
                            sx={{
                                display: { md: 'none' },
                                flex: 1,
                                fontFamily: fonts.display,
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: palette.paper,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {pageTitle}
                        </Typography>
                    )}

                    <Box sx={{ flex: 1 }} />

                    {/* API Status — brutalist mono chip */}
                    <Tooltip title={statusLabel.replace('_', ' ')} arrow>
                        <Box
                            sx={{
                                display: { xs: 'none', sm: 'inline-flex' },
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1,
                                py: 0.5,
                                mr: 2,
                                border: `1px solid ${hexAlpha(statusColor, 0.4)}`,
                                bgcolor: hexAlpha(statusColor, 0.08),
                                borderRadius: 0.75,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    bgcolor: statusColor,
                                    borderRadius: '50%',
                                    boxShadow: `0 0 8px ${statusColor}`,
                                    animation: `${flicker} 2.5s infinite`,
                                }}
                            />
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.65rem',
                                    color: statusColor,
                                    letterSpacing: '0.18em',
                                    fontWeight: 700,
                                }}
                            >
                                {statusLabel}
                            </Typography>
                        </Box>
                    </Tooltip>

                    {/* Company selector */}
                    <Box sx={{ mr: 2, display: { xs: 'none', md: 'block' }, width: 240 }}>
                        {companyLoading ? (
                            <Skeleton variant="rounded" height={32} sx={{ bgcolor: hexAlpha(palette.paper, 0.04) }} />
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
                                            <Box sx={{ width: '100%' }}>
                                                <Typography
                                                    sx={{
                                                        fontFamily: fonts.body,
                                                        fontSize: '0.85rem',
                                                        fontWeight: isNew ? 700 : 600,
                                                        color: isNew ? palette.chartreuse : palette.paper,
                                                        letterSpacing: '-0.01em',
                                                    }}
                                                >
                                                    {option.label}
                                                </Typography>
                                                {!isNew && (
                                                    <Typography
                                                        sx={{
                                                            fontFamily: fonts.mono,
                                                            fontSize: '0.6rem',
                                                            color: palette.paperGhost,
                                                            letterSpacing: '0.1em',
                                                            mt: 0.25,
                                                        }}
                                                    >
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
                                        placeholder="Empresa…"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <BusinessIcon sx={{ fontSize: 14, color: palette.chartreuse, mr: 0.5 }} />
                                            ),
                                            sx: {
                                                fontFamily: fonts.body,
                                                fontSize: '0.82rem',
                                                fontWeight: 500,
                                                color: palette.paper,
                                                height: 32,
                                                bgcolor: hexAlpha(palette.paper, 0.03),
                                                borderRadius: 0.75,
                                                '& fieldset': { borderColor: palette.line },
                                                '&:hover fieldset': { borderColor: palette.lineStrong },
                                                '&.Mui-focused fieldset': { borderColor: palette.chartreuse },
                                            },
                                        }}
                                    />
                                )}
                                componentsProps={{
                                    paper: {
                                        sx: {
                                            bgcolor: palette.ink,
                                            border: `1px solid ${palette.line}`,
                                            borderRadius: 1,
                                            mt: 0.5,
                                        },
                                    },
                                }}
                            />
                        )}
                    </Box>

                    {/* Help */}
                    <Tooltip title="Guía de uso" arrow>
                        <IconButton
                            size="small"
                            onClick={() => setHelpOpen(true)}
                            sx={{
                                mr: 0.75,
                                color: palette.paperFaint,
                                position: 'relative',
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover': {
                                    color: palette.chartreuse,
                                    bgcolor: hexAlpha(palette.chartreuse, 0.08),
                                },
                            }}
                        >
                            <HelpIcon fontSize="small" />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    width: 5,
                                    height: 5,
                                    bgcolor: palette.chartreuse,
                                    boxShadow: `0 0 6px ${palette.chartreuse}`,
                                }}
                            />
                        </IconButton>
                    </Tooltip>

                    {/* Notifications */}
                    <Tooltip title="Notificaciones" arrow>
                        <IconButton
                            size="small"
                            sx={{
                                mr: 1.5,
                                color: palette.paperFaint,
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover': {
                                    color: palette.pink,
                                    bgcolor: hexAlpha(palette.pink, 0.08),
                                },
                            }}
                        >
                            <Badge
                                badgeContent={3}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: palette.pink,
                                        color: palette.ink,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        minWidth: 16,
                                        height: 16,
                                    },
                                }}
                                max={9}
                            >
                                <NotificationsIcon fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* User block */}
                    <Tooltip title="Contador — PAE" arrow>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                pl: 1.5,
                                py: 0.75,
                                borderLeft: `1px solid ${palette.line}`,
                                cursor: 'pointer',
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover .user-avatar': {
                                    bgcolor: palette.chartreuse,
                                    color: palette.ink,
                                    transform: 'rotate(-3deg)',
                                },
                                '&:hover .user-name': { color: palette.paper },
                            }}
                        >
                            <Box
                                className="user-avatar"
                                sx={{
                                    width: 34,
                                    height: 34,
                                    bgcolor: palette.accent,
                                    color: palette.paper,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: fonts.display,
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    letterSpacing: '-0.04em',
                                    transition: `all ${motion.duration.sm} ${motion.snap}`,
                                }}
                            >
                                SC
                            </Box>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography
                                    className="user-name"
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: palette.paperDim,
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.01em',
                                        transition: `color ${motion.duration.sm} ${motion.snap}`,
                                    }}
                                >
                                    Samuel Castaño
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.6rem',
                                        color: palette.paperGhost,
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                        mt: 0.25,
                                    }}
                                >
                                    {'// CONTADOR'}
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

            <HelpQuickDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
