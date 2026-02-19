'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import BookTable from '@/components/books/BookTable';
import AccountFilter from '@/components/books/AccountFilter';
import { useBooks } from '@/hooks/useBooks';
import { BookFilter, BookType } from '@/types';

const BOOK_TYPES: { label: string; type: BookType }[] = [
    { label: 'Libro Diario', type: 'diario' },
    { label: 'Libro Mayor', type: 'mayor' },
    { label: 'Auxiliares', type: 'auxiliar' },
];

export default function BooksPage() {
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);
    const currentType = BOOK_TYPES[tabIndex].type;
    const [filter, setFilter] = useState<BookFilter>({ tipo: currentType });

    const activeFilter: BookFilter = { ...filter, tipo: currentType };
    const { data: entries = [], isLoading } = useBooks(activeFilter);

    return (
        <Box>
            <PageHeader
                title="Libros Contables"
                subtitle="Consulta y filtra los libros contables generados automáticamente por el sistema."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Libros contables' }]}
                action={
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(`/books/${currentType}`)}
                        sx={{ fontSize: '0.78rem' }}
                    >
                        Ver página completa
                    </Button>
                }
            />

            <Tabs
                value={tabIndex}
                onChange={(_, v) => { setTabIndex(v); setFilter({ tipo: BOOK_TYPES[v].type }); }}
                sx={{ mb: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                {BOOK_TYPES.map((b, i) => (
                    <Tab key={b.type} label={b.label} id={`book-tab-${i}`} />
                ))}
            </Tabs>

            <AccountFilter
                bookType={currentType}
                onFilter={(f) => setFilter(f)}
            />

            <BookTable rows={entries} loading={isLoading} />
        </Box>
    );
}
