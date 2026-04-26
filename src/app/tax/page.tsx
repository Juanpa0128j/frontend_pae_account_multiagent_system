'use client';

import { useState } from 'react';
import {
    Box,
    Grid,
    Typography,
    Skeleton,
} from '@mui/material';
import {
    AccountBalance as ICAIcon,
    Receipt as RentaIcon,
} from '@mui/icons-material';
import { BrutalistPageHero, BrutalistChip, BrutalistEmptyState } from '@/components/brutalist';
import { palette, fonts, motion, sxLabelSmall, hexAlpha, moduleAccents } from '@/styles/brutalist';
import { useCompany } from '@/context/CompanyContext';
import MoneyDisplay from '@/components/common/MoneyDisplay';
import DataTable, { Column } from '@/components/common/DataTable';
import { useIVA, useWithholdings, useICA, useRentaProvision } from '@/hooks/useTax';
import { formatDate } from '@/lib/formatters';

const ACCENT = moduleAccents.tax;

// ---------------------------------------------------------------------------
// Mock + types
// ---------------------------------------------------------------------------

interface WithholdingRow {
    date: string;
    type: string;
    amount: number;
    description: string;
}

const MOCK_WITHHOLDINGS: WithholdingRow[] = [
    { date: '2026-02-15', type: 'Retefuente', amount: 52500, description: 'Factura Proveedor XYZ' },
    { date: '2026-02-14', type: 'ReteICA', amount: 10350, description: 'Servicios consultoría' },
    { date: '2026-02-13', type: 'Retefuente', amount: 26250, description: 'Compra insumos' },
    { date: '2026-02-12', type: 'ReteIVA', amount: 15000, description: 'Factura arriendo' },
];

const FISCAL_ALERTS = [
    { tipo: 'IVA bimestral', descripcion: 'Declaración IVA Ene-Feb 2026', vencimiento: '2026-03-12', urgencia: 'alta' as const },
    { tipo: 'Retención en la fuente', descripcion: 'Declaración mensual Retefuente Feb 2026', vencimiento: '2026-03-18', urgencia: 'media' as const },
    { tipo: 'ICA municipal', descripcion: 'Declaración ReteICA Q1 2026', vencimiento: '2026-04-15', urgencia: 'baja' as const },
];

const URGENCY_CFG = {
    alta: { color: palette.error, label: 'ALTA', mono: 'P1' },
    media: { color: palette.amber, label: 'MEDIA', mono: 'P2' },
    baja: { color: palette.success, label: 'BAJA', mono: 'P3' },
};

const TYPE_COLOR: Record<string, string> = {
    Retefuente: palette.amber,
    ReteICA: palette.accent,
    ReteIVA: palette.pink,
};

// ---------------------------------------------------------------------------
// Brutalist card shell
// ---------------------------------------------------------------------------

function BrutalistCardShell({
    eyebrow,
    title,
    accent,
    children,
    icon,
}: {
    eyebrow: string;
    title: string;
    accent: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                position: 'relative',
                p: { xs: 2.5, md: 3 },
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: 'transparent',
                height: '100%',
                overflow: 'hidden',
                transition: `border-color ${motion.duration.md} ${motion.snap}`,
                '&:hover': { borderColor: hexAlpha(accent, 0.4) },
            }}
        >
            {/* Top accent stripe */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 2,
                    width: 32,
                    bgcolor: accent,
                    boxShadow: `0 0 8px ${accent}`,
                }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                {icon && <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>}
                <Typography sx={{ ...sxLabelSmall, color: accent }}>{eyebrow}</Typography>
            </Box>
            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.4rem', md: '1.65rem' },
                    fontWeight: 700,
                    color: palette.paper,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    mb: 2.5,
                }}
            >
                {title}
            </Typography>
            {children}
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Tax row helper — mono label + big value
// ---------------------------------------------------------------------------

function TaxLine({
    label,
    value,
    highlight = false,
    highlightColor = palette.paper,
}: {
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
    highlightColor?: string;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                py: highlight ? 1 : 0.6,
                borderTop: highlight ? `1px solid ${palette.line}` : 'none',
                mt: highlight ? 1 : 0,
            }}
        >
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.66rem',
                    color: highlight ? palette.paper : palette.paperFaint,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: highlight ? 700 : 500,
                }}
            >
                {label}
            </Typography>
            <Box
                sx={{
                    fontFamily: highlight ? fonts.display : fonts.mono,
                    fontSize: highlight ? { xs: '1.25rem', md: '1.5rem' } : '0.92rem',
                    fontWeight: highlight ? 700 : 500,
                    color: highlight ? highlightColor : palette.paperDim,
                    letterSpacing: highlight ? '-0.02em' : '0.02em',
                }}
            >
                {value}
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// IVA card
// ---------------------------------------------------------------------------

