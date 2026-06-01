'use client';

import {
    Box,
    Typography,
    Grid,
    Divider,
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
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
import { BrutalistCard, BrutalistChip } from '@/components/brutalist';
import {
    fonts,
    hexAlpha,
    moduleAccents,
    palette,
    sxAccentRule,
    sxLabel,
    sxLabelSmall,
} from '@/styles/brutalist';

interface TransactionDetailProps {
    detail: TransactionDetail;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={sxAccentRule(moduleAccents.transactions)} />
            <Box sx={{ color: moduleAccents.transactions }}>{icon}</Box>
            <Typography sx={{ ...sxLabel, color: palette.paper }}>{title}</Typography>
        </Box>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}
        >
            <Typography sx={{ ...sxLabelSmall, color: palette.paperFaint }}>{label}</Typography>
            <Box sx={{ textAlign: 'right' }}>{value}</Box>
        </Box>
    );
}

export default function TransactionDetailView({ detail }: TransactionDetailProps) {
    const totalDuration = detail.agent_trace?.reduce((sum, s) => sum + s.duracion_ms, 0);
    const accent = moduleAccents.transactions;
    const justificationText = detail.clasificacion?.justificacion?.trim() ?? '';
    const justificationDisplay = justificationText || 'Sin justificación disponible.';
    const showQuotes = justificationText.length > 0;
    const hasImpuestos = Boolean(detail.impuestos);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700}>
                    Transacción #{detail.id}
                </Typography>
                <StatusBadge status={detail.raw.status} size="medium" />
                {detail.partida_doble_ok !== undefined && (
                    <BrutalistChip
                        label={detail.partida_doble_ok ? 'Partida doble ✓' : 'Partida doble ✗'}
                        color={detail.partida_doble_ok ? palette.success : palette.error}
                        size="sm"
                        icon={
                            detail.partida_doble_ok ? (
                                <OkIcon sx={{ fontSize: 14 }} />
                            ) : (
                                <FailIcon sx={{ fontSize: 14 }} />
                            )
                        }
                    />
                )}
            </Box>

            <Grid container spacing={2.5}>
                {/* Datos Originales */}
                <Grid item xs={12} md={6}>
                    <BrutalistCard
                        accent={moduleAccents.transactions}
                        active
                        sx={{
                            p: 2.5,
                            height: '100%',
                        }}
                    >
                        <SectionTitle
                            icon={<DocIcon fontSize="small" />}
                            title="Datos Originales"
                        />
                        <InfoRow
                            label="Fecha"
                            value={
                                <Typography variant="caption" fontWeight={600}>
                                    {formatDate(detail.raw.fecha)}
                                </Typography>
                            }
                        />
                        <InfoRow
                            label="Tipo"
                            value={<BrutalistChip label={detail.raw.tipo_documento} size="sm" />}
                        />
                        <InfoRow
                            label="NIT Emisor"
                            value={
                                <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.75rem' }}>
                                    {formatNIT(detail.raw.nit_emisor)}
                                </Typography>
                            }
                        />
                        <InfoRow
                            label="NIT Receptor"
                            value={
                                <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.75rem' }}>
                                    {formatNIT(detail.raw.nit_receptor)}
                                </Typography>
                            }
                        />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow
                            label="Subtotal"
                            value={<MoneyDisplay value={detail.raw.subtotal} variant="caption" />}
                        />
                        <InfoRow
                            label="IVA"
                            value={<MoneyDisplay value={detail.raw.iva} variant="caption" />}
                        />
                        <InfoRow
                            label="Total"
                            value={
                                <MoneyDisplay
                                    value={detail.raw.total}
                                    variant="caption"
                                    sx={{ fontWeight: 800, fontSize: '0.9rem' }}
                                />
                            }
                        />
                        <Divider sx={{ my: 1 }} />
                        <InfoRow
                            label="Archivo origen"
                            value={
                                <Typography sx={{ fontSize: '0.75rem', color: palette.paperFaint }}>
                                    {detail.raw.archivo_origen}
                                </Typography>
                            }
                        />
                    </BrutalistCard>
                </Grid>

                {/* Clasificación */}
                <Grid item xs={12} md={6}>
                    {detail.clasificacion ? (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            active
                            sx={{
                                p: 2.5,
                                height: '100%',
                            }}
                        >
                            <SectionTitle
                                icon={<ClassIcon fontSize="small" />}
                                title="Clasificación Contable"
                            />
                            <InfoRow
                                label="Cuenta PUC"
                                value={
                                    <BrutalistChip
                                        label={detail.clasificacion.cuenta_puc}
                                        color={moduleAccents.transactions}
                                        size="sm"
                                        variant="ghost"
                                    />
                                }
                            />
                            <InfoRow
                                label="Nombre cuenta"
                                value={
                                    <Typography variant="caption" fontWeight={600}>
                                        {detail.clasificacion.nombre_cuenta}
                                    </Typography>
                                }
                            />
                            <InfoRow
                                label="Fuente"
                                value={
                                    <BrutalistChip
                                        label={detail.clasificacion.fuente}
                                        size="sm"
                                        variant="outlined"
                                    />
                                }
                            />
                            <Divider sx={{ my: 1.5 }} />
                            <Typography
                                display="block"
                                sx={{
                                    ...sxLabel,
                                    color: palette.paperFaint,
                                    mb: 0.75,
                                }}
                            >
                                {'// Justificación del agente'}
                            </Typography>
                            <Box
                                sx={{
                                    p: 1.5,
                                    bgcolor: hexAlpha(accent, 0.08),
                                    border: `1px solid ${hexAlpha(accent, 0.35)}`,
                                    borderRadius: 1.5,
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: palette.paperDim,
                                        fontFamily: fonts.body,
                                        fontSize: '0.85rem',
                                        fontStyle: showQuotes ? 'italic' : 'normal',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {showQuotes
                                        ? `“${justificationDisplay}”`
                                        : justificationDisplay}
                                </Typography>
                            </Box>
                        </BrutalistCard>
                    ) : (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            sx={{
                                p: 2,
                                borderStyle: 'dashed',
                            }}
                        >
                            <Typography sx={{ color: palette.paperFaint }}>
                                Clasificación PUC no disponible para esta transacción.
                            </Typography>
                        </BrutalistCard>
                    )}
                </Grid>

                {/* Impuestos */}
                {hasImpuestos && (
                    <Grid item xs={12} md={6}>
                        {(() => {
                            const impuestos = detail.impuestos!;
                            return (
                                <BrutalistCard
                                    accent={moduleAccents.transactions}
                                    active
                                    sx={{
                                        p: 2.5,
                                        bgcolor: hexAlpha(moduleAccents.transactions, 0.03),
                                    }}
                                >
                                    <SectionTitle
                                        icon={<TaxIcon fontSize="small" />}
                                        title="Cálculos Tributarios"
                                    />
                                    <InfoRow
                                        label="Retefuente"
                                        value={
                                            <MoneyDisplay
                                                value={impuestos.retefuente}
                                                variant="caption"
                                            />
                                        }
                                    />
                                    <InfoRow
                                        label="ReteICA"
                                        value={
                                            <MoneyDisplay
                                                value={impuestos.reteica}
                                                variant="caption"
                                            />
                                        }
                                    />
                                    {/* IVA Generado: solo cuando la empresa es el emisor
                                        (factura_venta) o cuando hay un valor distinto de
                                        cero (incluye negativos en notas crédito).
                                        `tipo_documento` viene del backend con valores
                                        granulares ('factura_venta' / 'factura_compra' /
                                        'documento_soporte' / etc.) que el enum del frontend
                                        no cubre todavía, de ahí el cast a string. */}
                                    {(String(detail.raw.tipo_documento) === 'factura_venta' ||
                                        Number(impuestos.iva_generado) !== 0) && (
                                        <InfoRow
                                            label="IVA Generado"
                                            value={
                                                <MoneyDisplay
                                                    value={impuestos.iva_generado}
                                                    variant="caption"
                                                />
                                            }
                                        />
                                    )}
                                    {/* IVA Descontable: solo cuando la empresa es el adquirente
                                        (factura_compra / documento_soporte) o cuando hay un valor
                                        distinto de cero (incluye negativos en notas crédito). */}
                                    {(['factura_compra', 'documento_soporte'].includes(
                                        String(detail.raw.tipo_documento)
                                    ) ||
                                        Number(impuestos.iva_descontable) !== 0) && (
                                        <InfoRow
                                            label="IVA Descontable"
                                            value={
                                                <MoneyDisplay
                                                    value={impuestos.iva_descontable}
                                                    variant="caption"
                                                />
                                            }
                                        />
                                    )}
                                    <Divider sx={{ my: 1 }} />
                                    <InfoRow
                                        label="Referencia normativa"
                                        value={
                                            <BrutalistChip
                                                label={impuestos.referencia_normativa || '—'}
                                                color={palette.amber}
                                                size="sm"
                                                variant="ghost"
                                            />
                                        }
                                    />
                                </BrutalistCard>
                            );
                        })()}
                    </Grid>
                )}

                {/* Asiento Contable */}
                <Grid item xs={12} md={6}>
                    {detail.asiento && detail.asiento.length > 0 ? (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            active
                            sx={{
                                p: 2.5,
                            }}
                        >
                            <SectionTitle
                                icon={<LedgerIcon fontSize="small" />}
                                title="Asiento Contable"
                            />
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    ...sxLabelSmall,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                Cuenta
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    ...sxLabelSmall,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                Débito
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    ...sxLabelSmall,
                                                    color: palette.paperFaint,
                                                }}
                                            >
                                                Crédito
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {detail.asiento.map((entry, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontFamily: fonts.mono,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {entry.cuenta_puc}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                color: palette.paperFaint,
                                                            }}
                                                        >
                                                            {entry.nombre_cuenta}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {entry.debito > 0 ? (
                                                        <MoneyDisplay
                                                            value={entry.debito}
                                                            variant="caption"
                                                        />
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {entry.credito > 0 ? (
                                                        <MoneyDisplay
                                                            value={entry.credito}
                                                            variant="caption"
                                                        />
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </BrutalistCard>
                    ) : (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            sx={{
                                p: 2,
                                borderStyle: 'dashed',
                            }}
                        >
                            <Typography sx={{ color: palette.paperFaint }}>
                                Asiento contable no disponible.
                            </Typography>
                        </BrutalistCard>
                    )}
                </Grid>

                {/* Agent Timeline */}
                <Grid item xs={12} md={hasImpuestos ? 12 : 6}>
                    {detail.agent_trace && detail.agent_trace.length > 0 ? (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            active
                            sx={{
                                p: 2.5,
                            }}
                        >
                            <AgentTimeline
                                steps={detail.agent_trace}
                                totalDurationMs={totalDuration}
                            />
                        </BrutalistCard>
                    ) : (
                        <BrutalistCard
                            accent={moduleAccents.transactions}
                            sx={{
                                p: 2,
                                borderStyle: 'dashed',
                            }}
                        >
                            <Typography sx={{ color: palette.paperFaint }}>
                                Trazabilidad de agentes no disponible.
                            </Typography>
                        </BrutalistCard>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
