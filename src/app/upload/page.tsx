'use client';

import { Box, Typography, Button, Alert, Divider } from '@mui/material';
import {
    CloudDone as DoneIcon,
    Upload as StartIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/layout/PageHeader';
import DropZone from '@/components/upload/DropZone';
import UploadProgress from '@/components/upload/UploadProgress';
import FilePreview from '@/components/upload/FilePreview';
import { useUpload } from '@/hooks/useUpload';

export default function UploadPage() {
    const { files, addFiles, removeFile, clearAll, uploadAll, hasFiles, isUploading, allDone } = useUpload();

    return (
        <Box>
            <PageHeader
                title="Cargar documentos"
                subtitle="Sube facturas, extractos bancarios o declaraciones XML para iniciar el pipeline de ingesta."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Cargar documentos' }]}
            />

            <Box sx={{ maxWidth: 700 }}>
                {/* Drop zone */}
                <DropZone onFilesAccepted={addFiles} disabled={isUploading} />

                {/* Queue */}
                {hasFiles && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
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
                                {isUploading ? 'Procesando…' : `Iniciar ingesta (${files.filter(f => f.status === 'idle').length} archivos)`}
                            </Button>
                        )}

                        {allDone && (
                            <Alert
                                icon={<DoneIcon />}
                                severity="success"
                                sx={{ borderRadius: 2 }}
                            >
                                Todos los archivos han sido procesados. Ve a{' '}
                                <strong>Transacciones → Pendientes</strong> para contabilizarlos.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Extracted data preview */}
                {files.some((f) => f.status === 'done') && (
                    <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <FilePreview files={files} />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
