'use client';

import { useEffect, useState } from 'react';
import { Box, Tabs, Tab, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { BrutalistPageHero, BrutalistButton } from '@/components/brutalist';
import { moduleAccents, palette, fonts, motion, sxLabel, hexAlpha } from '@/styles/brutalist';
import { East as ArrowIcon } from '@mui/icons-material';
import BookTable from '@/components/books/BookTable';
import AccountFilter from '@/components/books/AccountFilter';
import { useBooks } from '@/hooks/useBooks';
import { useCompany } from '@/context/CompanyContext';
import { BookFilter, BookType } from '@/types';

const BOOK_TYPES: { label: string; type: BookType }[] = [
    { label: 'Libro Diario', type: 'diario' },
    { label: 'Libro Mayor', type: 'mayor' },
    { label: 'Auxiliares', type: 'auxiliar' },
    { label: 'Balance General', type: 'balance' },
];

export default function BooksPage() {
    const router = useRouter();
    const { activeCompany } = useCompany();
    const [tabIndex, setTabIndex] = useState(0);
    const currentBook = BOOK_TYPES[tabIndex] ?? BOOK_TYPES[0];
    const currentType = currentBook.type;
    const [filter, setFilter] = useState<BookFilter>({ tipo: currentType });

    const isViaB = activeCompany?.locked_pathway === 'work_with_existing';
    // For Vía B-locked companies, libro_diario and libro_mayor have no source
    // data — surface a clear message instead of querying the empty endpoint.
    const tipoUnavailable = isViaB && (currentType === 'diario' || currentType === 'mayor');

    // Auto-jump to the first available tab when the company is Vía B-locked
    // and the user lands on (or has selected) a tab that has no data.
    useEffect(() => {
        if (!isViaB) return;
        if (currentType !== 'diario' && currentType !== 'mayor') return;
        const firstAvailable = BOOK_TYPES.findIndex(
            (b) => b.type !== 'diario' && b.type !== 'mayor'
        );
        if (firstAvailable >= 0) {
            const next = BOOK_TYPES[firstAvailable];
            setTabIndex(firstAvailable);
            setFilter({ tipo: next.type });
        }
    }, [isViaB, currentType]);

    const activeFilter: BookFilter = { ...filter, tipo: currentType };
    // Don't query the empty journal-entry endpoint for Vía B's unsupported tabs.
    const { data: entries = [], isLoading } = useBooks(activeFilter, {
        enabled: !tipoUnavailable,
    });

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_4 // LIBROS"
                title={
                    <>
                        Plan único
                        <br />
                        de cuentas.
                    </>
                }
                subtitle="diario · mayor · auxiliar · balance"
                lede="Las cuatro vistas clásicas del plan contable colombiano. Se actualizan automáticamente con cada documento contabilizado."
                accent={moduleAccents.books}
                ghostNumber="4"
                action={
                    <BrutalistButton
                        variant="outline"
                        size="md"
                        accent={moduleAccents.books}
                        endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                        onClick={() => router.push(`/books/${currentType}`)}
                    >
                        Ver completo
                    </BrutalistButton>
                }
            />

            <Tabs
                value={tabIndex}
                onChange={(_, v) => {
                    const nextBook = BOOK_TYPES[v] ?? BOOK_TYPES[0];
                    setTabIndex(v);
                    setFilter({ tipo: nextBook.type });
                }}
                TabIndicatorProps={{ style: { backgroundColor: moduleAccents.books, height: 2 } }}
                sx={{
                    mb: 3,
                    borderBottom: `1px solid ${palette.line}`,
                    '& .MuiTab-root': {
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: palette.paperMuted,
                        minHeight: 44,
                        transition: `color ${motion.duration.sm} ${motion.snap}`,
                        '&.Mui-selected': { color: moduleAccents.books },
                        '&:hover': { color: palette.paper },
                    },
                }}
            >
                {BOOK_TYPES.map((b, i) => (
                    <Tab
                        key={b.type}
                        label={b.label}
                        id={`book-tab-${i}`}
                        disabled={isViaB && (b.type === 'diario' || b.type === 'mayor')}
                    />
                ))}
            </Tabs>

            {tipoUnavailable ? (
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                    El libro {currentBook.label.toLowerCase()} solo está disponible para empresas en
                    Vía A (documentos fuente). Esta empresa está cargando estados financieros
                    directamente (Vía B), por lo que solo el libro auxiliar y el balance general
                    tienen datos.
                </Alert>
            ) : (
                <>
                    <AccountFilter bookType={currentType} onFilter={(f) => setFilter(f)} />
                    <BookTable rows={entries} loading={isLoading} />
                </>
            )}
        </Box>
    );
}
