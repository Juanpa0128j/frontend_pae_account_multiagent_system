'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Alert } from '@mui/material';
import PageHeader from '@/components/layout/PageHeader';
import TransactionTable from '@/components/transactions/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import type { TransactionStatus } from '@/types';

const TABS: { label: string; status: TransactionStatus | undefined }[] = [
    { label: 'Todas', status: undefined },
    { label: 'Pendientes', status: 'PENDING' },
    { label: 'Procesando', status: 'PROCESSING' },
    { label: 'Contabilizadas', status: 'POSTED' },
    { label: 'Rechazadas', status: 'REJECTED' },
];

export default function TransactionsPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const { activeCompany } = useCompany();
    const currentStatus = TABS[tabIndex].status;
    const { data, isLoading, error } = useTransactions(currentStatus);

    return (
        <Box>
            <PageHeader
                title="Transacciones"
                subtitle={
                    activeCompany
                        ? `${activeCompany.nombre ?? activeCompany.nit} — documentos extraídos e ingresados al pipeline contable`
                        : 'Selecciona una empresa para ver sus transacciones'
                }
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Transacciones' }]}
            />

            <Tabs
                value={tabIndex}
                onChange={(_, v) => setTabIndex(v)}
                sx={{ mb: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                {TABS.map((tab, i) => (
                    <Tab key={tab.label} label={tab.label} id={`tab-${i}`} aria-controls={`tabpanel-${i}`} />
                ))}
            </Tabs>

            {error ? (
                <Alert severity="error">Error al cargar transacciones. Verifica la conexión con el backend.</Alert>
            ) : data?.length === 0 && !isLoading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                        No hay transacciones en este estado.
                    </Typography>
                </Box>
            ) : (
                <TransactionTable
                    rows={data ?? []}
                    loading={isLoading}
                    error={null}
                />
            )}
        </Box>
    );
}
