'use client';

import { useState, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Card,
    CardContent,
    Chip,
    Stack,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Link as MuiLink,
    Skeleton,
} from '@mui/material';
import {
    CloudDone as DoneIcon,
    Upload as StartIcon,
    Clear as ClearIcon,
    UploadFile as UploadFileIcon,
    CheckCircle as CheckCircleIcon,
    PendingOutlined as PendingIcon,
    Error as ErrorIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import NextLink from 'next/link';
import { BrutalistPageHero, BrutalistEmptyState } from '@/components/brutalist';
import { palette, fonts, sxLabelSmall, hexAlpha, moduleAccents } from '@/styles/brutalist';
import DataTable, { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import DropZone from '@/components/upload/DropZone';
import UploadProgress from '@/components/upload/UploadProgress';
import ProcessAuditPanel from '@/components/upload/ProcessAuditPanel';
import FilePreview from '@/components/upload/FilePreview';
import { useUpload } from '@/hooks/useUpload';
import { useViaBUpload } from '@/hooks/useUpload';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import type { TransactionSummary } from '@/hooks/useTransactions';
import { formatDate } from '@/lib/formatters';
import type { ViaBDocType, ViaBSlot } from '@/hooks/useUpload';
import type { TransactionStatus } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIA_B_DOC_TYPES: { docType: ViaBDocType; label: string; description: string }[] = [
    {
        docType: 'balance_general',
        label: 'Balance General',
        description: 'Estado de situación financiera (NIIF PYMES)',
    },
    {
        docType: 'estado_resultados',
        label: 'Estado de Resultados',
        description: 'PyG — ingresos, costos y gastos del período',
    },
    {
        docType: 'libro_auxiliar',
        label: 'Libro Auxiliar',
        description: 'Movimientos detallados por cuenta PUC',
    },
];

const DERIVED_LABELS: Record<string, string> = {
    flujo_de_caja: 'Flujo de Caja',
    cambios_patrimonio: 'Cambios en el Patrimonio',
    notas_estados_financieros: 'Notas a los Estados Financieros',
};

// NIT comes from CompanyContext — no hardcoding needed

// ---------------------------------------------------------------------------
// Via B slot card component
// ---------------------------------------------------------------------------

function ViaBSlotCard({
    slot,
    onFileSelect,
    disabled,
}: {
    slot: ViaBSlot;
    onFileSelect: (file: File | null) => void;
    disabled: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const meta = VIA_B_DOC_TYPES.find((d) => d.docType === slot.docType)!;

    const statusColor =
        slot.status === 'done'
            ? 'success.main'
            : slot.status === 'error'
            ? 'error.main'
            : slot.status === 'uploading' || slot.status === 'extracting'
            ? 'primary.main'
            : 'text.secondary';

    return (
        <Card
            variant="outlined"
            sx={{
                borderColor:
                    slot.status === 'done'
                        ? 'success.main'
                        : slot.status === 'error'
                        ? 'error.main'
                        : slot.file
                        ? 'primary.main'
                        : 'divider',
                transition: 'border-color 0.2s',
                flex: 1,
                minWidth: 0,
            }}
        >
            <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    {meta.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {meta.description}
                </Typography>

                {slot.file ? (
                    <Stack spacing={0.5}>
                        <Typography
                            variant="caption"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: statusColor,
                                fontWeight: 600,
                            }}
                        >
                            {slot.file.name}
                        </Typography>
                        {(slot.status === 'uploading' || slot.status === 'extracting') && (
                            <LinearProgress
                                variant="determinate"
                                value={slot.progress}
                                sx={{ borderRadius: 1, height: 4 }}
                            />
                        )}
                        {slot.status === 'error' && (
                            <Typography variant="caption" color="error.main">
                                {slot.error}
                            </Typography>
                        )}
                    </Stack>
                ) : (
                    <Box
                        onClick={() => !disabled && inputRef.current?.click()}
                        sx={{
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                            py: 1.5,
                            textAlign: 'center',
                            cursor: disabled ? 'default' : 'pointer',
                            '&:hover': disabled ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                    >
                        <UploadFileIcon sx={{ fontSize: 20, color: 'text.disabled', mb: 0.5 }} />
                        <Typography variant="caption" display="block" color="text.disabled">
                            Seleccionar PDF
                        </Typography>
                    </Box>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        onFileSelect(f);
                        e.target.value = '';
                    }}
                />

                {slot.file && slot.status === 'idle' && !disabled && (
                    <Button
                        size="small"
                        variant="text"
                        sx={{ mt: 0.5, fontSize: '0.7rem', color: 'text.disabled' }}
                        onClick={() => onFileSelect(null)}
                    >
                        Cambiar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Recent uploads — reads from backend transactions so it persists
// ---------------------------------------------------------------------------

function RecentUploads() {
    const { data: transactions, isLoading } = useTransactions();
    const recent = transactions?.slice(0, 8) ?? [];

    return (
        <Box sx={{ mt: 6, maxWidth: 1100 }}>
            {/* Section header — brutalist */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                    sx={{
                        width: 30,
                        height: 2,
                        bgcolor: moduleAccents.upload,
                        boxShadow: `0 0 8px ${moduleAccents.upload}`,
                    }}
                />
                <Typography sx={{ ...sxLabelSmall, color: moduleAccents.upload }}>
                    {'// HISTORIAL'}
                </Typography>
            </Box>
            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.6rem', md: '2rem' },
                    fontWeight: 700,
                    color: palette.paper,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    mb: 0.5,
                }}
            >
                Documentos recientes.
            </Typography>
            <Typography
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.92rem',
                    color: palette.paperFaint,
                    fontWeight: 300,
                    mb: 3,
                }}
            >
                Últimas {recent.length} transacciones procesadas para esta empresa.
            </Typography>

            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={48}
                            sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)' }}
                        />
                    ))}
                </Box>
            ) : recent.length === 0 ? (
                <BrutalistEmptyState
                    label="// SIN HISTORIAL"
                    title="No hay documentos procesados"
                    description="Sube archivos arriba para que el pipeline contable los procese y aparezcan aquí."
                    accent={moduleAccents.upload}
                />
            ) : (
                <DataTable
                    columns={recentUploadColumns}
                    rows={recent}
                    rowKey={(row) => row.id}
                    pagination={false}
                    accent={moduleAccents.upload}
                    emptyMessage="No hay documentos procesados"
                />
            )}
        </Box>
    );
}

