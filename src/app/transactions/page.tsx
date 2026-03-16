'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Button, Typography, Alert, Snackbar } from '@mui/material';
import { PlayArrow as ProcessIcon } from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import TransactionTable from '@/components/transactions/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import { useProcessTransaction } from '@/hooks/useUpload';
import { TransactionStatus } from '@/types';

const TABS: { label: string; status: TransactionStatus | undefined }[] = [
    { label: 'Todas', status: undefined },
    { label: 'Pendientes', status: 'PENDING' },
    { label: 'Procesando', status: 'PROCESSING' },
    { label: 'Contabilizadas', status: 'POSTED' },
    { label: 'Rechazadas', status: 'REJECTED' },
];

export default function TransactionsPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const currentStatus = TABS[tabIndex].status;
    const { data, isLoading, error } = useTransactions(currentStatus);
    const { mutate: processTx, isPending: isProcessing } = useProcessTransaction();

    const pendingRows = data?.filter((t) => t.status === 'PENDING') ?? [];

    const handleContabilizar = () => {
        // Collect unique ingest_ids from pending transactions
        const ingestIds = new Set<string>();
        for (const row of pendingRows) {
            if (row.ingest_id) {
                ingestIds.add(row.ingest_id);
            }
        }

        if (ingestIds.size === 0) {
            setToastMessage('No se pudo iniciar: las transacciones pendientes no tienen ingest_id asociado.');
            setToastOpen(true);
            return;
        }

        for (const ingestId of Array.from(ingestIds)) {
            processTx(ingestId);
        }

        setToastMessage(`Contabilizando ${pendingRows.length} transacción(es)… Estado actualizará en breve.`);
        setToastOpen(true);
    };

    return (
        <Box>
            <PageHeader
                title="Transacciones"
                subtitle="Vista central del sistema. Contabiliza, revisa y audita transacciones extraídas de los documentos."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Transacciones' }]}
                action={
                    <Button
                        variant="contained"
                        startIcon={<ProcessIcon />}
                        disabled={pendingRows.length === 0 || isProcessing}
                        onClick={handleContabilizar}
                        size="small"
                        id="btn-process-selected"
                    >
                        {isProcessing ? 'Procesando…' : `Contabilizar (${pendingRows.length})`}
                    </Button>
                }
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

            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                message={toastMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}
