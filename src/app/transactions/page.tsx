'use client';

import { useState } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { BrutalistPageHero, BrutalistEmptyState, BrutalistChip } from '@/components/brutalist';
import TransactionTable from '@/components/transactions/TransactionTable';
import { useTransactions, useDeleteTransaction, useDeleteTransactionsByIngest } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import { palette, fonts, motion, sxLabel, hexAlpha, moduleAccents } from '@/styles/brutalist';
import type { TransactionStatus } from '@/types';

const ACCENT = moduleAccents.transactions;

const TABS: { label: string; status: TransactionStatus | undefined; mono: string }[] = [
    { label: 'Todas', status: undefined, mono: 'TODAS' },
    { label: 'Pendientes', status: 'PENDING', mono: 'PENDIENTES' },
    { label: 'Procesando', status: 'PROCESSING', mono: 'PROCESANDO' },
    { label: 'Contabilizadas', status: 'POSTED', mono: 'CONTABILIZADAS' },
    { label: 'Rechazadas', status: 'REJECTED', mono: 'RECHAZADAS' },
];

export default function TransactionsPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const { activeCompany } = useCompany();
    const currentStatus = TABS[tabIndex].status;
    const { data: allData, isLoading, error } = useTransactions();
    const { mutate: deleteTransactionMutate } = useDeleteTransaction();
    const { mutate: deleteByIngestMutate } = useDeleteTransactionsByIngest();
    const data = currentStatus
        ? (allData ?? []).filter((t) => t.status === currentStatus)
        : allData;
    const isViaB = activeCompany?.locked_pathway === 'work_with_existing';

    const counts = TABS.map((tab) =>
        tab.status === undefined
            ? (allData?.length ?? 0)
            : (allData ?? []).filter((t) => t.status === tab.status).length
    );

    const handleDelete = (id: string) => {
        deleteTransactionMutate(id);
    };

    const handleDeleteByIngest = (ingestId: string) => {
        deleteByIngestMutate(ingestId);
    };

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_3 // TRANSACCIONES"
                title={
                    <>
                        Pipeline
                        <br />
                        contable.
                    </>
                }
                subtitle={
                    activeCompany ? (activeCompany.nombre ?? activeCompany.nit) : 'sin empresa'
                }
                lede={
                    activeCompany
                        ? 'Cada documento subido se convierte en una transacción. El detalle expone el razonamiento de los agentes que la procesaron.'
                        : 'Selecciona una empresa para ver sus transacciones.'
                }
                accent={ACCENT}
                ghostNumber="3"
                kpis={[
                    { value: String(counts[0] ?? 0), label: 'TOTAL' },
                    { value: String(counts[3] ?? 0), label: 'CONTABILIZADAS' },
                    { value: String(counts[1] ?? 0), label: 'PENDIENTES' },
                ]}
            />

            {/* Brutalist tabs */}
            <Box
                role="tablist"
                sx={{
                    display: 'flex',
                    gap: 0,
                    mb: 4,
                    borderBottom: `1px solid ${palette.line}`,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {TABS.map((tab, i) => {
                    const active = tabIndex === i;
                    return (
                        <Box
                            key={tab.mono}
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTabIndex(i)}
                            sx={{
                                position: 'relative',
                                py: 2,
                                px: { xs: 2, md: 2.5 },
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                '&:hover': {
                                    bgcolor: hexAlpha(ACCENT, 0.04),
                                    '& .tab-num': { color: ACCENT },
                                },
                            }}
                        >
                            <Typography
                                className="tab-num"
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.6rem',
                                    color: active ? ACCENT : palette.paperGhost,
                                    letterSpacing: '0.2em',
                                    transition: `color ${motion.duration.sm} ${motion.snap}`,
                                }}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: fonts.display,
                                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                                    fontWeight: active ? 700 : 500,
                                    color: active ? palette.paper : palette.paperFaint,
                                    letterSpacing: '-0.01em',
                                    mt: 0.25,
                                }}
                            >
                                {tab.label}
                                {counts[i] > 0 && (
                                    <Box
                                        component="span"
                                        sx={{
                                            ml: 0.75,
                                            fontFamily: fonts.mono,
                                            fontSize: '0.7em',
                                            color: active ? ACCENT : palette.paperGhost,
                                            fontWeight: 500,
                                        }}
                                    >
                                        ({counts[i]})
                                    </Box>
                                )}
                            </Typography>
                            {/* Active underline */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -1,
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    bgcolor: ACCENT,
                                    transform: active ? 'scaleX(1)' : 'scaleX(0)',
                                    transformOrigin: 'left',
                                    transition: `transform ${motion.duration.md} ${motion.snap}`,
                                    boxShadow: active ? `0 0 8px ${ACCENT}` : 'none',
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>

            {error ? (
                <Alert
                    severity="error"
                    sx={{
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.3)}`,
                        color: palette.paper,
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                >
                    Error al cargar transacciones. Verifica la conexión con el backend.
                </Alert>
            ) : data?.length === 0 && !isLoading ? (
                <BrutalistEmptyState
                    label={`// SIN ${TABS[tabIndex].mono}`}
                    title={
                        TABS[tabIndex].status === undefined
                            ? 'No hay transacciones todavía'
                            : `Sin transacciones ${TABS[tabIndex].label.toLowerCase()}`
                    }
                    description="Sube documentos en /upload para alimentar el pipeline contable."
                    accent={ACCENT}
                />
            ) : (
                <Box
                    sx={{
                        '& .MuiTableContainer-root': {
                            border: `1px solid ${palette.line}`,
                            borderRadius: 2,
                        },
                    }}
                >
                    {isViaB && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
                            Esta empresa está en Vía B (estados financieros directos). Las filas
                            mostradas son las líneas del libro auxiliar cargado más reciente — no
                            son transacciones generadas por el pipeline.
                        </Alert>
                    )}
                    <TransactionTable
                        rows={data ?? []}
                        loading={isLoading}
                        error={null}
                        onDelete={handleDelete}
                        onDeleteByIngest={handleDeleteByIngest}
                    />
                </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <BrutalistChip
                    label={`MOSTRANDO ${data?.length ?? 0}`}
                    color={ACCENT}
                    variant="ghost"
                />
                {activeCompany && (
                    <BrutalistChip
                        label={`NIT ${activeCompany.nit}`}
                        color={palette.pink}
                        variant="ghost"
                    />
                )}
            </Box>
        </Box>
    );
}
