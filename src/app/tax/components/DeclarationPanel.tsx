'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Box, Typography, Button, Alert, CircularProgress, Tooltip, Skeleton } from '@mui/material';
import { Description, ArrowForward } from '@mui/icons-material';
import {
    useGenerateDeclarationDraft,
    useDeclarationDraft,
    useDeclarationPreflight,
} from '@/hooks/useTax';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import PeriodSelector from '@/components/common/PeriodSelector';
import DraftEditor from './DraftEditor';
import PreflightChecklist from './PreflightChecklist';
import type { PeriodType } from '@/components/common/PeriodSelector';
import type { TaxFormType } from '@/lib/api';

const FORM_TYPES: { value: TaxFormType; label: string; description: string }[] = [
    {
        value: 'F300',
        label: 'Formulario 300 - IVA',
        description: 'Declaración bimestral/cuatrimestral de Impuesto al Valor Agregado',
    },
    {
        value: 'F350',
        label: 'Formulario 350 - Retención en la Fuente',
        description: 'Declaración mensual de retenciones practicadas',
    },
    {
        value: 'F110',
        label: 'Formulario 110 - Renta Personas Jurídicas',
        description: 'Declaración anual de impuesto a la renta',
    },
    {
        value: 'ICA',
        label: 'Declaración ICA Municipal',
        description: 'Impuesto de Industria y Comercio',
    },
    {
        value: 'F2516',
        label: 'F2516 - Conciliación Fiscal',
        description: 'Reporte de diferencias contables vs fiscales (prerequisito de F110)',
    },
];

interface DeclarationPanelProps {
    companyNit: string;
}