function IVACard({ generado, descontable, saldo, isLoading }: { generado: number; descontable: number; saldo: number; isLoading: boolean }) {
    return (
        <BrutalistCardShell eyebrow="// IVA · 19%" title="Resumen IVA" accent={ACCENT}>
            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="text" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </Box>
            ) : (
                <>
                    <Box>
                        <TaxLine label="IVA Generado" value={<MoneyDisplay value={generado} variant="caption" />} />
                        <TaxLine
                            label="IVA Descontable"
                            value={
                                <Box component="span" sx={{ color: palette.error }}>
                                    <MoneyDisplay value={-descontable} variant="caption" showSign />
                                </Box>
                            }
                        />
                        <TaxLine
                            label="Saldo a pagar"
                            value={<MoneyDisplay value={saldo} variant="caption" />}
                            highlight
                            highlightColor={saldo >= 0 ? palette.amber : palette.success}
                        />
                    </Box>

                    {/* Vence alert — brutalist */}
                    <Box
                        sx={{
                            mt: 3,
                            p: 1.75,
                            border: `1px solid ${hexAlpha(palette.error, 0.4)}`,
                            bgcolor: hexAlpha(palette.error, 0.08),
                            borderRadius: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                        }}
                    >
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                bgcolor: palette.error,
                                boxShadow: `0 0 8px ${palette.error}`,
                                animation: `pulse 1.5s infinite`,
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.4 },
                                },
                                flexShrink: 0,
                            }}
                        />
                        <Box>
                            <Typography sx={{ ...sxLabelSmall, color: palette.error, mb: 0.25 }}>
                                {'// VENCE 12.MAR.2026'}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: fonts.body,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: palette.paper,
                                }}
                            >
                                Quedan 21 días para declarar
                            </Typography>
                        </Box>
                    </Box>
                </>
            )}
        </BrutalistCardShell>
    );
}

// ---------------------------------------------------------------------------
// Fiscal alerts panel
// ---------------------------------------------------------------------------

