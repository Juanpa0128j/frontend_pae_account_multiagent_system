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
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import { useHealthCheck } from '@/hooks/useHealthCheck';

interface TopBarProps {
    onMobileMenuOpen?: () => void;
    pageTitle?: string;
}

export default function TopBar({ onMobileMenuOpen, pageTitle }: TopBarProps) {
    const { data: health } = useHealthCheck();

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