export default function DeclarationPanel({ companyNit }: DeclarationPanelProps) {
    const [selectedForm, setSelectedForm] = useState<TaxFormType>('F300');
    const [period, setPeriod] = useState<{
        startDate: string;
        endDate: string;
        periodType: PeriodType;
    }>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString()
            .split('T')[0],
        periodType: 'month',
    });
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

    const generateDraft = useGenerateDeclarationDraft();
    const { data: draftData, isLoading: isLoadingDraft } = useDeclarationDraft(activeDraftId);

    const preflight = useDeclarationPreflight({
        companyNit: companyNit || undefined,
        formType: selectedForm,
        periodStart: period.startDate,
        periodEnd: period.endDate,
    });

    if (preflight.isError) {
        // Don't block generation on preflight network failures
        console.warn('Preflight check failed; allowing generation', preflight.error);
    }

    const preflightReady = preflight.data?.ready ?? true;
    const hasPreflightData = !!preflight.data;
    const generateDisabled = generateDraft.isPending || (hasPreflightData && !preflightReady);

    // Don't render if no company selected
    if (!companyNit) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: palette.paperMuted }}>
                    Seleccione una empresa para generar declaraciones
                </Typography>
            </Box>
        );
    }

    const handleGenerate = async () => {
        try {
            const result = await generateDraft.mutateAsync({
                company_nit: companyNit,
                form_type: selectedForm,
                period_start: period.startDate,
                period_end: period.endDate,
            });
            setActiveDraftId(result.draft_id);
        } catch (error) {
            console.error('Error generating draft:', error);
        }
    };

    const handleCloseEditor = () => {
        setActiveDraftId(null);
        generateDraft.reset();
    };

    // If we have an active draft, show the editor
    if (activeDraftId && (draftData || isLoadingDraft)) {
        return (
            <DraftEditor
                draftId={activeDraftId}
                draft={draftData}
                isLoading={isLoadingDraft}
                onClose={handleCloseEditor}
            />
        );
    }

    return (
        <Box>
            {/* Header */}
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: palette.paperMuted,
                    mb: 3,
                }}
            >
                {'// Generar borrador de declaración'}
            </Typography>

            {/* Form selector */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 2,
                    mb: 4,
                }}
            >
                {FORM_TYPES.map((form) => (
                    <Box
                        key={form.value}
                        onClick={() => setSelectedForm(form.value)}
                        sx={{
                            p: 3,
                            border: `1px solid ${selectedForm === form.value ? palette.accent : palette.line}`,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: `all ${motion.duration.md} ${motion.snap}`,
                            bgcolor:
                                selectedForm === form.value
                                    ? hexAlpha(palette.accent, 0.05)
                                    : 'transparent',
                            '&:hover': {
                                borderColor: palette.accent,
                                transform: 'translateX(4px)',
                            },
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: selectedForm === form.value ? palette.accent : palette.paper,
                                mb: 1,
                            }}
                        >
                            {form.label}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '0.85rem',
                                color: palette.paperMuted,
                                lineHeight: 1.4,
                            }}
                        >
                            {form.description}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Period selector */}
            <Box sx={{ mb: 4 }}>
                <Typography sx={{ ...sxLabelSmall, mb: 2, color: palette.paperMuted }}>
                    {'// Período de la declaración'}
                </Typography>
                <PeriodSelector
                    value={period}
                    onChange={setPeriod}
                    showBimestre={selectedForm === 'F300' || selectedForm === 'ICA'}
                />
            </Box>

            {/* Preflight checklist */}
            {preflight.isLoading && (
                <Skeleton
                    variant="rectangular"
                    height={180}
                    sx={{ mb: 4, bgcolor: hexAlpha(palette.paper, 0.04), borderRadius: 1 }}
                />
            )}
            {preflight.data && (
                <PreflightChecklist checks={preflight.data.checks} ready={preflight.data.ready} />
            )}

            {/* Error display */}
            {generateDraft.isError &&
                (() => {
                    const err = generateDraft.error as unknown;
                    const errCode =
                        (err as { response?: { data?: { detail?: { error_code?: string } } } })
                            ?.response?.data?.detail?.error_code ??
                        (err as { error_code?: string })?.error_code;

                    let message: React.ReactNode;
                    if (errCode === 'F2516_REQUIRED') {
                        message = (
                            <>
                                Debe generar y revisar el F2516 (Conciliación Fiscal) antes de
                                generar el F110.{' '}
                                <Button
                                    size="small"
                                    onClick={() => setSelectedForm('F2516')}
                                    sx={{
                                        color: palette.error,
                                        fontFamily: fonts.mono,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        p: 0,
                                        minWidth: 0,
                                        textDecoration: 'underline',
                                        '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
                                    }}
                                >
                                    Ir a F2516
                                </Button>
                            </>
                        );
                    } else if (errCode === 'COMPANY_SETTINGS_MISSING') {
                        message = (
                            <>
                                La empresa no tiene configuración tributaria. Configúrela en{' '}
                                <NextLink
                                    href="/settings"
                                    style={{
                                        color: palette.error,
                                        textDecoration: 'underline',
                                    }}
                                >
                                    Ajustes
                                </NextLink>
                                .
                            </>
                        );
                    } else if (errCode === 'UNSUPPORTED_FORM_TYPE') {
                        message = 'Tipo de formulario no soportado.';
                    } else if (errCode === 'GENERATION_FAILED' || errCode) {
                        message =
                            (err as { message?: string })?.message ||
                            'Error generando el borrador. Verifique que la empresa tenga transacciones en el período.';
                    } else {
                        // fallback for old string-shape errors
                        message =
                            (err as { message?: string })?.message ||
                            'Error generando el borrador. Verifique que la empresa tenga transacciones en el período.';
                    }

                    return (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                bgcolor: hexAlpha(palette.error, 0.1),
                                color: palette.error,
                                border: `1px solid ${palette.error}`,
                            }}
                        >
                            {message}
                        </Alert>
                    );
                })()}

            {/* Generate button */}
            <Tooltip
                title={
                    hasPreflightData && !preflightReady
                        ? 'Resuelve los bloqueos antes de generar'
                        : ''
                }
                disableHoverListener={!hasPreflightData || preflightReady}
            >
                <span>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGenerate}
                        disabled={generateDisabled}
                        startIcon={
                            generateDraft.isPending ? (
                                <CircularProgress size={20} />
                            ) : (
                                <Description />
                            )
                        }
                        endIcon={!generateDraft.isPending && <ArrowForward />}
                        sx={{
                            bgcolor: palette.accent,
                            color: palette.ink,
                            fontFamily: fonts.mono,
                            fontSize: '0.85rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            py: 1.5,
                            px: 4,
                            '&:hover': {
                                bgcolor: hexAlpha(palette.accent, 0.85),
                            },
                            '&:disabled': {
                                bgcolor: palette.line,
                                color: palette.paperMuted,
                            },
                        }}
                    >
                        {generateDraft.isPending ? 'Generando...' : 'Generar borrador'}
                    </Button>
                </span>
            </Tooltip>
        </Box>
    );
}
