'use client';

import { use } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import BookTable from '@/components/books/BookTable';
import AccountFilter from '@/components/books/AccountFilter';
import { useBooks } from '@/hooks/useBooks';
import type { BookFilter, BookType } from '@/types';

const BOOK_LABELS: Record<BookType, string> = {
    diario: 'Libro Diario',
    mayor: 'Libro Mayor',
    auxiliar: 'Libro Auxiliar',
};

const BOOK_DESCRIPTIONS: Record<BookType, string> = {
    diario: 'Registro cronológico de todas las transacciones. Base del sistema contable.',
    mayor: 'Agrupación de transacciones por cuenta PUC. Permite ver el movimiento por cuenta.',
    auxiliar: 'Detalle por tercero (NIT) o cuenta específica. Filtra por proveedor o cliente.',
};

interface PageProps {
    params: Promise<{ type: string }>;
}

export default function BookTypePage({ params }: PageProps) {
    const { type } = use(params);
    const bookType = (type as BookType) in BOOK_LABELS ? (type as BookType) : 'diario';

    const [filter, setFilter] = useState<BookFilter>({ tipo: bookType });
    const activeFilter: BookFilter = { ...filter, tipo: bookType };
    const { data: entries = [], isLoading } = useBooks(activeFilter);

    return (
        <Box>
            <PageHeader
                title={BOOK_LABELS[bookType]}
                subtitle={BOOK_DESCRIPTIONS[bookType]}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Libros contables', href: '/books' },
                    { label: BOOK_LABELS[bookType] },
                ]}
            />

            <AccountFilter
                bookType={bookType}
                onFilter={(f) => setFilter(f)}
            />

            {!isLoading && entries.length === 0 && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
                    No hay registros para los filtros seleccionados.
                </Alert>
            )}

            <BookTable rows={entries} loading={isLoading} />
        </Box>
    );
}
