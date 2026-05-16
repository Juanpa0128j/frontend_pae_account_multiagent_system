'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
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
    Menu,
    MenuItem,
    Divider,
    keyframes,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Business as BusinessIcon,
    Add as AddIcon,
    HelpOutline as HelpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { usePendingReviewJobs } from '@/hooks';
import { useCompany } from '@/context/CompanyContext';
import { useUpsertCompanySettings, useDeleteCompany, useMunicipios } from '@/hooks/useSettings';
import { useQueryClient } from '@tanstack/react-query';
import { joinCompany, type CompanySettingsApiResponse } from '@/lib/api';
import dynamic from 'next/dynamic';

// Drawer only renders when opened — load it on demand
const HelpQuickDrawer = dynamic(() => import('@/components/help/HelpQuickDrawer'), {
    ssr: false,
});
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
    const { reloadCompanies } = useCompany();
    const { data: municipios = [] } = useMunicipios();

    const handleCreate = async () => {
        if (!nit.trim()) {
            setError('El NIT es obligatorio');
            return;
        }
        if (!nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        setError('');
        const trimmedNit = nit.trim();
        try {
            await upsert({
                nit: trimmedNit,
                payload: {
                    nombre: nombre.trim(),
                    ciudad: ciudad.trim() || undefined,
                    iva_responsable: true,
                    tasa_retefuente_servicios: 0.11,
                    tasa_retefuente_bienes: 0.03,
                    tasa_retefuente_arrendamiento: 0.1,
                    tasa_reteica: 0.0069,
                    tasa_iva_general: 0.19,
                    tasa_ica: 0.0069,
                    tasa_renta: 0.35,
                },
            });
            // Register the creator as a member — backend's settings upsert
            // does not auto-assign membership.
            try {
                await joinCompany(trimmedNit);
            } catch (joinErr: unknown) {
                // 409 means user is already a member — safe to ignore.
                const status = (joinErr as { response?: { status?: number } })?.response?.status;
                if (status !== 409) throw joinErr;
            }
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ['my-companies'] }),
                queryClient.refetchQueries({ queryKey: ['companies'] }),
                reloadCompanies(),
            ]);
            onCreated(trimmedNit);
            setNit('');
            setNombre('');
            setCiudad('');
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
                    <TextField
                        label="NIT *"
                        size="small"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="900123456-1"
                        fullWidth
                        sx={inputSx}
                    />
                    <TextField
                        label="Razón social *"
                        size="small"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        sx={inputSx}
                    />
                    <FormControl size="small" fullWidth sx={inputSx}>
                        <InputLabel
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: palette.paperFaint,
                                '&.Mui-focused': { color: palette.chartreuse },
                            }}
                        >
                            Ciudad
                        </InputLabel>
                        <Select
                            value={ciudad}
                            label="Ciudad"
                            onChange={(e) => setCiudad(e.target.value)}
                        >
                            <MenuItem value="">
                                <em style={{ fontFamily: fonts.mono, fontSize: '0.8rem' }}>
                                    Sin especificar
                                </em>
                            </MenuItem>
                            {municipios.map((m) => (
                                <MenuItem key={m} value={m}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {error && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                color: palette.error,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {'// ERROR · '}
                            {error}
                        </Typography>
                    )}
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            color: palette.paperGhost,
                            letterSpacing: '0.1em',
                            mt: 1,
                        }}
                    >
                        Las tarifas tributarias se setean con valores por defecto razonables y son
                        ajustables en /settings.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                <BrutalistButton
                    variant="ghost"
                    size="sm"
                    accent={palette.paperFaint}
                    onClick={onClose}
                    disabled={isPending}
                >
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
// Edit empresa dialog
// ---------------------------------------------------------------------------

