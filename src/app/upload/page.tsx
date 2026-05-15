'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    PendingOutlined as PendingIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import NextLink from 'next/link';
import { BrutalistPageHero, BrutalistEmptyState } from '@/components/brutalist';
import { palette, fonts, sxLabelSmall, hexAlpha, moduleAccents, motion } from '@/styles/brutalist';
import DataTable, { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import DropZone from '@/components/upload/DropZone';
import UploadProgress from '@/components/upload/UploadProgress';
import ProcessAuditPanel from '@/components/upload/ProcessAuditPanel';
import LivePipelineTimeline from '@/components/upload/LivePipelineTimeline';
import FilePreview from '@/components/upload/FilePreview';
import ClassificationReviewCard from '@/components/upload/ClassificationReviewCard';
import BrutalistParsingSelector from '@/components/upload/BrutalistParsingSelector';
import { useUpload } from '@/hooks/useUpload';
import { useViaBUpload } from '@/hooks/useUpload';
import { usePendingReviewJobs } from '@/hooks';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompany } from '@/context/CompanyContext';
import { useUploadSession } from '@/context/UploadSessionContext';
import type { TransactionSummary } from '@/hooks/useTransactions';
import { formatDate } from '@/lib/formatters';
import { cancelIngest } from '@/lib/api';
import type { ViaBDocType, ViaBSlot } from '@/hooks/useUpload';
import type { TransactionStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

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

// NIT comes from CompanyContext — no hardcoding needed

// ---------------------------------------------------------------------------
// Via B slot card component
// ---------------------------------------------------------------------------

function ViaBSlotCard({
    slot,
    onFileSelect,
    onSetParserMode,
    disabled,
}: {
    slot: ViaBSlot;
    onFileSelect: (file: File | null) => void;
    onSetParserMode?: (mode: string) => void;
    disabled: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const meta = VIA_B_DOC_TYPES.find((d) => d.docType === slot.docType)!;

    const slotAccent: Record<string, string> = {
        balance_general: palette.accent,
        estado_resultados: palette.pink,
        libro_auxiliar: palette.amber,
    };
    const baseAccent = slotAccent[slot.docType] ?? moduleAccents.upload;

    const accentColor =
        slot.status === 'done'
            ? palette.chartreuse
            : slot.status === 'error'
              ? palette.error
              : slot.file
                ? baseAccent
                : hexAlpha(palette.paper, 0.3);

    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                border: `1px solid ${accentColor}`,
                p: { xs: 2, md: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                position: 'relative',
                '&:hover': disabled
                    ? {}
                    : {
                          borderColor: baseAccent,
                          '& .via-b-dropzone': { borderColor: baseAccent },
                      },
            }}
        >
            {/* Accent bar top */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: accentColor,
                    transition: `background-color ${motion.duration.sm}`,
                }}
            />

            {/* Label + title */}
            <Box>
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        letterSpacing: '0.22em',
                        color: baseAccent,
                        textTransform: 'uppercase',
                        mb: 0.5,
                    }}
                >
                    {'// ' + slot.docType.toUpperCase()}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                        fontWeight: 700,
                        color: palette.paper,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                    }}
                >
                    {meta.label}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.8rem',
                        color: palette.paperDim,
                        mt: 0.4,
                    }}
                >
                    {meta.description}
                </Typography>
            </Box>

            {/* Dropzone / file state */}
            {slot.file ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            letterSpacing: '0.08em',
                            color: accentColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {slot.file.name}
                    </Typography>
                    {(slot.status === 'uploading' || slot.status === 'extracting') && (
                        <Box
                            sx={{
                                position: 'relative',
                                height: 2,
                                bgcolor: hexAlpha(palette.paper, 0.08),
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: `${slot.progress}%`,
                                    bgcolor: moduleAccents.upload,
                                    transition: 'width 0.3s linear',
                                    boxShadow: `0 0 6px ${moduleAccents.upload}`,
                                }}
                            />
                        </Box>
                    )}
                    {slot.status === 'error' && (
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: palette.error,
                                letterSpacing: '0.1em',
                            }}
                        >
                            {slot.error}
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box
                    className="via-b-dropzone"
                    onClick={() => !disabled && inputRef.current?.click()}
                    sx={{
                        border: `1px dashed ${hexAlpha(palette.paper, 0.4)}`,
                        py: 2,
                        textAlign: 'center',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: `border-color ${motion.duration.sm} ${motion.snap}`,
                        '&:hover': disabled
                            ? {}
                            : {
                                  borderColor: baseAccent,
                                  bgcolor: hexAlpha(baseAccent, 0.06),
                              },
                    }}
                >
                    <UploadFileIcon
                        sx={{ fontSize: 22, color: hexAlpha(palette.paper, 0.6), mb: 0.5 }}
                    />
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            color: hexAlpha(palette.paper, 0.6),
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Seleccionar PDF
                    </Typography>
                </Box>
            )}

            {/* Per-slot parsing mode selector */}
            {slot.file && slot.status === 'idle' && onSetParserMode && (
                <Box sx={{ mt: 0.5 }}>
                    <BrutalistParsingSelector
                        value={slot.parser_mode || 'fast'}
                        onChange={onSetParserMode}
                    />
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

            {slot.file &&
                !disabled &&
                (() => {
                    const VIA_B_TYPES = new Set([
                        'balance_general',
                        'estado_resultados',
                        'libro_auxiliar',
                    ]);
                    const isViaADetected =
                        (slot.status === 'review' &&
                            slot.classification_review != null &&
                            !VIA_B_TYPES.has(slot.classification_review.predicted_type ?? '')) ||
                        (slot.status === 'error' && slot.error_category === 'wrong_upload_area');
                    if (!isViaADetected && slot.status !== 'idle') return null;
                    return (
                        <Box
                            onClick={() => onFileSelect(null)}
                            sx={{
                                alignSelf: 'flex-start',
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                letterSpacing: '0.22em',
                                color: baseAccent,
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                '&:hover': { color: palette.error },
                                transition: 'color 0.15s',
                            }}
                        >
                            {'// CAMBIAR'}
                        </Box>
                    );
                })()}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Recent uploads — reads from backend transactions so it persists
// ---------------------------------------------------------------------------

function RecentUploads() {
    const { data: transactions, isLoading } = useTransactions();
    const { activeCompany } = useCompany();
    const { uploadMode } = useUploadSession();
    const recent = transactions?.slice(0, 8) ?? [];

    // Vía B uploads don't produce transactions — they create financial statements.
    // Showing this transactions-based panel for a Vía B-locked company is misleading.
    const isViaBContext =
        uploadMode === 'via-b' || activeCompany?.locked_pathway === 'work_with_existing';

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
                {isViaBContext
                    ? 'Vía B: los uploads producen estados financieros, no transacciones. Esta lista solo aplica a Vía A.'
                    : `Últimas ${recent.length} transacciones procesadas para esta empresa.`}
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
                    title={
                        isViaBContext ? 'Sin transacciones (Vía B)' : 'No hay documentos procesados'
                    }
                    description={
                        isViaBContext
                            ? 'En Vía B se cargan estados financieros, no transacciones individuales. Revisa los estados cargados en la página de Reportes o ejecuta la derivación manual.'
                            : 'Sube archivos arriba para que el pipeline contable los procese y aparezcan aquí.'
                    }
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
        width: 90,
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
        width: 110,
        hideOnMobile: true,
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
        width: 120,
        hideOnMobile: true,
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
        width: 120,
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
        width: 120,
        render: (val) => <StatusBadge status={val as TransactionStatus} />,
    },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UploadPage() {
    const { activeCompany } = useCompany();
    const { uploadMode: mode, setUploadMode: setMode } = useUploadSession();

    const lockedVia =
        activeCompany?.locked_pathway === 'build_from_scratch'
            ? 'via-a'
            : activeCompany?.locked_pathway === 'work_with_existing'
              ? 'via-b'
              : null;

    // Auto-switch to the locked tab whenever the lock changes — covers both
    // company switches and the first upload that flips locked_pathway from
    // null to a value mid-session.
    useEffect(() => {
        if (lockedVia && mode !== lockedVia) setMode(lockedVia);
    }, [lockedVia, mode, setMode]);

    // Via A (existing pipeline)
    const {
        files,
        addFiles,
        removeFile,
        clearAll,
        uploadAll,
        resumeIngest,
        resumeAfterConfirm,
        hasFiles,
        isUploading,
        allDone,
        setFileParserMode,
    } = useUpload();

    const cancelUpload = async (fileId: string) => {
        const fileState = files.find((f) => f.id === fileId);
        if (fileState?.ingest_id) {
            await cancelIngest(fileState.ingest_id);
        }
        removeFile(fileId);
    };

    // Via B pipeline
    const {
        slots,
        setSlotFile,
        setSlotParserMode,
        hasAnyFileSelected,
        startUpload,
        resumeSlot,
        resetSlots,
        isUploading: isViaBUploading,
        allDone: viaBAllDone,
    } = useViaBUpload();
    const viaBSlotsWithAuditState = slots.filter(
        (slot) =>
            slot.ingest_id &&
            (slot.status === 'done' || slot.status === 'error' || Boolean(slot.has_warnings))
    );
    const viaBSlotsPendingReview = slots.filter(
        (slot) => slot.status === 'review' && slot.classification_review
    );
    const hasAuditWarnings = files.some((file) => file.status === 'done' && file.has_warnings);
    const hasErrors = files.some((file) => file.status === 'error');
    const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const activeNit = activeCompany?.nit ?? null;
    const { data: pendingReviewJobsRaw } = usePendingReviewJobs(activeNit);

    // Filter out jobs already tracked in current session
    const sessionProcessIds = useMemo(
        () => new Set(files.filter((f) => f.process_id).map((f) => f.process_id)),
        [activeNit, files]
    );
    const pendingReviewJobs = (pendingReviewJobsRaw ?? []).filter(
        (job) => !sessionProcessIds.has(job.process_id)
    );

    const onPendingReviewConfirmSuccess = useCallback(() => {
        void queryClient.invalidateQueries({
            queryKey: ['pendingReviewJobs', activeNit],
        });
    }, [activeNit, queryClient]);

    const hasFileAuditState = (file: (typeof files)[number]) =>
        (file.process_id || file.ingest_id) &&
        (file.status === 'done' ||
            file.status === 'error' ||
            file.has_warnings ||
            (file.status === 'processing' && !!file.process_id));

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_2 // INGESTA"
                title={
                    <>
                        Cargar
                        <br />
                        documentos.
                    </>
                }
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
                    <Typography sx={{ fontWeight: 600 }}>Seleccione una empresa</Typography>
                    <Typography sx={{ fontSize: '0.9rem' }}>
                        Debe seleccionar una empresa desde el selector superior antes de subir
                        documentos.
                    </Typography>
                </Alert>
            )}

            {/* Mode selector */}
            <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => {
                    if (v) setMode(v);
                }}
                size="small"
                sx={{ mb: 3 }}
            >
                <ToggleButton
                    value="via-a"
                    disabled={lockedVia === 'via-b'}
                    sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    Documentos fuente (Via A)
                </ToggleButton>
                <ToggleButton
                    value="via-b"
                    disabled={lockedVia === 'via-a'}
                    sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}
                >
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
                        gridTemplateColumns: {
                            xs: '1fr',
                            lg: 'minmax(340px, 0.85fr) minmax(0, 1.15fr)',
                        },
                        gap: { xs: 3, lg: 4 },
                        alignItems: 'start',
                        maxWidth: 1280,
                    }}
                >
                    {/* Left column — sticky, holds dropzone + extraction summary + recent docs */}
                    <Box
                        sx={{
                            position: { xs: 'relative', lg: 'sticky' },
                            top: { lg: 3 },
                            alignSelf: { lg: 'start' },
                        }}
                    >
                        {lockedVia === 'via-b' && (
                            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                                <Typography sx={{ fontWeight: 600 }}>
                                    Empresa bloqueada a Vía B
                                </Typography>
                                <Typography sx={{ fontSize: '0.9rem' }}>
                                    Esta empresa ya tiene estados financieros subidos por Vía B. No
                                    se pueden mezclar documentos fuente de Vía A.
                                </Typography>
                            </Alert>
                        )}
                        <DropZone
                            onFilesAccepted={addFiles}
                            disabled={isUploading || !activeCompany || lockedVia === 'via-b'}
                        />

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

                        {/* Extraction summary — uses dead space below dropzone */}
                        {files.some((f) => f.status === 'done') && (
                            <Box sx={{ mt: 3 }}>
                                <FilePreview files={files} />
                            </Box>
                        )}

                        {/* Recent uploads — pinned below extraction summary */}
                        <Box sx={{ mt: 4 }}>
                            <RecentUploads />
                        </Box>
                    </Box>

                    {/* Right column — scrolls, holds file queue with inline audit */}
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
                                            <Typography
                                                sx={{
                                                    ...sxLabelSmall,
                                                    color: moduleAccents.upload,
                                                    mb: 0.4,
                                                }}
                                            >
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
                                            sx={{
                                                fontSize: '0.75rem',
                                                color: 'text.secondary',
                                                flexShrink: 0,
                                            }}
                                        >
                                            Limpiar
                                        </Button>
                                    </Box>

                                    <UploadProgress
                                        files={files}
                                        onRemove={removeFile}
                                        onSetParserMode={setFileParserMode}
                                        expandedId={expandedAuditId}
                                        onToggleExpand={(id) =>
                                            setExpandedAuditId((curr) => (curr === id ? null : id))
                                        }
                                        renderExpanded={(fs) =>
                                            fs.status === 'review' && fs.classification_review ? (
                                                <ClassificationReviewCard
                                                    variant="inline"
                                                    fileName={fs.file.name}
                                                    review={fs.classification_review}
                                                    onConfirm={(docType) =>
                                                        resumeIngest(fs.id, docType)
                                                    }
                                                    onCancel={() => cancelUpload(fs.id)}
                                                />
                                            ) : fs.status === 'processing' && fs.process_id ? (
                                                <LivePipelineTimeline processId={fs.process_id} />
                                            ) : hasFileAuditState(fs) ? (
                                                <ProcessAuditPanel
                                                    file={{
                                                        status:
                                                            fs.status === 'error'
                                                                ? 'error'
                                                                : 'done',
                                                        label: fs.file.name,
                                                        error: fs.error,
                                                        error_category: fs.error_category,
                                                        error_code: fs.error_code,
                                                        remediation: fs.remediation,
                                                        has_warnings: fs.has_warnings,
                                                        process_id: fs.process_id,
                                                        ingest_id: fs.ingest_id,
                                                        trace_kind: fs.process_id
                                                            ? 'process'
                                                            : 'ingest',
                                                    }}
                                                    onConfirmSuccess={(processId) =>
                                                        resumeAfterConfirm(fs.id, processId)
                                                    }
                                                />
                                            ) : null
                                        }
                                    />
                                    <Divider sx={{ my: 2 }} />

                                    {!allDone && (
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<StartIcon />}
                                            onClick={uploadAll}
                                            disabled={
                                                isUploading ||
                                                !activeCompany ||
                                                files.every((f) => f.status !== 'idle')
                                            }
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
                                            icon={
                                                hasErrors ? undefined : hasAuditWarnings ? (
                                                    <PendingIcon />
                                                ) : (
                                                    <DoneIcon />
                                                )
                                            }
                                            severity={
                                                hasErrors
                                                    ? 'error'
                                                    : hasAuditWarnings
                                                      ? 'warning'
                                                      : 'success'
                                            }
                                            sx={{ borderRadius: 2 }}
                                        >
                                            {hasErrors ? (
                                                <>
                                                    Uno o más archivos no pudieron procesarse.
                                                    Expande los archivos en la cola para revisar los
                                                    detalles del trace.
                                                </>
                                            ) : hasAuditWarnings ? (
                                                <>
                                                    La contabilización terminó, pero el auditor dejó
                                                    observaciones. Expande los archivos en la cola
                                                    para revisar los detalles.
                                                </>
                                            ) : (
                                                <>
                                                    Todos los archivos fueron procesados y
                                                    contabilizados automáticamente. Puedes ver el
                                                    resultado en <strong>Transacciones</strong> y{' '}
                                                    <strong>Libros Contables</strong>.
                                                </>
                                            )}
                                        </Alert>
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Box
                                sx={{
                                    minHeight: { lg: 404 },
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
                                    <Typography
                                        sx={{ ...sxLabelSmall, color: moduleAccents.upload, mb: 1 }}
                                    >
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
                                        Cuando cargues documentos fuente, esta columna mostrará el
                                        progreso del pipeline, los avisos del auditor inline y los
                                        datos extraídos listos para revisar.
                                    </Typography>
                                </Box>

                                <Stack spacing={1.2}>
                                    {[
                                        'Cola de archivos con estado en vivo',
                                        'Trace expandible inline por archivo',
                                        'Resumen de extracción fijado en la columna izquierda',
                                        'Vista rápida de datos extraídos al completar',
                                    ].map((item, idx) => (
                                        <Box
                                            key={item}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.25,
                                                py: 1,
                                                borderTop:
                                                    idx === 0
                                                        ? `1px solid ${palette.line}`
                                                        : undefined,
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

                        {/* ---- REVISIONES PENDIENTES (stuck HITL jobs from prior sessions) ---- */}
                        {pendingReviewJobs.length > 0 && (
                            <Box
                                sx={{
                                    border: `1px solid ${hexAlpha(palette.amber, 0.3)}`,
                                    bgcolor: hexAlpha(palette.amber, 0.04),
                                    borderRadius: 1,
                                    p: { xs: 2, md: 2.5 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 22,
                                            height: 2,
                                            bgcolor: palette.amber,
                                            boxShadow: `0 0 8px ${palette.amber}`,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            ...sxLabelSmall,
                                            color: palette.amber,
                                        }}
                                    >
                                        {'// REVISIONES PENDIENTES'}
                                    </Typography>
                                </Box>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.body,
                                        fontSize: '0.85rem',
                                        color: palette.paperDim,
                                    }}
                                >
                                    {`${pendingReviewJobs.length} proceso${pendingReviewJobs.length > 1 ? 's' : ''} esperando confirmación del auditor de sesiones anteriores.`}
                                </Typography>
                                {pendingReviewJobs.map((job) => (
                                    <ProcessAuditPanel
                                        key={job.process_id}
                                        file={{
                                            status: 'done',
                                            has_warnings: true,
                                            process_id: job.process_id,
                                            trace_kind: 'process',
                                            label: `Proceso ${(job.process_id.slice(-8) || job.process_id).toUpperCase()}`,
                                        }}
                                        onConfirmSuccess={onPendingReviewConfirmSuccess}
                                    />
                                ))}
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
                    {lockedVia === 'via-a' ? (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                            <Typography sx={{ fontWeight: 600 }}>
                                Empresa bloqueada a Vía A
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem' }}>
                                Esta empresa ya tiene documentos fuente subidos por Vía A. No se
                                pueden mezclar estados financieros de Vía B.
                            </Typography>
                        </Alert>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            Sube los 3 estados financieros de primer nivel. El backend reconocerá el
                            tipo de documento automáticamente. La derivación de flujo de caja,
                            cambios en patrimonio y notas se ejecuta manualmente desde la sección de
                            reportes una vez los 3 documentos estén cargados.
                        </Alert>
                    )}

                    {/* 3 upload slots */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                        {slots.map((slot) => (
                            <ViaBSlotCard
                                key={slot.docType}
                                slot={slot}
                                onFileSelect={(f) => setSlotFile(slot.docType, f)}
                                onSetParserMode={(mode) => setSlotParserMode(slot.docType, mode)}
                                disabled={
                                    isViaBUploading || !activeCompany || lockedVia === 'via-a'
                                }
                            />
                        ))}
                    </Stack>

                    {viaBSlotsPendingReview.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.22em',
                                    color: moduleAccents.upload,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {'// REVISION DE CLASIFICACION'}
                            </Typography>
                            {viaBSlotsPendingReview.map((slot) => (
                                <ClassificationReviewCard
                                    key={`${slot.docType}-review`}
                                    fileName={slot.file?.name ?? slot.docType}
                                    review={slot.classification_review!}
                                    onConfirm={(docType) => resumeSlot(slot.docType, docType)}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Action button */}
                    {!viaBAllDone && (
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={
                                isViaBUploading ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <StartIcon />
                                )
                            }
                            onClick={startUpload}
                            disabled={
                                !hasAnyFileSelected ||
                                isViaBUploading ||
                                !activeCompany ||
                                viaBSlotsPendingReview.length > 0
                            }
                            fullWidth
                            sx={{ py: 1.5, mb: 2 }}
                        >
                            {isViaBUploading ? 'Subiendo archivos…' : 'Iniciar ingesta Vía B'}
                        </Button>
                    )}

                    {/* Manual derivation hint after upload completes */}
                    {viaBAllDone && (
                        <Alert
                            icon={<DoneIcon />}
                            severity="success"
                            sx={{ mt: 1, borderRadius: 1.5 }}
                            action={
                                <MuiLink
                                    component={NextLink}
                                    href="/reports/derivation"
                                    underline="none"
                                >
                                    <Button
                                        color="inherit"
                                        size="small"
                                        endIcon={<ArrowForwardIcon />}
                                    >
                                        Ir a derivación
                                    </Button>
                                </MuiLink>
                            }
                        >
                            Documentos cargados. Cuando tengas Balance, Estado de Resultados y Libro
                            Auxiliar para un mismo período, puedes ejecutar la derivación
                            manualmente.
                        </Alert>
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
        </Box>
    );
}
