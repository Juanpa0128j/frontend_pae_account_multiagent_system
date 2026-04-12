'use client';

import React, { useState } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    Divider,
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    UploadFile as UploadIcon,
    Receipt as TransactionsIcon,
    MenuBook as BooksIcon,
    BarChart as ReportsIcon,
    AccountBalance as TaxIcon,
    Assessment as EvaluationIcon,
    Settings as SettingsIcon,
    ChatBubbleOutline as ChatIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Bolt as BoltIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <DashboardIcon />, href: '/' },
    { label: 'Cargar documentos', icon: <UploadIcon />, href: '/upload' },
    { label: 'Transacciones', icon: <TransactionsIcon />, href: '/transactions' },
    { label: 'Libros contables', icon: <BooksIcon />, href: '/books' },
    { label: 'Reportes financieros', icon: <ReportsIcon />, href: '/reports' },
    { label: 'Tributario', icon: <TaxIcon />, href: '/tax' },
    { label: 'Chat Financiero', icon: <ChatIcon />, href: '/chat' },
    { label: 'Evaluación', icon: <EvaluationIcon />, href: '/evaluation', adminOnly: true },
    { label: 'Configuración', icon: <SettingsIcon />, href: '/settings' },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    userRole?: 'admin' | 'contador' | 'visor';
}

export default function Sidebar({ mobileOpen = false, onMobileClose, userRole = 'admin' }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Logo Area */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
                    px: collapsed && !isMobile ? 1 : 2.5,
                    py: 2.5,
                    minHeight: 64,
                }}
            >
                {(!collapsed || isMobile) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 16px rgba(99,102,241,0.5)',
                            }}
                        >
                            <BoltIcon sx={{ fontSize: 18, color: '#fff' }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: '#6366F1',
                                    lineHeight: 1.1,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Antigravity
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 }}
                            >
                                PAE Contable
                            </Typography>
                        </Box>
                    </Box>
                )}
                {collapsed && !isMobile && (
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 16px rgba(99,102,241,0.5)',
                        }}
                    >
                        <BoltIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                )}
                {!isMobile && (
                    <IconButton
                        size="small"
                        onClick={() => setCollapsed((c) => !c)}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', bgcolor: 'rgba(99,102,241,0.08)' },
                        }}
                    >
                        {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                    </IconButton>
                )}
            </Box>

            <Divider />

            {/* Nav Items */}
            <List sx={{ px: 1, py: 1, flex: 1, overflowY: 'auto' }}>
                {navItems.filter((item) => !item.adminOnly || userRole === 'admin').map((item) => {
                    const active = isActive(item.href);
                    const button = (
                        <ListItemButton
                            key={item.href}
                            onClick={() => {
                                router.push(item.href);
                                if (isMobile && onMobileClose) onMobileClose();
                            }}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                minHeight: 44,
                                px: collapsed && !isMobile ? 1.5 : 1.5,
                                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                                bgcolor: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                                border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                                '&:hover': {
                                    bgcolor: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.15)',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: collapsed && !isMobile ? 0 : 36,
                                    color: active ? 'primary.main' : 'text.secondary',
                                    '& .MuiSvgIcon-root': { fontSize: 20 },
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {(!collapsed || isMobile) && (
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: active ? 600 : 400,
                                        color: active ? 'primary.light' : 'text.secondary',
                                        noWrap: true,
                                    }}
                                />
                            )}
                            {item.adminOnly && (!collapsed || isMobile) && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        px: 0.75,
                                        py: 0.1,
                                        borderRadius: 1,
                                        bgcolor: 'rgba(99,102,241,0.15)',
                                        color: 'primary.light',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    ADMIN
                                </Typography>
                            )}
                        </ListItemButton>
                    );

                    return collapsed && !isMobile ? (
                        <Tooltip key={item.href} title={item.label} placement="right" arrow>
                            {button}
                        </Tooltip>
                    ) : (
                        <React.Fragment key={item.href}>{button}</React.Fragment>
                    );
                })}
            </List>

            {/* Footer */}
            <Divider />
            <Box sx={{ px: 2, py: 1.5 }}>
                {(!collapsed || isMobile) && (
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                        © 2026 PAE Contable · v0.1.0
                    </Typography>
                )}
            </Box>
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', md: 'block' },
                width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
                flexShrink: 0,
                transition: 'width 0.25s ease',
                '& .MuiDrawer-paper': {
                    width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    transition: 'width 0.25s ease',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}
