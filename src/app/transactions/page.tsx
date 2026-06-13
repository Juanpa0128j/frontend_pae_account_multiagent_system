'use client';

import { useState } from 'react';
import {
    Box,
    Alert,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { BrutalistPageHero, BrutalistEmptyState, BrutalistChip } from '@/components/brutalist';
import TransactionTable from '@/components/transactions/TransactionTable';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import {
    useTransactions,
    useDeleteTransaction,
    useDeleteTransactionsByIngest,
    useCreateTransaction,
    useUpdateTransaction,
    useProcessTransaction,
    useCreateManualAjuste,
} from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import { palette, fonts, motion, hexAlpha, moduleAccents } from '@/styles/brutalist';
import type { TransactionStatus } from '@/types';
import type { ManualAjusteLine } from '@/types';
import type { TransactionSummary } from '@/hooks/useTransactions';

const ACCENT = moduleAccents.transactions;

const TABS: { label: string; status: TransactionStatus | undefined; mono: string }[] = [
    { label: 'Todas', status: undefined, mono: 'TODAS' },
    { label: 'Pendientes', status: 'PENDING', mono: 'PENDIENTES' },
    { label: 'Procesando', status: 'PROCESSING', mono: 'PROCESANDO' },
    { label: 'Contabilizadas', status: 'POSTED', mono: 'CONTABILIZADAS' },
    { label: 'Rechazadas', status: 'REJECTED', mono: 'RECHAZADAS' },
];

const sxInput = {
    '& .MuiInputBase-root': {
        color: palette.paper,
        bgcolor: '#1a1a1a',
        borderRadius: 1,
        '& fieldset': { borderColor: palette.line },
        '&:hover fieldset': { borderColor: '#666' },
        '&.Mui-focused fieldset': { borderColor: ACCENT },
    },
    '& .MuiInputLabel-root': {
        color: '#888',
        fontFamily: fonts.mono,
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
    },
    '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
    '& .MuiSelect-icon': { color: '#888' },
} as const;

function emptyLine(): ManualAjusteLine {
    return { cuenta_puc: '', tipo_movimiento: 'debito', valor: 0, descripcion: '' };
}

function AjusteModal({
    open,
    onClose,
    companyNit,
}: {
    open: boolean;
    onClose: () => void;
    companyNit: string;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [fecha, setFecha] = useState(today);
    const [concepto, setConcepto] = useState('');
    const [lines, setLines] = useState<ManualAjusteLine[]>([emptyLine(), emptyLine()]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { mutateAsync, isPending } = useCreateManualAjuste();

    const totalDebitos = lines.reduce(
        (s, l) => s + (l.tipo_movimiento === 'debito' ? (l.valor || 0) : 0),
        0
    );
    const totalCreditos = lines.reduce(
        (s, l) => s + (l.tipo_movimiento === 'credito' ? (l.valor || 0) : 0),
        0
    );
    const balance = totalDebitos - totalCreditos;
    const isBalanced = Math.abs(balance) < 0.01;

    const updateLine = (i: number, field: keyof ManualAjusteLine, value: string | number) => {
        setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
    };

    const addLine = () => setLines((prev) => [...prev, emptyLine()]);

    const removeLine = (i: number) => {
        if (lines.length <= 2) return;
        setLines((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleClose = () => {
        setFecha(today);
        setConcepto('');
        setLines([emptyLine(), emptyLine()]);
        setSubmitError(null);
        setSuccess(false);
        onClose();
    };

    const handleSubmit = async () => {
        setSubmitError(null);
        if (!concepto.trim()) {
            setSubmitError('El concepto es requerido.');
            return;
        }
        if (!isBalanced) {
            setSubmitError('El asiento no está cuadrado (débitos ≠ créditos).');
            return;
        }
        const validLines = lines.filter((l) => l.cuenta_puc.trim() && l.valor > 0);
        if (validLines.length < 2) {
            setSubmitError('Se requieren al menos 2 líneas con cuenta PUC y valor.');
            return;
        }
        try {
            await mutateAsync({
                company_nit: companyNit,
                fecha,
                concepto: concepto.trim(),
                lines: validLines,
            });
            setSuccess(true);
            setTimeout(() => handleClose(), 1200);
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : 'Error al crear la nota de ajuste.');
        }
    };

    const fmtCOP = (n: number) =>
        n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#111',
                    border: `1px solid ${palette.line}`,
                    borderRadius: 2,
                    color: palette.paper,
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    color: ACCENT,
                    borderBottom: `1px solid ${palette.line}`,
                    pb: 2,
                }}
            >
                // NUEVA NOTA DE AJUSTE CONTABLE
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Nota de ajuste creada correctamente.
                    </Alert>
                )}
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
                        {submitError}
                    </Alert>
                )}

                {/* Header fields */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <TextField
                        label="Fecha"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        size="small"
                        sx={{ ...sxInput, width: 180 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Concepto"
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                        size="small"
                        sx={{ ...sxInput, flex: 1, minWidth: 240 }}
                        placeholder="Descripción del ajuste contable"
                    />
                    <TextField
                        label="NIT empresa"
                        value={companyNit}
                        size="small"
                        sx={{ ...sxInput, width: 160 }}
                        disabled
                    />
                </Box>

                {/* Lines table header */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '140px 120px 140px 1fr 40px',
                        gap: 1,
                        mb: 1,
                        px: 0.5,
                    }}
                >
                    {['CUENTA PUC', 'TIPO', 'VALOR', 'DESCRIPCIÓN', ''].map((h) => (
                        <Typography
                            key={h}
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                letterSpacing: '0.12em',
                                color: '#666',
                            }}
                        >
                            {h}
                        </Typography>
                    ))}
                </Box>

                {/* Lines */}
                {lines.map((line, i) => (
                    <Box
                        key={i}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '140px 120px 140px 1fr 40px',
                            gap: 1,
                            mb: 1,
                            alignItems: 'center',
                        }}
                    >
                        <TextField
                            value={line.cuenta_puc}
                            onChange={(e) => updateLine(i, 'cuenta_puc', e.target.value)}
                            size="small"
                            placeholder="ej. 130505"
                            sx={sxInput}
                        />
                        <FormControl size="small" sx={sxInput}>
                            <Select
                                value={line.tipo_movimiento}
                                onChange={(e) =>
                                    updateLine(
                                        i,
                                        'tipo_movimiento',
                                        e.target.value as 'debito' | 'credito'
                                    )
                                }
                                sx={{ color: palette.paper }}
                            >
                                <MenuItem value="debito">Débito</MenuItem>
                                <MenuItem value="credito">Crédito</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            type="number"
                            value={line.valor || ''}
                            onChange={(e) => updateLine(i, 'valor', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ min: 0, step: 1 }}
                            sx={sxInput}
                        />
                        <TextField
                            value={line.descripcion}
                            onChange={(e) => updateLine(i, 'descripcion', e.target.value)}
                            size="small"
                            placeholder="Descripción (opcional)"
                            sx={sxInput}
                        />
                        <IconButton
                            onClick={() => removeLine(i)}
                            disabled={lines.length <= 2}
                            size="small"
                            sx={{ color: lines.length <= 2 ? '#333' : palette.error }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))}

                {/* Add row button */}
                <Box
                    component="button"
                    onClick={addLine}
                    sx={{
                        mt: 1,
                        bgcolor: 'transparent',
                        border: `1px dashed ${palette.line}`,
                        borderRadius: 1,
                        color: '#666',
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        py: 0.75,
                        px: 2,
                        cursor: 'pointer',
                        width: '100%',
                        '&:hover': { borderColor: ACCENT, color: ACCENT },
                    }}
                >
                    + AGREGAR LÍNEA
                </Box>

                {/* Running balance */}
                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        border: `1px solid ${isBalanced ? '#2d5a2d' : '#5a2d2d'}`,
                        borderRadius: 1,
                        bgcolor: isBalanced ? hexAlpha('#00ff00', 0.04) : hexAlpha('#ff0000', 0.04),
                        display: 'flex',
                        gap: 4,
                        alignItems: 'center',
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                color: '#666',
                                letterSpacing: '0.1em',
                            }}
                        >
                            DÉBITOS
                        </Typography>
                        <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                            {fmtCOP(totalDebitos)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                color: '#666',
                                letterSpacing: '0.1em',
                            }}
                        >
                            CRÉDITOS
                        </Typography>
                        <Typography sx={{ fontFamily: fonts.mono, color: palette.paper }}>
                            {fmtCOP(totalCreditos)}
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: '#666',
                                letterSpacing: '0.1em',
                            }}
                        >
                            BALANCE
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                color: isBalanced ? '#4caf50' : '#f44336',
                            }}
                        >
                            {isBalanced ? '✓ CUADRADO' : fmtCOP(Math.abs(balance))}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{ borderTop: `1px solid ${palette.line}`, px: 3, py: 2, gap: 1 }}
            >
                <Box
                    component="button"
                    onClick={handleClose}
                    sx={{
                        bgcolor: 'transparent',
                        border: `1px solid ${palette.line}`,
                        borderRadius: 1,
                        color: '#888',
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.12em',
                        px: 3,
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#888' },
                    }}
                >
                    CANCELAR
                </Box>
                <Box
                    component="button"
                    onClick={handleSubmit}
                    disabled={isPending || !isBalanced}
                    sx={{
                        bgcolor: isBalanced ? ACCENT : '#333',
                        color: isBalanced ? palette.ink : '#666',
                        fontFamily: fonts.mono,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        px: 3,
                        py: 1,
                        borderRadius: 1,
                        border: 'none',
                        cursor: isBalanced && !isPending ? 'pointer' : 'not-allowed',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                    }}
                >
                    {isPending ? 'CREANDO...' : 'CREAR NOTA DE AJUSTE'}
                </Box>
            </DialogActions>
        </Dialog>
    );
}

