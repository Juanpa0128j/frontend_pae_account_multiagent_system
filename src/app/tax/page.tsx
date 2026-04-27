'use client';

import { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { BrutalistPageHero } from '@/components/brutalist';
import { palette, moduleAccents } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import TaxTabs, { type TaxTabValue } from './components/TaxTabs';
import SummaryPanel from './components/SummaryPanel';
import DeclarationPanel from './components/DeclarationPanel';
import TaxCalendarPanel from './components/TaxCalendarPanel';
import CertificatesPanel from './components/CertificatesPanel';
import ExogenaPanel from './components/ExogenaPanel';

const ACCENT = moduleAccents.tax;

// Panel content wrapper with consistent styling
function PanelWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                p: { xs: 2, md: 3 },
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: 'transparent',
            }}
        >
            {children}
        </Box>
    );
}

// No company selected state
function NoCompanyState() {
    return (
        <Alert
            severity="info"
            sx={{
                mt: 4,
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: palette.paper,
                border: `1px solid ${palette.accent}`,
            }}
        >
            Seleccione una empresa para ver la información tributaria
        </Alert>
    );
}

// Main page component
export default function TaxPage() {
    const [activeTab, setActiveTab] = useState<TaxTabValue>('summary');
    const { activeNit } = useCompany();

    const renderPanel = () => {
        if (!activeNit) {
            return <NoCompanyState />;
        }

        switch (activeTab) {
            case 'summary':
                return (
                    <PanelWrapper>
                        <SummaryPanel companyNit={activeNit} />
                    </PanelWrapper>
                );
            case 'declarations':
                return (
                    <PanelWrapper>
                        <DeclarationPanel companyNit={activeNit} />
                    </PanelWrapper>
                );
            case 'calendar':
                return (
                    <PanelWrapper>
                        <TaxCalendarPanel />
                    </PanelWrapper>
                );
            case 'certificates':
                return (
                    <PanelWrapper>
                        <CertificatesPanel companyNit={activeNit} />
                    </PanelWrapper>
                );
            case 'exogena':
                return (
                    <PanelWrapper>
                        <ExogenaPanel companyNit={activeNit} />
                    </PanelWrapper>
                );
            default:
                return null;
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: palette.ink,
                pt: { xs: 8, md: 12 },
                pb: { xs: 6, md: 10 },
                px: { xs: 2, sm: 4, md: 6 },
            }}
        >
            {/* Hero Section */}
            <BrutalistPageHero
                eyebrow="// MÓDULO_6 // TRIBUTARIO"
                title={
                    <>
                        OBLIGACIONES
                        <br />
                        <span style={{ color: ACCENT }}>FISCALES</span>
                    </>
                }
                subtitle={activeNit ? 'Gestión integral de declaraciones tributarias, calendario DIAN, certificados de retención e información exógena.' : 'sin empresa'}
                lede={activeNit ? undefined : 'Seleccione una empresa para gestionar sus obligaciones fiscales.'}
                accent={ACCENT}
                kpis={[
                    { value: '6', label: '// MÓDULO' },
                    { value: '05', label: '// FORMS' },
                    { value: '02', label: '// EXÓGENA' },
                ]}
            />

            {/* Main content */}
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                {/* Tabs */}
                <TaxTabs value={activeTab} onChange={setActiveTab} />

                {/* Active panel */}
                {renderPanel()}
            </Box>
        </Box>
    );
}
