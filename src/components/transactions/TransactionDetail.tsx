'use client';

import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    Chip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Alert,
} from '@mui/material';
import {
    CheckCircle as OkIcon,
    Cancel as FailIcon,
    Article as DocIcon,
    Label as ClassIcon,
    AttachMoney as TaxIcon,
    AccountBalance as LedgerIcon,
} from '@mui/icons-material';
import { TransactionDetail } from '@/types';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatNIT } from '@/lib/formatters';
import AgentTimeline from '@/components/agent/AgentTimeline';

interface TransactionDetailProps {
    detail: TransactionDetail;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ color: 'primary.main' }}>{icon}</Box>
            <Typography variant="subtitle2" fontWeight={700}>
                {title}
            </Typography>
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>{value}</Box>
        </Box>
    );
}

export default function TransactionDetailView({ detail }: TransactionDetailProps) {
    const totalDuration = detail.agent_trace?.reduce((sum, s) => sum + s.duracion_ms, 0);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700}>
                    Transacción #{detail.id}
                </Typography>
                <StatusBadge status={detail.raw.status} size="medium" />
                {detail.partida_doble_ok !== undefined && (
                    <Chip
                        size="small"
                        icon={detail.partida_doble_ok ? <OkIcon sx={{ fontSize: '14px !important' }} /> : <FailIcon sx={{ fontSize: '14px !important' }} />}
                        label={detail.partida_doble_ok ? 'Partida doble ✓' : 'Partida doble ✗'}
                        sx={{
                            fontWeight: 700,
                            bgcolor: detail.partida_doble_ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: detail.partida_doble_ok ? 'success.main' : 'error.main',
                            border: `1px solid ${detail.partida_doble_ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                    />
                )}
            </Box>

            <Grid container spacing={2.5}>
                {/* Datos Originales */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <SectionTitle icon={<DocIcon fontSize="small" />} title="Datos Originales" />
                        <InfoRow label="Fecha" value={<Typography variant="caption" fontWeight={600}>{formatDate(detail.raw.fecha)}</Typography>} />
                        <InfoRow label="Tipo" value={<Chip size="small" label={detail.raw.tipo_documento} sx={{ height: 18, fontSize: '0.65rem' }} />} />
                        <InfoRow label="NIT Emisor" value={<Typography variant="caption" fontFamily="monospace">{formatNIT(detail.raw.nit_emisor)}</Typography>} />
                        <InfoRow label="NIT Receptor" value={<Typography variant="caption" fontFamily="monospace">{formatNIT(detail.raw.nit_receptor)}</Typography>} />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow label="Subtotal" value={<MoneyDisplay value={detail.raw.subtotal} variant="caption" />} />
                        <InfoRow label="IVA" value={<MoneyDisplay value={detail.raw.iva} variant="caption" />} />
                        <InfoRow label="Total" value={<MoneyDisplay value={detail.raw.total} variant="caption" sx={{ fontWeight: 800, fontSize: '0.9rem' }} />} />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow label="Archivo origen" value={<Typography variant="caption" color="text.secondary">{detail.raw.archivo_origen}</Typography>} />
                    </Paper>
                </Grid>

                {/* Clasificación */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <SectionTitle icon={<ClassIcon fontSize="small" />} title="Clasificación Contable" />
                        <InfoRow
                            label="Cuenta PUC"
                            value={
                                <Chip
                                    size="small"
                                    label={detail.clasificacion?.cuenta_puc || '—'}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        bgcolor: 'rgba(99,102,241,0.12)',
                                        color: 'primary.light',
                                    }}
                                />
                            }
                        />
                        <InfoRow label="Nombre cuenta" value={<Typography variant="caption" fontWeight={600}>{detail.clasificacion?.nombre_cuenta || '—'}</Typography>} />
                        <InfoRow
                            label="Fuente"
                            value={
                                <Chip
                                    size="small"
                                    label={detail.clasificacion?.fuente || '—'}
                                    sx={{ height: 18, fontSize: '0.62rem', textTransform: 'capitalize' }}
                                />
                            }
                        />
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Justificación del agente:
                        </Typography>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.25,
                                bgcolor: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.12)',
                                borderRadius: 1.5,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                                &ldquo;{detail.clasificacion?.justificacion || 'Sin justificación disponible'}&rdquo;
                            </Typography>
                        </Paper>
                    </Paper>
                </Grid>

                {/* Impuestos */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <SectionTitle icon={<TaxIcon fontSize="small" />} title="Cálculos Tributarios" />
                        <InfoRow label="Retefuente" value={<MoneyDisplay value={detail.impuestos?.retefuente || 0} variant="caption" />} />
                        <InfoRow label="ReteICA" value={<MoneyDisplay value={detail.impuestos?.reteica || 0} variant="caption" />} />
                        <InfoRow label="IVA Generado" value={<MoneyDisplay value={detail.impuestos?.iva_generado || 0} variant="caption" />} />
                        <InfoRow label="IVA Descontable" value={<MoneyDisplay value={detail.impuestos?.iva_descontable || 0} variant="caption" />} />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow
                            label="Referencia normativa"
                            value={
                                <Chip
                                    size="small"
                                    label={detail.impuestos?.referencia_normativa || '—'}
                                    sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontFamily: 'monospace',
                                        bgcolor: 'rgba(245,158,11,0.12)',
                                        color: 'warning.main',
                                    }}
                                />
                            }
                        />
                    </Paper>
                </Grid>

                {/* Asiento Contable */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <SectionTitle icon={<LedgerIcon fontSize="small" />} title="Asiento Contable" />
                        {detail.asiento && detail.asiento.length > 0 ? (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Cuenta</TableCell>
                                        <TableCell align="right">Débito</TableCell>
                                        <TableCell align="right">Crédito</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {detail.asiento.map((entry, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace" display="block">
                                                        {entry.cuenta_puc}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {entry.nombre_cuenta}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.debito > 0 ? <MoneyDisplay value={entry.debito} variant="caption" /> : '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.credito > 0 ? <MoneyDisplay value={entry.credito} variant="caption" /> : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Sin asiento contable generado</Alert>
                        )}
                    </Paper>
                </Grid>

                {/* Agent Timeline */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <AgentTimeline steps={detail.agent_trace || []} totalDurationMs={totalDuration} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