export default function TransactionsPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [processError, setProcessError] = useState<string | null>(null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
    const [editTransaction, setEditTransaction] = useState<TransactionSummary | null>(null);
    const { activeCompany } = useCompany();
    const currentStatus = TABS[tabIndex].status;
    const { data: allData, isLoading, error } = useTransactions();
    const { mutateAsync: deleteTransactionMutate } = useDeleteTransaction();
    const { mutateAsync: deleteByIngestMutate } = useDeleteTransactionsByIngest();
    const { mutateAsync: createMutate, error: createError } = useCreateTransaction();
    const { mutateAsync: updateMutate, error: updateError } = useUpdateTransaction();
    const { mutateAsync: processMutate } = useProcessTransaction();
    const data = currentStatus
        ? (allData ?? []).filter((t) => t.status === currentStatus)
        : allData;
    const isViaB = activeCompany?.locked_pathway === 'work_with_existing';

    const counts = TABS.map((tab) =>
        tab.status === undefined
            ? (allData?.length ?? 0)
            : (allData ?? []).filter((t) => t.status === tab.status).length
    );

    const handleDelete = async (id: string) => {
        try {
            await deleteTransactionMutate(id);
            setDeleteError(null);
        } catch {
            setDeleteError('No se pudo eliminar la transacción. Intenta de nuevo.');
        }
    };

    const handleDeleteByIngest = async (ingestId: string) => {
        try {
            await deleteByIngestMutate(ingestId);
            setDeleteError(null);
        } catch {
            setDeleteError('No se pudo eliminar las transacciones. Intenta de nuevo.');
        }
    };

    const handleEdit = (txn: TransactionSummary) => {
        setEditTransaction(txn);
        setModalOpen(true);
    };

    const handleProcess = async (ingestId: string) => {
        setProcessError(null);
        setProcessingIds((prev) => new Set(prev).add(ingestId));
        try {
            await processMutate(ingestId);
        } catch {
            setProcessError('No se pudo iniciar el procesamiento. Intenta de nuevo.');
        } finally {
            setProcessingIds((prev) => {
                const next = new Set(prev);
                next.delete(ingestId);
                return next;
            });
        }
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1.5 }}>
                <Box
                    component="button"
                    onClick={() => setAjusteModalOpen(true)}
                    sx={{
                        bgcolor: 'transparent',
                        border: `1px solid ${ACCENT}`,
                        color: ACCENT,
                        fontFamily: fonts.mono,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        px: 3,
                        py: 1.25,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': {
                            bgcolor: hexAlpha(ACCENT, 0.08),
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    + NUEVA NOTA DE AJUSTE
                </Box>
                <Box
                    component="button"
                    onClick={() => {
                        setEditTransaction(null);
                        setModalOpen(true);
                    }}
                    sx={{
                        bgcolor: palette.chartreuse,
                        color: palette.ink,
                        fontFamily: fonts.mono,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        px: 3,
                        py: 1.25,
                        borderRadius: 1,
                        border: 'none',
                        cursor: 'pointer',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px rgba(212,255,0,0.3)`,
                        },
                    }}
                >
                    + NUEVA TRANSACCIÓN
                </Box>
            </Box>

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

            {deleteError && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.3)}`,
                        color: palette.paper,
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                    onClose={() => setDeleteError(null)}
                >
                    {deleteError}
                </Alert>
            )}

            {processError && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: hexAlpha(palette.error, 0.08),
                        border: `1px solid ${hexAlpha(palette.error, 0.3)}`,
                        color: palette.paper,
                        '& .MuiAlert-icon': { color: palette.error },
                    }}
                    onClose={() => setProcessError(null)}
                >
                    {processError}
                </Alert>
            )}

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
                        onEdit={handleEdit}
                        onProcess={handleProcess}
                        processingIds={processingIds}
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

            <TransactionFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={async (payload) => {
                    await createMutate(payload);
                    setModalOpen(false);
                }}
                onUpdate={async (id, payload) => {
                    await updateMutate({ id, payload });
                    setModalOpen(false);
                }}
                initialData={editTransaction}
                companyNit={activeCompany?.nit ?? ''}
                loading={false}
                error={createError?.message || updateError?.message || null}
            />

            <AjusteModal
                open={ajusteModalOpen}
                onClose={() => setAjusteModalOpen(false)}
                companyNit={activeCompany?.nit ?? ''}
            />
        </Box>
    );
}
