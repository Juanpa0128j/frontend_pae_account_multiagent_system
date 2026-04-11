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
import PageHeader from '@/components/layout/PageHeader';
import DropZone from '@/components/upload/DropZone';
import UploadProgress from '@/components/upload/UploadProgress';
import FilePreview from '@/components/upload/FilePreview';
import { useUpload } from '@/hooks/useUpload';
import { useViaBUpload } from '@/hooks/useUpload';
import type { ViaBDocType, ViaBSlot } from '@/hooks/useUpload';

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
// Main page
// ---------------------------------------------------------------------------

export default function UploadPage() {
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

    return (
        <Box>
            <PageHeader
                title="Cargar documentos"
                subtitle="Sube documentos fuente (Via A) o estados financieros de primer nivel para derivación automática (Via B)."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Cargar documentos' }]}
            />

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
                <Box sx={{ maxWidth: 700 }}>
                    <DropZone onFilesAccepted={addFiles} disabled={isUploading} />

                    {hasFiles && (
                        <Box sx={{ mt: 3 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1.5,
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Cola de archivos ({files.length})
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<ClearIcon />}
                                    onClick={clearAll}
                                    disabled={isUploading}
                                    sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
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
                                <Alert icon={<DoneIcon />} severity="success" sx={{ borderRadius: 2 }}>
                                    Todos los archivos han sido procesados. Ve a{' '}
                                    <strong>Transacciones → Pendientes</strong> para contabilizarlos.
                                </Alert>
                            )}
                        </Box>
                    )}

                    {files.some((f) => f.status === 'done') && (
                        <Box sx={{ mt: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <FilePreview files={files} />
                        </Box>
                    )}
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
                                disabled={isViaBUploading}
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
                            disabled={!allFilesSelected || isViaBUploading}
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