// Columns for the recent uploads table
const recentUploadColumns: Column<TransactionSummary>[] = [
    {
        key: 'id',
        label: '# Tx',
        width: 110,
        render: (val) => (
            <Box
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: moduleAccents.upload,
                    bgcolor: hexAlpha(moduleAccents.upload, 0.1),
                    border: `1px solid ${hexAlpha(moduleAccents.upload, 0.3)}`,
                    px: 0.75,
                    py: 0.3,
                    borderRadius: 0.5,
                    letterSpacing: '0.05em',
                }}
            >
                {String(val).slice(0, 10)}…
            </Box>
        ),
    },
    {
        key: 'concepto',
        label: 'Concepto',
        render: (val) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: palette.paper,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 280,
                    display: 'inline-block',
                    verticalAlign: 'middle',
                }}
            >
                {String(val) || '—'}
            </Typography>
        ),
    },
    {
        key: 'fecha',
        label: 'Fecha',
        width: 130,
        render: (val) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.78rem',
                    color: palette.paperDim,
                    letterSpacing: '0.02em',
                }}
            >
                {val ? formatDate(String(val)) : '—'}
            </Typography>
        ),
    },
    {
        key: 'nit_emisor',
        label: 'NIT Emisor',
        width: 150,
        render: (val) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    color: palette.paperFaint,
                    letterSpacing: '0.05em',
                }}
            >
                {val ? String(val) : '—'}
            </Typography>
        ),
    },
    {
        key: 'total',
        label: 'Total',
        align: 'right',
        width: 140,
        render: (val) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: palette.paper,
                }}
            >
                ${Number(val ?? 0).toLocaleString('es-CO')}
            </Typography>
        ),
    },
    {
        key: 'status',
        label: 'Estado',
        width: 150,
        render: (val) => <StatusBadge status={val as TransactionStatus} />,
    },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UploadPage() {
    const { activeCompany } = useCompany();
    const [mode, setMode] = useState<'via-a' | 'via-b'>('via-a');

    // Via A (existing pipeline)
    const { files, addFiles, removeFile, clearAll, uploadAll, hasFiles, isUploading, allDone } =
        useUpload();

    // Via B pipeline
    const {
        slots,
        setSlotFile,
        allFilesSelected,
        startUpload,
        resetSlots,
        isUploading: isViaBUploading,
        isPollingDerived,
        derivedStatements,
        derivedError,
        allDone: viaBAllDone,
    } = useViaBUpload();

    const derivedFound = derivedStatements.filter((s) =>
        Object.keys(DERIVED_LABELS).includes(s.statement_type)
    );
    const filesWithAuditState = files.filter(
        (file) => (file.process_id || file.ingest_id) && (file.status === 'done' || file.status === 'error' || Boolean(file.has_warnings))
    );
    const viaBSlotsWithAuditState = slots.filter(
        (slot) => slot.ingest_id && (slot.status === 'done' || slot.status === 'error' || Boolean(slot.has_warnings))
    );
    const hasAuditWarnings = files.some((file) => file.status === 'done' && file.has_warnings);
    const hasErrors = files.some((file) => file.status === 'error');

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_2 // INGESTA"
                title={<>Cargar<br />documentos.</>}
                subtitle="via a · via b · dos flujos"
                lede="Via A construye asientos desde documentos fuente y soporta PDFs, XML, Excel e imágenes escaneadas. Via B importa estados financieros y deriva los demás. Toggle abajo."
                accent={moduleAccents.upload}
                ghostNumber="2"
            />

            {/* No company warning */}
            {!activeCompany && (
                <Alert
                    severity="warning"
                    sx={{
                        mb: 3,
                        bgcolor: hexAlpha(palette.amber, 0.1),
                        color: palette.amber,
                        border: `1px solid ${palette.amber}`,
                        '& .MuiAlert-icon': { color: palette.amber },
                    }}
                >
                    <Typography sx={{ fontWeight: 600 }}>
                        Seleccione una empresa
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem' }}>
                        Debe seleccionar una empresa desde el selector superior antes de subir documentos.
                    </Typography>
                </Alert>
            )}

            {/* Mode selector */}
            <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => { if (v) setMode(v); }}
                size="small"
                sx={{ mb: 3 }}
            >
                <ToggleButton value="via-a" sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>
                    Documentos fuente (Via A)
                </ToggleButton>
                <ToggleButton value="via-b" sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}>
                    Estados financieros (Via B)
                </ToggleButton>
            </ToggleButtonGroup>

            {/* ---------------------------------------------------------------- */}
            {/* VIA A                                                             */}
            {/* ---------------------------------------------------------------- */}
            {mode === 'via-a' && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)' },
                        gap: { xs: 3, xl: 4 },
                        alignItems: 'start',
                        maxWidth: 1240,
                    }}
                >
                    <Box>
                        <DropZone onFilesAccepted={addFiles} disabled={isUploading || !activeCompany} />

                        {!hasFiles && (
                            <Box
                                sx={{
                                    mt: 2,
                                    px: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 22,
                                        height: 2,
                                        bgcolor: moduleAccents.upload,
                                        boxShadow: `0 0 8px ${moduleAccents.upload}`,
                                    }}
                                />
                                <Typography sx={{ ...sxLabelSmall, color: palette.paperGhost }}>
                                    {'// AGREGA ARCHIVOS PARA ACTIVAR EL PANEL DE CONTROL'}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box
                        sx={{
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        {hasFiles ? (
                            <>
                                <Box
                                    sx={{
                                        border: `1px solid ${hexAlpha(moduleAccents.upload, 0.18)}`,
                                        bgcolor: hexAlpha(moduleAccents.upload, 0.04),
                                        borderRadius: 1,
                                        p: { xs: 2, md: 2.5 },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            mb: 1.5,
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ ...sxLabelSmall, color: moduleAccents.upload, mb: 0.4 }}>
                                                {'// PANEL DE CONTROL'}
                                            </Typography>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                Cola de archivos ({files.length})
                                            </Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            startIcon={<ClearIcon />}
                                            onClick={clearAll}
                                            disabled={isUploading}
                                            sx={{ fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0 }}
                                        >
                                            Limpiar
                                        </Button>
                                    </Box>

                                    <UploadProgress files={files} onRemove={removeFile} />
                                    <Divider sx={{ my: 2 }} />

                                    {!allDone && (
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<StartIcon />}
                                            onClick={uploadAll}
                                            disabled={isUploading || files.every((f) => f.status !== 'idle')}
                                            fullWidth
                                            id="btn-start-upload"
                                            sx={{ py: 1.5 }}
                                        >
                                            {isUploading
                                                ? 'Procesando…'
                                                : `Iniciar ingesta (${files.filter((f) => f.status === 'idle').length} archivos)`}
                                        </Button>
                                    )}

                                    {allDone && (
                                        <Alert
                                            icon={hasErrors ? undefined : hasAuditWarnings ? <PendingIcon /> : <DoneIcon />}
                                            severity={hasErrors ? 'error' : hasAuditWarnings ? 'warning' : 'success'}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {hasErrors ? (
                                                <>
                                                    Uno o más archivos no pudieron procesarse. Revisa los detalles de error abajo y corrige antes de continuar.
                                                </>
                                            ) : hasAuditWarnings ? (
                                                <>
                                                    La contabilización terminó, pero el auditor dejó observaciones en algunos archivos. Revisa el resumen abajo antes de continuar.
                                                </>
                                            ) : (
                                                <>
                                                    Todos los archivos fueron procesados y contabilizados automáticamente. Puedes ver el resultado en{' '}
                                                    <strong>Transacciones</strong> y <strong>Libros Contables</strong>.
                                                </>
                                            )}
                                        </Alert>
                                    )}
                                </Box>

                                {filesWithAuditState.length > 0 && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {filesWithAuditState.map((file) => (
                                            <ProcessAuditPanel
                                                key={`${file.id}-audit`}
                                                file={{
                                                    status: file.status === 'error' ? 'error' : 'done',
                                                    error: file.error,
                                                    error_category: file.error_category,
                                                    error_code: file.error_code,
                                                    remediation: file.remediation,
                                                    has_warnings: file.has_warnings,
                                                    process_id: file.process_id,
                                                    ingest_id: file.ingest_id,
                                                    trace_kind: file.process_id ? 'process' : 'ingest',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}

                                {files.some((f) => f.status === 'done') && (
                                    <Box
                                        sx={{
                                            borderTop: `1px solid ${palette.line}`,
                                            pt: 2,
                                        }}
                                    >
                                        <FilePreview files={files} />
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box
                                sx={{
                                    minHeight: { xl: 404 },
                                    border: `1px solid ${hexAlpha(palette.paperGhost, 0.14)}`,
                                    bgcolor: hexAlpha(palette.paper, 0.02),
                                    borderRadius: 1,
                                    p: { xs: 2, md: 2.5 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                }}
                            >
                                <Box>
                                    <Typography sx={{ ...sxLabelSmall, color: moduleAccents.upload, mb: 1 }}>
                                        {'// PANEL DE CONTROL'}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.display,
                                            fontSize: { xs: '1.25rem', md: '1.6rem' },
                                            fontWeight: 700,
                                            color: palette.paper,
                                            letterSpacing: '-0.03em',
                                            lineHeight: 1.05,
                                            mb: 1,
                                        }}
                                    >
                                        La cola, la auditoría y la extracción aparecerán aquí.
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: '0.92rem',
                                            color: palette.paperFaint,
                                            maxWidth: 42 * 8,
                                        }}
                                    >
                                        Cuando cargues documentos fuente, esta columna mostrará el progreso del pipeline, los avisos del auditor y los datos extraídos listos para revisar.
                                    </Typography>
                                </Box>

                                <Stack spacing={1.2}>
                                    {[
                                        'Cola de archivos con estado en vivo',
                                        'Resumen final con warnings del auditor',
                                        'Trace expandible cuando un archivo falla o queda pendiente',
                                        'Vista rápida de datos extraídos al completar',
                                    ].map((item, idx) => (
                                        <Box
                                            key={item}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.25,
                                                py: 1,
                                                borderTop: idx === 0 ? `1px solid ${palette.line}` : undefined,
                                                borderBottom: `1px solid ${palette.lineFaint}`,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.66rem',
                                                    color: moduleAccents.upload,
                                                    letterSpacing: '0.16em',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {`0${idx + 1}`}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontFamily: fonts.body,
                                                    fontSize: '0.85rem',
                                                    color: palette.paper,
                                                }}
                                            >
                                                {item}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* VIA B                                                             */}
            {/* ---------------------------------------------------------------- */}
            {mode === 'via-b' && (
                <Box sx={{ maxWidth: 860 }}>
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        Sube los 3 estados financieros de primer nivel. El backend reconocerá el tipo de
                        documento automáticamente y derivará <strong>flujo de caja</strong>,{' '}
                        <strong>cambios en el patrimonio</strong> y{' '}
                        <strong>notas a los estados financieros</strong>.
                    </Alert>

                    {/* 3 upload slots */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                        {slots.map((slot) => (
                            <ViaBSlotCard
                                key={slot.docType}
                                slot={slot}
                                onFileSelect={(f) => setSlotFile(slot.docType, f)}
                                disabled={isViaBUploading || !activeCompany}
                            />
                        ))}
                    </Stack>

                    {/* Action button */}
                    {!viaBAllDone && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={isViaBUploading ? <CircularProgress size={18} color="inherit" /> : <StartIcon />}
                            onClick={startUpload}
                            disabled={!allFilesSelected || isViaBUploading || !activeCompany}
                            fullWidth
                            sx={{ py: 1.5, mb: 2 }}
                        >
                            {isViaBUploading
                                ? isPollingDerived
                                    ? 'Esperando documentos derivados…'
                                    : 'Subiendo archivos…'
                                : 'Iniciar ingesta Via B'}
                        </Button>
                    )}

                    {/* Derived documents status */}
                    {(isPollingDerived || viaBAllDone || derivedError) && (
                        <Card variant="outlined" sx={{ mt: 1 }}>
                            <CardContent>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                    Documentos derivados
                                </Typography>
                                <List dense disablePadding>
                                    {Object.entries(DERIVED_LABELS).map(([type, label]) => {
                                        const found = derivedFound.some((s) => s.statement_type === type);
                                        return (
                                            <ListItem key={type} disableGutters>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    {found ? (
                                                        <CheckCircleIcon
                                                            fontSize="small"
                                                            sx={{ color: 'success.main' }}
                                                        />
                                                    ) : isPollingDerived ? (
                                                        <PendingIcon
                                                            fontSize="small"
                                                            sx={{ color: 'text.disabled' }}
                                                        />
                                                    ) : (
                                                        <ErrorIcon
                                                            fontSize="small"
                                                            sx={{ color: 'error.main' }}
                                                        />
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={label}
                                                    primaryTypographyProps={{
                                                        variant: 'body2',
                                                        color: found ? 'success.main' : 'text.secondary',
                                                    }}
                                                />
                                                {found && (
                                                    <Chip
                                                        label="generado"
                                                        size="small"
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </ListItem>
                                        );
                                    })}
                                </List>

                                {derivedError && (
                                    <Alert severity="error" sx={{ mt: 2, borderRadius: 1.5 }}>
                                        {derivedError}
                                    </Alert>
                                )}

                                {viaBAllDone && (
                                    <Alert
                                        icon={<DoneIcon />}
                                        severity="success"
                                        sx={{ mt: 2, borderRadius: 1.5 }}
                                        action={
                                            <MuiLink
                                                component={NextLink}
                                                href="/reports"
                                                underline="none"
                                            >
                                                <Button
                                                    color="inherit"
                                                    size="small"
                                                    endIcon={<ArrowForwardIcon />}
                                                >
                                                    Ver reportes
                                                </Button>
                                            </MuiLink>
                                        }
                                    >
                                        Los 7 documentos financieros están listos.
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {viaBSlotsWithAuditState.length > 0 && (
                        <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {viaBSlotsWithAuditState.map((slot) => (
                                <ProcessAuditPanel
                                    key={`${slot.docType}-${slot.ingest_id}-audit`}
                                    file={{
                                        status: slot.status === 'error' ? 'error' : 'done',
                                        error: slot.error,
                                        error_category: slot.error_category,
                                        error_code: slot.error_code,
                                        remediation: slot.remediation,
                                        has_warnings: slot.has_warnings,
                                        ingest_id: slot.ingest_id,
                                        trace_kind: 'ingest',
                                        label: slot.label,
                                    }}
                                />
                            ))}
                        </Box>
                    )}

                    {viaBAllDone && (
                        <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={resetSlots}
                            sx={{ mt: 2, color: 'text.secondary' }}
                        >
                            Reiniciar Via B
                        </Button>
                    )}
                </Box>
            )}

            {/* Recent uploads — persists across navigation */}
            <RecentUploads />
        </Box>
    );
}