function FiscalAlertsPanel() {
    return (
        <BrutalistCardShell eyebrow="// CALENDARIO" title="Alertas fiscales" accent={palette.amber}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {FISCAL_ALERTS.map((alert) => {
                    const cfg = URGENCY_CFG[alert.urgencia];
                    return (
                        <Box
                            key={alert.tipo}
                            sx={{
                                position: 'relative',
                                p: 1.5,
                                pl: 2.25,
                                border: `1px solid ${hexAlpha(cfg.color, 0.25)}`,
                                bgcolor: hexAlpha(cfg.color, 0.04),
                                borderRadius: 0.5,
                                transition: `all ${motion.duration.sm} ${motion.snap}`,
                                overflow: 'hidden',
                                '&:hover': {
                                    borderColor: cfg.color,
                                    bgcolor: hexAlpha(cfg.color, 0.08),
                                    transform: 'translateX(4px)',
                                },
                            }}
                        >
                            {/* Left bar */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    bgcolor: cfg.color,
                                    boxShadow: `0 0 6px ${cfg.color}`,
                                }}
                            />

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <Typography
                                    sx={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        color: cfg.color,
                                        letterSpacing: '0.18em',
                                        flexShrink: 0,
                                        mt: 0.4,
                                    }}
                                >
                                    {cfg.mono}
                                </Typography>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: '0.92rem',
                                            fontWeight: 700,
                                            color: palette.paper,
                                            letterSpacing: '-0.01em',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {alert.tipo}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.body,
                                            fontSize: '0.78rem',
                                            color: palette.paperFaint,
                                            mt: 0.25,
                                        }}
                                    >
                                        {alert.descripcion}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                                    <Box
                                        sx={{
                                            px: 0.75,
                                            py: 0.25,
                                            border: `1px solid ${hexAlpha(cfg.color, 0.5)}`,
                                            bgcolor: hexAlpha(cfg.color, 0.15),
                                            borderRadius: 0.5,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                color: cfg.color,
                                                letterSpacing: '0.18em',
                                            }}
                                        >
                                            {cfg.label}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.65rem',
                                            color: palette.paperGhost,
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {formatDate(alert.vencimiento)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </BrutalistCardShell>
    );
}

// ---------------------------------------------------------------------------
// References accordion (brutalist)
// ---------------------------------------------------------------------------

function ReferencesAccordion({ refs, accent }: { refs: string[]; accent: string }) {
    const [open, setOpen] = useState(false);
    return (
        <Box sx={{ mt: 2 }}>
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    py: 1,
                    borderTop: `1px solid ${palette.line}`,
                    '&:hover .ref-arrow': { color: accent, transform: open ? 'rotate(45deg)' : 'rotate(-45deg)' },
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.65rem',
                        color: palette.paperFaint,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        flex: 1,
                    }}
                >
                    {`// REF · ${refs.length}`}
                </Typography>
                <Box
                    className="ref-arrow"
                    sx={{
                        width: 8,
                        height: 8,
                        borderRight: `2px solid ${palette.paperFaint}`,
                        borderBottom: `2px solid ${palette.paperFaint}`,
                        transform: open ? 'rotate(-135deg)' : 'rotate(45deg)',
                        transition: `all ${motion.duration.sm} ${motion.snap}`,
                    }}
                />
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateRows: open ? '1fr' : '0fr',
                    transition: `grid-template-rows ${motion.duration.md} ${motion.snap}`,
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                    <Box sx={{ pt: 0.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {refs.map((ref, i) => (
                            <Typography
                                key={i}
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.72rem',
                                    color: palette.paperDim,
                                    letterSpacing: '0.02em',
                                }}
                            >
                                <Box component="span" sx={{ color: accent, mr: 0.75 }}>
                                    →
                                </Box>
                                {ref}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// ICA card
// ---------------------------------------------------------------------------

function ICACard() {
    const { data, isLoading, isError } = useICA('');
    const accentICA = palette.accent;

    return (
        <BrutalistCardShell
            eyebrow="// ICA · MUNICIPAL"
            title="ICA"
            accent={accentICA}
            icon={<ICAIcon sx={{ fontSize: 14 }} />}
        >
            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="text" height={26} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </Box>
            ) : isError ? (
                <BrutalistEmptyState
                    label="// ERROR"
                    title="Sin datos ICA"
                    description="Verifica que haya transacciones procesadas."
                    accent={palette.error}
                />
            ) : !data ? (
                <BrutalistEmptyState
                    label="// SIN EMPRESA"
                    title="Configura un NIT"
                    description="Selecciona una empresa en la barra superior para ver este reporte."
                    accent={palette.paperFaint}
                />
            ) : (
                <>
                    <TaxLine label="Ingresos brutos" value={<MoneyDisplay value={data.ingresos_brutos} variant="caption" />} />
                    <TaxLine label="Tasa ICA" value={<>{(data.tasa_ica * 1000).toFixed(1)}‰</>} />
                    <TaxLine
                        label="ICA a pagar"
                        value={<MoneyDisplay value={data.ica_a_pagar} variant="caption" />}
                        highlight
                        highlightColor={accentICA}
                    />

                    <Box sx={{ mt: 2, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        <BrutalistChip label={`PUC GASTO ${data.cuenta_gasto_puc}`} color={accentICA} variant="ghost" size="sm" />
                        <BrutalistChip label={`PUC PASIVO ${data.cuenta_pasivo_puc}`} color={accentICA} variant="ghost" size="sm" />
                    </Box>

                    <ReferencesAccordion refs={data.referencias} accent={accentICA} />
                </>
            )}
        </BrutalistCardShell>
    );
}

// ---------------------------------------------------------------------------
// Renta provision card
// ---------------------------------------------------------------------------

function RentaProvisionCard() {
    const { data, isLoading, isError } = useRentaProvision('');
    const accentRenta = palette.success;

    return (
        <BrutalistCardShell
            eyebrow="// RENTA · 35%"
            title="Provisión renta"
            accent={accentRenta}
            icon={<RentaIcon sx={{ fontSize: 14 }} />}
        >
            {isLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="text" height={26} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                    ))}
                </Box>
            ) : isError ? (
                <BrutalistEmptyState
                    label="// ERROR"
                    title="Sin datos renta"
                    description="Verifica que haya transacciones procesadas."
                    accent={palette.error}
                />
            ) : !data ? (
                <BrutalistEmptyState
                    label="// SIN EMPRESA"
                    title="Configura un NIT"
                    description="Selecciona una empresa en la barra superior para ver este reporte."
                    accent={palette.paperFaint}
                />
            ) : (
                <>
                    <TaxLine label="Utilidad antes imp." value={<MoneyDisplay value={data.utilidad_antes_impuestos} variant="caption" />} />
                    <TaxLine label="Tasa renta" value={<>{(data.tasa_renta * 100).toFixed(0)}%</>} />
                    <TaxLine
                        label="Provisión renta"
                        value={<MoneyDisplay value={data.provision_renta} variant="caption" />}
                        highlight
                        highlightColor={accentRenta}
                    />

                    <Box sx={{ mt: 2, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        <BrutalistChip label={`PUC GASTO ${data.cuenta_gasto_puc}`} color={accentRenta} variant="ghost" size="sm" />
                        <BrutalistChip label={`PUC PASIVO ${data.cuenta_pasivo_puc}`} color={accentRenta} variant="ghost" size="sm" />
                    </Box>

                    <ReferencesAccordion refs={data.referencias} accent={accentRenta} />
                </>
            )}
        </BrutalistCardShell>
    );
}

// ---------------------------------------------------------------------------
// Withholdings table columns (brutalist)
// ---------------------------------------------------------------------------

const withholdingColumns: Column<WithholdingRow>[] = [
    {
        key: 'date',
        label: 'Fecha',
        width: 130,
        render: (v) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.78rem',
                    color: palette.paperDim,
                    letterSpacing: '0.02em',
                }}
            >
                {formatDate(String(v))}
            </Typography>
        ),
    },
    {
        key: 'type',
        label: 'Tipo',
        width: 130,
        render: (v) => {
            const type = String(v);
            const color = TYPE_COLOR[type] ?? palette.paperFaint;
            return (
                <Box
                    component="span"
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color,
                        bgcolor: hexAlpha(color, 0.1),
                        border: `1px solid ${hexAlpha(color, 0.3)}`,
                        px: 0.85,
                        py: 0.3,
                        borderRadius: 0.5,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                    }}
                >
                    {type}
                </Box>
            );
        },
    },
    {
        key: 'description',
        label: 'Descripción',
        render: (v) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.86rem',
                    color: palette.paper,
                }}
            >
                {String(v) || '—'}
            </Typography>
        ),
    },
    {
        key: 'amount',
        label: 'Monto',
        align: 'right',
        width: 140,
        render: (v) => (
            <Typography
                component="span"
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: palette.paper,
                }}
            >
                <MoneyDisplay value={Number(v)} variant="caption" />
            </Typography>
        ),
    },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TaxPage() {
    const { activeCompany } = useCompany();
    const { data: ivaData, isLoading: ivaLoading } = useIVA();
    const { data: whData, isLoading: whLoading } = useWithholdings();

    const ivaGenerado = ivaData?.iva_generado ?? 2_483_720;
    const ivaDescontable = ivaData?.iva_descontable ?? 892_560;
    const ivaSaldo = ivaData?.iva_a_pagar ?? 1_591_160;

    const withholdingRows: WithholdingRow[] = ivaData
        ? ([
              whData?.retencion_en_la_fuente
                  ? { date: whData.period_end?.split('T')[0] ?? '', type: 'Retefuente', amount: whData.retencion_en_la_fuente, description: 'Retención en la fuente acumulada' }
                  : null,
              whData?.retencion_ica
                  ? { date: whData.period_end?.split('T')[0] ?? '', type: 'ReteICA', amount: whData.retencion_ica, description: 'Retención ICA acumulada' }
                  : null,
          ].filter(Boolean) as WithholdingRow[])
        : MOCK_WITHHOLDINGS;

    return (
        <Box>
            <BrutalistPageHero
                eyebrow="// MÓDULO_6 // TRIBUTARIO"
                title={<>Obligaciones<br />fiscales.</>}
                subtitle="iva · retenciones · ica · renta"
                lede={
                    activeCompany
                        ? `Las cuatro obligaciones colombianas principales de ${activeCompany.nombre ?? activeCompany.nit}. Cálculos automáticos basados en las tarifas configuradas.`
                        : 'Las cuatro obligaciones colombianas principales con cálculos automáticos.'
                }
                accent={ACCENT}
                ghostNumber="6"
            />

            <Grid container spacing={2.5}>
                <Grid item xs={12} md={5}>
                    <IVACard
                        generado={ivaGenerado}
                        descontable={ivaDescontable}
                        saldo={ivaSaldo}
                        isLoading={ivaLoading || whLoading}
                    />
                </Grid>

                <Grid item xs={12} md={7}>
                    <FiscalAlertsPanel />
                </Grid>

                <Grid item xs={12} md={6}>
                    <ICACard />
                </Grid>

                <Grid item xs={12} md={6}>
                    <RentaProvisionCard />
                </Grid>

                {/* Withholdings table */}
                <Grid item xs={12}>
                    <Box sx={{ pt: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 30,
                                    height: 2,
                                    bgcolor: palette.success,
                                    boxShadow: `0 0 8px ${palette.success}`,
                                }}
                            />
                            <Typography sx={{ ...sxLabelSmall, color: palette.success }}>
                                {'// RETENCIONES'}
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
                            Retenciones practicadas.
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
                            Detalle por tipo · período actual.
                        </Typography>

                        <DataTable
                            columns={withholdingColumns}
                            rows={withholdingRows}
                            rowKey={(_, i) => i!}
                            pagination={false}
                            accent={palette.success}
                            emptyMessage="No hay retenciones registradas en este período"
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
