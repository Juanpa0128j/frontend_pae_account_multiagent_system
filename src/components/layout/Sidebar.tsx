'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Drawer,
    Tooltip,
    Typography,
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
    Calculate as DerivationIcon,
    AccountBalance as TaxIcon,
    Assessment as EvaluationIcon,
    Settings as SettingsIcon,
    ChatBubbleOutline as ChatIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    MenuBook as GuideIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import {
    palette,
    fonts,
    motion,
    sxLabel,
    sxLabelSmall,
    hexAlpha,
    moduleAccents,
} from '@/styles/brutalist';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    accent: string;
    number: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        icon: <DashboardIcon />,
        href: '/',
        accent: moduleAccents.dashboard,
        number: '1',
    },
    {
        label: 'Cargar',
        icon: <UploadIcon />,
        href: '/upload',
        accent: moduleAccents.upload,
        number: '2',
    },
    {
        label: 'Transacciones',
        icon: <TransactionsIcon />,
        href: '/transactions',
        accent: moduleAccents.transactions,
        number: '3',
    },
    {
        label: 'Libros',
        icon: <BooksIcon />,
        href: '/books',
        accent: moduleAccents.books,
        number: '4',
    },
    {
        label: 'Reportes',
        icon: <ReportsIcon />,
        href: '/reports',
        accent: moduleAccents.reports,
        number: '5',
    },
    {
        label: 'Derivación',
        icon: <DerivationIcon />,
        href: '/reports/derivation',
        accent: moduleAccents.reports,
        number: '5b',
    },
    {
        label: 'Tributario',
        icon: <TaxIcon />,
        href: '/tax',
        accent: moduleAccents.tax,
        number: '6',
    },
    {
        label: 'Chat IA',
        icon: <ChatIcon />,
        href: '/chat',
        accent: palette.chartreuse,
        number: '7',
    },
    {
        label: 'Evaluación',
        icon: <EvaluationIcon />,
        href: '/evaluation',
        accent: moduleAccents.evaluation,
        number: '8',
        adminOnly: true,
    },
    {
        label: 'Configuración',
        icon: <SettingsIcon />,
        href: '/settings',
        accent: moduleAccents.settings,
        number: '9',
    },
    { label: 'Guía', icon: <GuideIcon />, href: '/help', accent: moduleAccents.help, number: '10' },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    userRole?: 'admin' | 'contador' | 'visor';
}

