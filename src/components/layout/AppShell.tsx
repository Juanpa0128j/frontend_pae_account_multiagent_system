'use client';

import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';
import { CompanyProvider } from '@/context/CompanyContext';
import { GlobalErrorProvider } from '@/context/GlobalErrorContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

const SIDEBAR_WIDTH = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <QueryClientProvider client={queryClient}>
          <GlobalErrorProvider>
            <CompanyProvider>
              <ErrorBoundary>
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
                        <Toolbar sx={{ minHeight: '64px !important' }} />
                        <Box
                            sx={{
                                flex: 1,
                                p: { xs: 2, sm: 3 },
                                maxWidth: 1400,
                                width: '100%',
                                mx: 'auto',
                            }}
                        >
                            {children}
                        </Box>
                    </Box>
                </Box>
              </ErrorBoundary>
            </CompanyProvider>
          </GlobalErrorProvider>
        </QueryClientProvider>
    );
}
