'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Toolbar, Typography, keyframes } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NavigationProgress from './NavigationProgress';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';
import { CompanyProvider, useCompany } from '@/context/CompanyContext';
import { UploadSessionProvider } from '@/context/UploadSessionContext';
import { GlobalErrorProvider } from '@/context/GlobalErrorContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { palette, fonts, hexAlpha, motion } from '@/styles/brutalist';

// Pages where the gate is bypassed so the user can configure a company.
const GATE_EXEMPT_PATHS = ['/settings'];

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.96); }
`;

function CompanyGate({ children }: { children: React.ReactNode }) {
    const { activeNit, isLoading } = useCompany();
    const pathname = usePathname();

    const isExempt = GATE_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

    if (isLoading || activeNit || isExempt) {
        return <>{children}</>;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: { xs: 116, md: 64 },
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: (theme) => theme.zIndex.drawer + 2,
                bgcolor: hexAlpha(palette.ink, 0.92),
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 3,
                p: 4,
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    border: `2px solid ${palette.chartreuse}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${pulse} 2s ${motion.snap} infinite`,
                    boxShadow: `0 0 32px ${hexAlpha(palette.chartreuse, 0.3)}`,
                }}
            >
                <BusinessIcon sx={{ fontSize: 28, color: palette.chartreuse }} />
            </Box>

            <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        color: palette.chartreuse,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        mb: 1.5,
                    }}
                >
                    {'// EMPRESA_REQUERIDA'}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: { xs: '2.2rem', md: '3rem' },
                        fontWeight: 800,
                        color: palette.paper,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        mb: 2,
                    }}
                >
                    Selecciona una empresa.
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.95rem',
                        color: palette.paperDim,
                        lineHeight: 1.6,
                    }}
                >
                    Elige una empresa en el selector de la barra superior o crea una nueva para continuar.
                </Typography>
            </Box>

            <Box
                sx={{
                    mt: 1,
                    px: 2,
                    py: 1,
                    border: `1px solid ${hexAlpha(palette.chartreuse, 0.3)}`,
                    bgcolor: hexAlpha(palette.chartreuse, 0.06),
                    borderRadius: 0.5,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.68rem',
                        color: hexAlpha(palette.chartreuse, 0.7),
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                    }}
                >
                    {'// O configura una en '}
                    <Box
                        component="a"
                        href="/settings"
                        sx={{
                            color: palette.chartreuse,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        /settings
                    </Box>
                </Typography>
            </Box>
        </Box>
    );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <QueryClientProvider client={queryClient}>
          <GlobalErrorProvider>
            <CompanyProvider>
              <UploadSessionProvider>
              <ErrorBoundary>
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                    <NavigationProgress />
                    <TopBar onMobileMenuOpen={() => setMobileOpen(true)} />
                    <Sidebar
                        mobileOpen={mobileOpen}
                        onMobileClose={() => setMobileOpen(false)}
                    />
                    <Box
                        component="main"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Toolbar
                            sx={{
                                minHeight: { xs: '116px !important', md: '64px !important' },
                            }}
                        />
                        <Box
                            sx={{
                                flex: 1,
                                p: { xs: 2, sm: 3 },
                                maxWidth: 1400,
                                width: '100%',
                                mx: 'auto',
                            }}
                        >
                            <CompanyGate>
                                {children}
                            </CompanyGate>
                        </Box>
                    </Box>
                </Box>
              </ErrorBoundary>
              </UploadSessionProvider>
            </CompanyProvider>
          </GlobalErrorProvider>
        </QueryClientProvider>
    );
}