function EditEmpresaDialog({
    open,
    company,
    onClose,
    onSaved,
}: {
    open: boolean;
    company: CompanySettingsApiResponse | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [nombre, setNombre] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [error, setError] = useState('');
    const queryClient = useQueryClient();
    const { mutateAsync: upsert, isPending } = useUpsertCompanySettings();
    const { data: municipios = [] } = useMunicipios();

    useEffect(() => {
        if (company) {
            setNombre(company.nombre ?? '');
            setCiudad(company.ciudad ?? '');
            setError('');
        }
    }, [company]);

    const handleSave = async () => {
        if (!company) return;
        if (!nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        setError('');
        try {
            await upsert({
                nit: company.nit,
                payload: {
                    nombre: nombre.trim(),
                    ciudad: ciudad.trim() || undefined,
                    iva_responsable: company.iva_responsable,
                    tasa_retefuente_servicios: company.tasa_retefuente_servicios,
                    tasa_retefuente_bienes: company.tasa_retefuente_bienes,
                    tasa_retefuente_arrendamiento: company.tasa_retefuente_arrendamiento,
                    tasa_reteica: company.tasa_reteica,
                    tasa_iva_general: company.tasa_iva_general,
                    tasa_ica: company.tasa_ica,
                    tasa_renta: company.tasa_renta,
                },
            });
            await queryClient.refetchQueries({ queryKey: ['companies'] });
            onSaved();
        } catch {
            setError('Error al guardar los cambios.');
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
            '&.Mui-focused fieldset': { borderColor: palette.accent, borderWidth: 1 },
        },
        '& .MuiInputLabel-root': {
            fontFamily: fonts.mono,
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: palette.paperFaint,
            '&.Mui-focused': { color: palette.accent },
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
            <Box sx={{ height: 4, bgcolor: palette.accent }} />
            <DialogTitle sx={{ pt: 3, pb: 1 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.accent, mb: 1 }}>
                    {'// EDITAR_EMPRESA'}
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
                    Editar empresa.
                </Typography>
                {company && (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            color: palette.paperGhost,
                            letterSpacing: '0.12em',
                            mt: 0.5,
                        }}
                    >
                        NIT {company.nit}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Razón social *"
                        size="small"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        sx={inputSx}
                    />
                    <FormControl size="small" fullWidth sx={inputSx}>
                        <InputLabel
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: palette.paperFaint,
                                '&.Mui-focused': { color: palette.chartreuse },
                            }}
                        >
                            Ciudad
                        </InputLabel>
                        <Select
                            value={ciudad}
                            label="Ciudad"
                            onChange={(e) => setCiudad(e.target.value)}
                        >
                            <MenuItem value="">
                                <em style={{ fontFamily: fonts.mono, fontSize: '0.8rem' }}>
                                    Sin especificar
                                </em>
                            </MenuItem>
                            {municipios.map((m) => (
                                <MenuItem key={m} value={m}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {error && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                color: palette.error,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {'// ERROR · '}
                            {error}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                <BrutalistButton
                    variant="ghost"
                    size="sm"
                    accent={palette.paperFaint}
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancelar
                </BrutalistButton>
                <BrutalistButton
                    variant="primary"
                    size="sm"
                    accent={palette.accent}
                    onClick={handleSave}
                    loading={isPending}
                >
                    Guardar
                </BrutalistButton>
            </DialogActions>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Delete empresa confirmation dialog
// ---------------------------------------------------------------------------

function DeleteEmpresaDialog({
    open,
    company,
    onClose,
    onDeleted,
}: {
    open: boolean;
    company: CompanySettingsApiResponse | null;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [error, setError] = useState('');
    const { mutateAsync: deleteCompany, isPending } = useDeleteCompany();

    const handleDelete = async () => {
        if (!company) return;
        setError('');
        try {
            await deleteCompany(company.nit);
            onDeleted();
        } catch {
            setError('Error al eliminar la empresa.');
        }
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
                    border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                },
            }}
        >
            <Box sx={{ height: 4, bgcolor: palette.error }} />
            <DialogTitle sx={{ pt: 3, pb: 1 }}>
                <Typography sx={{ ...sxLabelSmall, color: palette.error, mb: 1 }}>
                    {'// ELIMINAR_EMPRESA'}
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
                    Eliminar empresa.
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.9rem',
                        color: palette.paperDim,
                        lineHeight: 1.6,
                    }}
                >
                    Esta acción eliminará permanentemente{' '}
                    <Box component="span" sx={{ fontWeight: 700, color: palette.paper }}>
                        {company?.nombre ?? company?.nit}
                    </Box>{' '}
                    y todos sus datos asociados. No se puede deshacer.
                </Typography>
                {error && (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            color: palette.error,
                            letterSpacing: '0.05em',
                            mt: 1.5,
                        }}
                    >
                        {'// ERROR · '}
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                <BrutalistButton
                    variant="ghost"
                    size="sm"
                    accent={palette.paperFaint}
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancelar
                </BrutalistButton>
                <BrutalistButton
                    variant="primary"
                    size="sm"
                    accent={palette.error}
                    onClick={handleDelete}
                    loading={isPending}
                >
                    Eliminar
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

type TopBarNotification = {
    id: string;
    severity: 'error' | 'warning' | 'info';
    title: string;
    detail: string;
};

const NEW_COMPANY_SENTINEL = '__new_company__';

export default function TopBar({ onMobileMenuOpen, pageTitle }: TopBarProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const { data: health } = useHealthCheck();
    const {
        companies,
        activeNit,
        setActiveNit,
        isLoading: companyLoading,
        reloadCompanies,
    } = useCompany();
    const { data: pendingReviewJobs } = usePendingReviewJobs(activeNit);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogCompany, setEditDialogCompany] = useState<CompanySettingsApiResponse | null>(
        null
    );
    const [deleteDialogCompany, setDeleteDialogCompany] =
        useState<CompanySettingsApiResponse | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

    const statusColor =
        health?.status === 'ok'
            ? palette.success
            : health?.status === 'degraded'
              ? palette.amber
              : palette.error;
    const statusLabel =
        health?.status === 'ok'
            ? 'SISTEMA_ACTIVO'
            : health?.status === 'degraded'
              ? 'DEGRADADO'
              : health === undefined
                ? 'CONECTANDO'
                : 'SIN_CONEXION';

    const options = [
        ...companies.map((c) => ({ nit: c.nit, label: c.nombre ?? c.nit })),
        { nit: NEW_COMPANY_SENTINEL, label: '+ Nueva empresa' },
    ];

    const activeOption = options.find((o) => o.nit === activeNit) ?? null;

    const notifications = useMemo<TopBarNotification[]>(() => {
        const items: TopBarNotification[] = [];

        if (health?.status === 'degraded') {
            items.push({
                id: 'api-degraded',
                severity: 'warning',
                title: 'API degradada',
                detail: 'El backend responde con latencia o errores parciales.',
            });
        }

        if (health?.status === 'offline') {
            items.push({
                id: 'api-offline',
                severity: 'error',
                title: 'API fuera de linea',
                detail: 'No hay conexion con el backend en este momento.',
            });
        }

        if (!companyLoading && companies.length === 0) {
            items.push({
                id: 'no-company',
                severity: 'info',
                title: 'Configura tu empresa',
                detail: 'Crea una empresa para iniciar flujos contables.',
            });
        }

        if (!companyLoading && companies.length > 0 && !activeNit) {
            items.push({
                id: 'select-company',
                severity: 'info',
                title: 'Selecciona una empresa',
                detail: 'Activa una empresa para filtrar datos y reportes.',
            });
        }

        if (pendingReviewJobs && pendingReviewJobs.length > 0) {
            pendingReviewJobs.forEach((job) => {
                items.push({
                    id: `hitl-${job.process_id}`,
                    severity: 'warning',
                    title: 'Revisión contable requerida',
                    detail: `Proceso ${job.process_id.slice(-8).toUpperCase()} pausado por descuadre contable. Ve a /upload para revisar y confirmar.`,
                });
            });
        }

        return items;
    }, [health?.status, companyLoading, companies.length, activeNit, pendingReviewJobs]);

    const visibleNotifications = notifications.filter(
        (item) => !dismissedNotificationIds.includes(item.id)
    );
    const unreadCount = visibleNotifications.length;
    const notificationsOpen = Boolean(notifAnchorEl);

    const getSeverityColor = (severity: TopBarNotification['severity']) => {
        if (severity === 'error') return palette.error;
        if (severity === 'warning') return palette.amber;
        return palette.chartreuse;
    };

    const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotifAnchorEl(null);
    };

    const dismissNotification = (id: string) => {
        setDismissedNotificationIds((prev) => [...prev, id]);
    };

    const dismissAllNotifications = () => {
        setDismissedNotificationIds(notifications.map((item) => item.id));
    };

    const companySelector = companyLoading ? (
        <Skeleton variant="rounded" height={32} sx={{ bgcolor: hexAlpha(palette.paper, 0.04) }} />
    ) : (
        <Autocomplete
            size="small"
            options={options}
            value={activeOption ?? undefined}
            getOptionLabel={(o) => o?.label ?? ''}
            isOptionEqualToValue={(a, b) => !!a && !!b && a.nit === b.nit}
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
                const company = companies.find((c) => c.nit === option.nit) ?? null;
                return (
                    <li {...props} key={option.nit} style={{ paddingRight: 4 }}>
                        <Box
                            sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
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
                            {!isNew && company && (
                                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditDialogCompany(company);
                                        }}
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            color: palette.paperGhost,
                                            '&:hover': {
                                                color: palette.accent,
                                                bgcolor: hexAlpha(palette.accent, 0.1),
                                            },
                                        }}
                                    >
                                        <EditIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteDialogCompany(company);
                                        }}
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            color: palette.paperGhost,
                                            '&:hover': {
                                                color: palette.error,
                                                bgcolor: hexAlpha(palette.error, 0.1),
                                            },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                </Box>
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
                            <BusinessIcon
                                sx={{ fontSize: 14, color: palette.chartreuse, mr: 0.5 }}
                            />
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
    );

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
                        {companySelector}
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
                            onClick={handleNotificationOpen}
                            sx={{
                                mr: 1.5,
                                color: unreadCount > 0 ? palette.pink : palette.paperFaint,
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover': {
                                    color: palette.pink,
                                    bgcolor: hexAlpha(palette.pink, 0.08),
                                },
                            }}
                        >
                            <Badge
                                badgeContent={unreadCount}
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

                    <Menu
                        anchorEl={notifAnchorEl}
                        open={notificationsOpen}
                        onClose={handleNotificationClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                minWidth: 320,
                                maxWidth: 360,
                                bgcolor: palette.ink,
                                border: `1px solid ${palette.line}`,
                                borderRadius: 1,
                                backgroundImage: 'none',
                            },
                        }}
                    >
                        <Box sx={{ px: 1.5, py: 1 }}>
                            <Typography sx={{ ...sxLabelSmall, color: palette.pink }}>
                                {'// NOTIFICACIONES'}
                            </Typography>
                        </Box>
                        <Divider sx={{ borderColor: palette.line }} />

                        {visibleNotifications.length === 0 ? (
                            <Box sx={{ px: 1.5, py: 2 }}>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.82rem',
                                        color: palette.paperDim,
                                    }}
                                >
                                    Sin notificaciones nuevas.
                                </Typography>
                            </Box>
                        ) : (
                            visibleNotifications.map((item) => (
                                <MenuItem
                                    key={item.id}
                                    onClick={() => dismissNotification(item.id)}
                                    sx={{
                                        alignItems: 'flex-start',
                                        py: 1,
                                        px: 1.5,
                                        borderBottom: `1px solid ${hexAlpha(palette.paper, 0.05)}`,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            mt: 0.7,
                                            mr: 1,
                                            borderRadius: '50%',
                                            bgcolor: getSeverityColor(item.severity),
                                            boxShadow: `0 0 8px ${getSeverityColor(item.severity)}`,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: palette.paper,
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.76rem',
                                                color: palette.paperDim,
                                                lineHeight: 1.4,
                                                mt: 0.2,
                                                whiteSpace: 'normal',
                                            }}
                                        >
                                            {item.detail}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        )}

                        {visibleNotifications.length > 0 && (
                            <>
                                <Divider sx={{ borderColor: palette.line }} />
                                <MenuItem
                                    onClick={dismissAllNotifications}
                                    sx={{
                                        justifyContent: 'center',
                                        py: 1,
                                        color: palette.pink,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.68rem',
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Marcar todo como leido
                                </MenuItem>
                            </>
                        )}
                    </Menu>

                    {/* User block */}
                    <Tooltip title="Cuenta" arrow>
                        <Box
                            component="button"
                            type="button"
                            onClick={(e) => setUserAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                pl: 1.5,
                                pr: 1.5,
                                py: 0.75,
                                borderLeft: `1px solid ${palette.line}`,
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                borderRadius: 0,
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover .user-avatar': {
                                    bgcolor: palette.chartreuse,
                                    color: palette.ink,
                                    transform: 'rotate(-3deg)',
                                },
                                '&:hover .user-name': { color: palette.paper },
                            }}
                        >
                            {(() => {
                                const fullName =
                                    (user?.user_metadata?.full_name as string | undefined) ||
                                    (user?.user_metadata?.name as string | undefined) ||
                                    (user?.email ? user.email.split('@')[0] : '');
                                const initials = fullName
                                    ? fullName
                                          .split(/[\s.@_-]+/)
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .map((s) => s[0]?.toUpperCase())
                                          .join('') || '?'
                                    : '?';
                                return (
                                    <>
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
                                            {initials}
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
                                                {fullName || 'Usuario'}
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
                                                {user?.email ? `// ${user.email}` : '// SIN SESIÓN'}
                                            </Typography>
                                        </Box>
                                    </>
                                );
                            })()}
                        </Box>
                    </Tooltip>

                    <Menu
                        anchorEl={userAnchorEl}
                        open={Boolean(userAnchorEl)}
                        onClose={() => setUserAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                bgcolor: palette.ink,
                                border: `1px solid ${palette.line}`,
                                borderRadius: 0,
                                mt: 0.5,
                                minWidth: 240,
                            },
                        }}
                    >
                        {user?.email && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.25,
                                    borderBottom: `1px solid ${palette.line}`,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.6rem',
                                        color: palette.paperGhost,
                                        letterSpacing: '0.18em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {'// SESIÓN'}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.75rem',
                                        color: palette.paperDim,
                                        mt: 0.5,
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {user.email}
                                </Typography>
                            </Box>
                        )}
                        <MenuItem
                            onClick={() => {
                                setUserAnchorEl(null);
                                router.push('/companies');
                            }}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                color: palette.paperDim,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                py: 1.25,
                                '&:hover': { color: palette.chartreuse, bgcolor: 'transparent' },
                            }}
                        >
                            {'// EMPRESAS'}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setUserAnchorEl(null);
                                router.push('/settings');
                            }}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                color: palette.paperDim,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                py: 1.25,
                                '&:hover': { color: palette.chartreuse, bgcolor: 'transparent' },
                            }}
                        >
                            {'// AJUSTES'}
                        </MenuItem>
                        <Divider sx={{ borderColor: palette.line }} />
                        <MenuItem
                            onClick={() => {
                                setUserAnchorEl(null);
                                handleLogout();
                            }}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                color: palette.error,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                py: 1.25,
                                '&:hover': { bgcolor: hexAlpha(palette.error, 0.08) },
                            }}
                        >
                            {'// CERRAR SESIÓN'}
                        </MenuItem>
                    </Menu>
                </Toolbar>

                {/* Mobile-only second row: company selector full-width */}
                <Toolbar
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        minHeight: 52,
                        px: 1.5,
                        py: 0.75,
                        gap: 1,
                        borderTop: `1px solid ${palette.line}`,
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>{companySelector}</Box>
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

            <EditEmpresaDialog
                open={editDialogCompany !== null}
                company={editDialogCompany}
                onClose={() => setEditDialogCompany(null)}
                onSaved={() => setEditDialogCompany(null)}
            />

            <DeleteEmpresaDialog
                open={deleteDialogCompany !== null}
                company={deleteDialogCompany}
                onClose={() => setDeleteDialogCompany(null)}
                onDeleted={() => {
                    if (deleteDialogCompany?.nit === activeNit) {
                        const remaining = companies.filter(
                            (c) => c.nit !== deleteDialogCompany.nit
                        );
                        if (remaining.length > 0) {
                            setActiveNit(remaining[0].nit);
                        }
                    }
                    reloadCompanies();
                    setDeleteDialogCompany(null);
                }}
            />

            <HelpQuickDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
