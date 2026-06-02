'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Typography,
    Alert,
    MenuItem,
} from '@mui/material';
import { palette, fonts, motion, sxLabel, moduleAccents } from '@/styles/brutalist';
import TransactionItemTable from './TransactionItemTable';
import type { CreateTransactionPayload, UpdateTransactionPayload, TransactionItem, TransactionSummary } from '@/types';

const ACCENT = moduleAccents.transactions;

const DOC_TYPES = [
    { value: 'factura', label: 'Factura' },
    { value: 'extracto', label: 'Extracto bancario' },
    { value: 'nota_credito', label: 'Nota crédito' },
    { value: 'cuenta_cobro', label: 'Cuenta de cobro' },
    { value: 'recibo_caja', label: 'Recibo de caja' },
    { value: 'otro', label: 'Otro' },
];

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateTransactionPayload) => void;
    onUpdate?: (id: string, payload: UpdateTransactionPayload) => void;
    initialData?: TransactionSummary | null;
    companyNit: string;
    loading?: boolean;
    error?: string | null;
}

export default function TransactionFormModal({
    open,
    onClose,
    onSubmit,
    onUpdate,
    initialData,
    companyNit,
    loading,
    error,
}: Props) {
    const isEdit = !!initialData;

    const [fecha, setFecha] = useState('');
    const [concepto, setConcepto] = useState('');
    const [total, setTotal] = useState('');
    const [nitEmisor, setNitEmisor] = useState('');
    const [nitReceptor, setNitReceptor] = useState('');
    const [tipoDocumento, setTipoDocumento] = useState('factura');
    const [items, setItems] = useState<TransactionItem[]>([{ descripcion: '', subtotal: 0, iva: 0 }]);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (open && initialData) {
            setFecha(initialData.fecha ? initialData.fecha.split('T')[0] : '');
            setConcepto(initialData.concepto || '');
            setTotal(String(initialData.total || ''));
            setNitEmisor(initialData.nit_emisor || '');
            setNitReceptor(companyNit);
            setTipoDocumento('factura');
            setItems([{ descripcion: initialData.concepto || '', subtotal: initialData.total || 0, iva: 0 }]);
        } else if (open) {
            setFecha('');
            setConcepto('');
            setTotal('');
            setNitEmisor('');
            setNitReceptor(companyNit);
            setTipoDocumento('factura');
            setItems([{ descripcion: '', subtotal: 0, iva: 0 }]);
        }
        setValidationError(null);
    }, [open, initialData, companyNit]);

    const computedTotal = useMemo(() => {
        return items.reduce((s, it) => s + it.subtotal + it.iva, 0);
    }, [items]);

    const handleSubmit = () => {
        setValidationError(null);
        if (!fecha || !concepto || !total || !nitEmisor || !nitReceptor) {
            setValidationError('Complete todos los campos obligatorios.');
            return;
        }
        const numTotal = parseFloat(total.replace(/[^\d.-]/g, '')) || 0;
        if (Math.abs(numTotal - computedTotal) > 1) {
            setValidationError(
                `El total ingresado (${numTotal.toLocaleString('es-CO')}) no coincide con la suma de items + IVA (${computedTotal.toLocaleString('es-CO')}).`
            );
            return;
        }

        const payload: CreateTransactionPayload = {
            fecha,
            concepto,
            total: numTotal,
            nit_emisor: nitEmisor.replace(/[.\s]/g, ''),
            nit_receptor: nitReceptor.replace(/[.\s]/g, ''),
            tipo_documento: tipoDocumento,
            items: items.filter((it) => it.descripcion.trim().length > 0),
            company_nit: companyNit.replace(/[.\s]/g, ''),
        };

        if (isEdit && initialData && onUpdate) {
            const updatePayload: UpdateTransactionPayload = {
                fecha: payload.fecha,
                concepto: payload.concepto,
                total: payload.total,
                nit_emisor: payload.nit_emisor,
                nit_receptor: payload.nit_receptor,
                tipo_documento: payload.tipo_documento,
                items: payload.items,
            };
            onUpdate(initialData.id, updatePayload);
        } else {
            onSubmit(payload);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: palette.ink, border: `1px solid ${palette.line}`, borderRadius: 2 } }}>
            <DialogTitle sx={{ color: palette.paper, fontFamily: fonts.display, fontSize: '1.5rem', pb: 0 }}>
                <Typography component="span" sx={{ ...sxLabel, color: ACCENT, display: 'block', mb: 0.5 }}>
                    // {isEdit ? 'EDITAR_TRANSACCIÓN' : 'NUEVA_TRANSACCIÓN'}
                </Typography>
                {isEdit ? 'Editar transacción' : 'Crear transacción manual'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {(error || validationError) && (
                    <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: palette.paper }}>
                        {error || validationError}
                    </Alert>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <TextField
                        label="Fecha"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ '& .MuiInputBase-root': { color: palette.paper, borderColor: palette.line } }}
                    />
                    <TextField
                        select
                        label="Tipo de documento"
                        value={tipoDocumento}
                        onChange={(e) => setTipoDocumento(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiInputBase-root': { color: palette.paper } }}
                    >
                        {DOC_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                                {t.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField label="NIT Emisor" value={nitEmisor} onChange={(e) => setNitEmisor(e.target.value)} fullWidth />
                    <TextField label="NIT Receptor" value={nitReceptor} onChange={(e) => setNitReceptor(e.target.value)} fullWidth />
                </Box>
                <TextField
                    label="Concepto"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    multiline
                    rows={2}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Total"
                    type="number"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    helperText={`Calculado desde items: ${computedTotal.toLocaleString('es-CO')}`}
                    FormHelperTextProps={{ sx: { color: palette.paperGhost, fontFamily: fonts.mono, fontSize: '0.7rem' } }}
                />
                <TransactionItemTable items={items} onChange={setItems} disabled={loading} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
                    <Button onClick={onClose} sx={{ color: palette.paperGhost, fontFamily: fonts.mono, letterSpacing: '0.15em' }}>
                        // CANCELAR
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{
                            bgcolor: palette.chartreuse,
                            color: palette.ink,
                            fontFamily: fonts.mono,
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            px: 3,
                            py: 1,
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#e5f200' },
                        }}
                    >
                        {loading ? '...' : '// GUARDAR'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
