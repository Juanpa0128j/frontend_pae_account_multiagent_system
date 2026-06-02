'use client';

import { useMemo } from 'react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { palette, fonts, motion, sxLabel } from '@/styles/brutalist';
import type { TransactionItem } from '@/types';

interface Props {
    items: TransactionItem[];
    onChange: (items: TransactionItem[]) => void;
    disabled?: boolean;
}

export default function TransactionItemTable({ items, onChange, disabled }: Props) {
    const handleUpdate = (index: number, field: keyof TransactionItem, value: string | number) => {
        const next = [...items];
        if (field === 'descripcion') {
            next[index] = { ...next[index], descripcion: String(value) };
        } else {
            const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : value;
            next[index] = { ...next[index], [field]: num };
        }
        onChange(next);
    };

    const handleAdd = () => {
        onChange([...items, { descripcion: '', subtotal: 0, iva: 0 }]);
    };

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const subtotal = useMemo(() => items.reduce((s, it) => s + it.subtotal, 0), [items]);
    const iva = useMemo(() => items.reduce((s, it) => s + it.iva, 0), [items]);
    const total = subtotal + iva;

    return (
        <Box>
            <Typography sx={{ ...sxLabel, mb: 1.5, color: palette.paperGhost }}>
                // ITEMS
            </Typography>
            {items.map((item, idx) => (
                <Box
                    key={idx}
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                        mb: 1.5,
                        p: 1.5,
                        border: `1px solid ${palette.line}`,
                        borderRadius: 1,
                    }}
                >
                    <TextField
                        label="Descripción"
                        value={item.descripcion}
                        onChange={(e) => handleUpdate(idx, 'descripcion', e.target.value)}
                        disabled={disabled}
                        size="small"
                        fullWidth
                        sx={{ flex: 2 }}
                    />
                    <TextField
                        label="Subtotal"
                        type="number"
                        value={item.subtotal || ''}
                        onChange={(e) => handleUpdate(idx, 'subtotal', e.target.value)}
                        disabled={disabled}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        label="IVA"
                        type="number"
                        value={item.iva || ''}
                        onChange={(e) => handleUpdate(idx, 'iva', e.target.value)}
                        disabled={disabled}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <IconButton onClick={() => handleRemove(idx)} disabled={disabled} sx={{ color: palette.error }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Box
                    component="button"
                    onClick={handleAdd}
                    disabled={disabled}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: 'transparent',
                        border: `1px solid ${palette.accent}`,
                        color: palette.accent,
                        px: 2,
                        py: 0.75,
                        borderRadius: 1,
                        cursor: 'pointer',
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' },
                    }}
                >
                    <AddIcon fontSize="small" /> // AGREGAR ITEM
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.7rem', color: palette.paperGhost }}>
                        SUBTOTAL: {subtotal.toLocaleString('es-CO')}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.7rem', color: palette.paperGhost }}>
                        IVA: {iva.toLocaleString('es-CO')}
                    </Typography>
                    <Typography sx={{ fontFamily: fonts.display, fontSize: '1.2rem', color: palette.paper }}>
                        TOTAL: {total.toLocaleString('es-CO')}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
