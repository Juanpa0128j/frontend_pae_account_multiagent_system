'use client';

import { useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Description, ArrowForward } from '@mui/icons-material';
import { useGenerateDeclarationDraft, useDeclarationDraft } from '@/hooks/useTax';
import { palette, fonts, motion, sxLabelSmall, hexAlpha } from '@/styles/brutalist';
import PeriodSelector from '@/components/common/PeriodSelector';
import DraftEditor from './DraftEditor';
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
        value: 'F260',
        label: 'Formulario 260 - Régimen SIMPLE',
        description: 'Declaración para contribuyentes del régimen SIMPLE',
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

            {/* Error display */}
            {generateDraft.isError && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: hexAlpha(palette.error, 0.1),
                        color: palette.error,
                        border: `1px solid ${palette.error}`,
                    }}
                >
                    Error generando el borrador. Verifique que la empresa tenga transacciones en el
                    período.
                </Alert>
            )}

            {/* Generate button */}
            <Button
                variant="contained"
                size="large"
                onClick={handleGenerate}
                disabled={generateDraft.isPending}
                startIcon={
                    generateDraft.isPending ? <CircularProgress size={20} /> : <Description />
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
        </Box>
    );
}
