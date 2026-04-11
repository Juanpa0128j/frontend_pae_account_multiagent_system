'use client';

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
    Select,
    MenuItem,
    FormControl,
    Skeleton,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Circle as CircleIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useCompany } from '@/context/CompanyContext';

interface TopBarProps {
    onMobileMenuOpen?: () => void;
    pageTitle?: string;
}

export default function TopBar({ onMobileMenuOpen, pageTitle }: TopBarProps) {
    const { data: health } = useHealthCheck();
    const { companies, activeNit, setActiveNit, isLoading: companyLoading } = useCompany();

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

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                width: { md: `calc(100% - 0px)` },
                ml: { md: 0 },
            }}
        >
            <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, md: 3 } }}>
                {/* Mobile hamburger */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMobileMenuOpen}
                    sx={{ mr: 1, display: { md: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>

                {/* Page title (mobile) */}
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
                {companyLoading ? (
                    <Skeleton
                        variant="rounded"
                        width={180}
                        height={28}
                        sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}
                    />
                ) : companies.length > 0 ? (
                    <FormControl
                        size="small"
                        sx={{ mr: 2, minWidth: 180, display: { xs: 'none', md: 'flex' } }}
                    >
                        <Select
                            value={activeNit ?? ''}
                            onChange={(e) => setActiveNit(e.target.value)}
                            displayEmpty
                            sx={{
                                fontSize: '0.78rem',
                                height: 30,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255,255,255,0.12)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(99,102,241,0.5)',
                                },
                                '& .MuiSelect-select': {
                                    py: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                },
                            }}
                            renderValue={(val) => {
                                const co = companies.find((c) => c.nit === val);
                                return co ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <BusinessIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 600,
                                                    lineHeight: 1.2,
                                                    display: 'block',
                                                    color: 'text.primary',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {co.nombre ?? co.nit}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1 }}
                                            >
                                                {co.nit}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="caption" color="text.disabled">
                                        Sin empresa
                                    </Typography>
                                );
                            }}
                        >
                            {companies.map((co) => (
                                <MenuItem key={co.nit} value={co.nit} sx={{ fontSize: '0.82rem' }}>
                                    <Box>
                                        <Typography variant="caption" fontWeight={600} display="block">
                                            {co.nombre ?? co.nit}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: '0.68rem' }}
                                        >
                                            NIT {co.nit}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : null}

                {/* Backend status indicator */}
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
    );
}