export default function Sidebar({
    mobileOpen = false,
    onMobileClose,
    userRole = 'admin',
}: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const pathname = usePathname();
    const router = useRouter();
    const { activeCompany } = useCompany();

    const derivationHref = useMemo(() => {
        if (activeCompany?.locked_pathway === 'build_from_scratch')
            return '/reports/derivation?tab=via-a';
        if (activeCompany?.locked_pathway === 'work_with_existing')
            return '/reports/derivation?tab=via-b';
        return '/reports/derivation';
    }, [activeCompany?.locked_pathway]);

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // Prefetch all sidebar routes once on mount so click → instant.
    // Without this, router.push fetches the bundle on demand and there's
    // a visible delay during navigation.
    useEffect(() => {
        navItems.forEach((item) => router.prefetch(item.href));
    }, [router]);

    const showText = !collapsed || isMobile;

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: palette.ink,
                borderRight: `1px solid ${palette.line}`,
                position: 'relative',
            }}
        >
            {/* Vertical accent line */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: 1,
                    bgcolor: palette.line,
                }}
            />

            {/* Logo + collapse toggle */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: showText ? 'space-between' : 'center',
                    px: showText ? 2.5 : 1,
                    py: 2.5,
                    minHeight: 64,
                    borderBottom: `1px solid ${palette.line}`,
                }}
            >
                {showText ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: palette.chartreuse,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: fonts.display,
                                fontWeight: 800,
                                fontSize: '1rem',
                                color: palette.ink,
                                letterSpacing: '-0.04em',
                            }}
                        >
                            P
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: fonts.display,
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    color: palette.paper,
                                    lineHeight: 1,
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                PAE.
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.6rem',
                                    color: palette.paperGhost,
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    mt: 0.25,
                                    lineHeight: 1,
                                }}
                            >
                                {'// CONTABLE_v0.1'}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: palette.chartreuse,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: fonts.display,
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: palette.ink,
                            letterSpacing: '-0.04em',
                        }}
                    >
                        P
                    </Box>
                )}
                {!isMobile && (
                    <IconButton
                        size="small"
                        onClick={() => setCollapsed((c) => !c)}
                        sx={{
                            color: palette.paperFaint,
                            '&:hover': {
                                color: palette.chartreuse,
                                bgcolor: hexAlpha(palette.chartreuse, 0.08),
                            },
                        }}
                    >
                        {collapsed ? (
                            <ChevronRightIcon fontSize="small" />
                        ) : (
                            <ChevronLeftIcon fontSize="small" />
                        )}
                    </IconButton>
                )}
            </Box>

            {/* Section label (visible only when expanded) */}
            {showText && (
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                    <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost }}>
                        {'// MÓDULOS'}
                    </Typography>
                </Box>
            )}

            {/* Nav Items */}
            <Box
                component="nav"
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    px: showText ? 1.5 : 1,
                    py: showText ? 1 : 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: palette.line, borderRadius: 2 },
                }}
            >
                {navItems
                    .filter((item) => !item.adminOnly || userRole === 'admin')
                    .map((item) => {
                        const effectiveHref =
                            item.href === '/reports/derivation' ? derivationHref : item.href;
                        const active = isActive(item.href);
                        const button = (
                            <Box
                                key={item.href}
                                role="button"
                                tabIndex={0}
                                onMouseEnter={() => router.prefetch(effectiveHref)}
                                onClick={() => {
                                    router.push(effectiveHref);
                                    if (isMobile && onMobileClose) onMobileClose();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(effectiveHref);
                                        if (isMobile && onMobileClose) onMobileClose();
                                    }
                                }}
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: showText ? 1.5 : 0,
                                    justifyContent: showText ? 'flex-start' : 'center',
                                    py: showText ? 1.25 : 1.5,
                                    px: showText ? 1.5 : 0,
                                    cursor: 'pointer',
                                    bgcolor: active ? hexAlpha(item.accent, 0.08) : 'transparent',
                                    borderLeft: showText
                                        ? `2px solid ${active ? item.accent : 'transparent'}`
                                        : 'none',
                                    transition: `all ${motion.duration.sm} ${motion.snap}`,
                                    '&:hover': {
                                        bgcolor: hexAlpha(item.accent, 0.06),
                                        borderLeftColor: showText ? item.accent : 'transparent',
                                        '& .nav-num': { color: item.accent },
                                        '& .nav-label': { color: palette.paper },
                                        '& .nav-icon': {
                                            color: item.accent,
                                            transform: 'scale(1.1)',
                                        },
                                        '& .nav-dot': {
                                            transform: 'scale(1.5)',
                                            boxShadow: `0 0 8px ${item.accent}`,
                                        },
                                    },
                                }}
                            >
                                {/* Icon (compact view) */}
                                {!showText && (
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.4,
                                        }}
                                    >
                                        <Box
                                            className="nav-icon"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: active ? item.accent : palette.paperFaint,
                                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                                '& .MuiSvgIcon-root': { fontSize: 22 },
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.55rem',
                                                color: active ? item.accent : palette.paperGhost,
                                                letterSpacing: '0.1em',
                                                fontWeight: 700,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {item.number}
                                        </Typography>
                                        {active && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: -2,
                                                    right: -6,
                                                    width: 6,
                                                    height: 6,
                                                    bgcolor: item.accent,
                                                    boxShadow: `0 0 8px ${item.accent}`,
                                                }}
                                            />
                                        )}
                                    </Box>
                                )}

                                {/* Number + label (expanded view) */}
                                {showText && (
                                    <>
                                        <Box
                                            className="nav-dot"
                                            sx={{
                                                width: 6,
                                                height: 6,
                                                bgcolor: active ? item.accent : palette.paperGhost,
                                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                                boxShadow: active
                                                    ? `0 0 8px ${item.accent}`
                                                    : 'none',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Typography
                                            className="nav-num"
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.72rem',
                                                color: active ? item.accent : palette.paperFaint,
                                                letterSpacing: '0.18em',
                                                fontWeight: 700,
                                                transition: `color ${motion.duration.sm} ${motion.snap}`,
                                                minWidth: 22,
                                            }}
                                        >
                                            {item.number}
                                        </Typography>
                                        <Typography
                                            className="nav-label"
                                            sx={{
                                                fontFamily: fonts.body,
                                                fontSize: '0.88rem',
                                                fontWeight: active ? 600 : 400,
                                                color: active ? palette.paper : palette.paperDim,
                                                letterSpacing: '-0.01em',
                                                flex: 1,
                                                transition: `color ${motion.duration.sm} ${motion.snap}`,
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                        {item.adminOnly && (
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.55rem',
                                                    color: item.accent,
                                                    bgcolor: hexAlpha(item.accent, 0.15),
                                                    px: 0.6,
                                                    py: 0.15,
                                                    letterSpacing: '0.15em',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                ADMIN
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                        );

                        return !showText ? (
                            <Tooltip key={item.href} title={item.label} placement="right" arrow>
                                {button}
                            </Tooltip>
                        ) : (
                            <React.Fragment key={item.href}>{button}</React.Fragment>
                        );
                    })}
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    px: showText ? 2.5 : 1,
                    py: 2,
                    borderTop: `1px solid ${palette.line}`,
                }}
            >
                {showText ? (
                    <>
                        <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost, mb: 0.5 }}>
                            {'// © 2026'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: palette.paperFaint,
                                letterSpacing: '0.1em',
                            }}
                        >
                            PAE_CONTABLE · v0.1.0
                        </Typography>
                    </>
                ) : (
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.55rem',
                            color: palette.paperGhost,
                            letterSpacing: '0.1em',
                            textAlign: 'center',
                        }}
                    >
                        v0.1
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
                        bgcolor: palette.ink,
                        backgroundImage: 'none',
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
                transition: `width ${motion.duration.md} ${motion.snap}`,
                '& .MuiDrawer-paper': {
                    width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    bgcolor: palette.ink,
                    backgroundImage: 'none',
                    border: 'none',
                    transition: `width ${motion.duration.md} ${motion.snap}`,
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}
