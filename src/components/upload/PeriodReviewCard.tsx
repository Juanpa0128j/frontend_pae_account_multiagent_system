'use client';

import { useState } from 'react';
import {
    Alert,
    Box,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
    Typography,
} from '@mui/material';
import { ArrowForward, EditCalendar } from '@mui/icons-material';
import BrutalistCard from '@/components/brutalist/BrutalistCard';
import BrutalistChip from '@/components/brutalist/BrutalistChip';
import BrutalistButton from '@/components/brutalist/BrutalistButton';
import { fonts, hexAlpha, moduleAccents, palette } from '@/styles/brutalist';
import type { PeriodReview } from '@/lib/api';

interface PeriodReviewCardProps {
    fileName: string;
    review: PeriodReview;
    onConfirm: (payload: {
        period_start: string;
        period_end: string;
        periodicidad: 'mensual' | 'trimestral' | 'anual' | 'personalizado';
    }) => Promise<void> | void;
    onCancel?: () => void;
}

const REVIEW_REASON_COPY: Record<NonNullable<PeriodReview['review_reason']>, string> = {
    low_confidence: '// EXTRACCIÓN POCO CONFIABLE',
    collapsed_range: '// RANGO COLAPSADO A UN DÍA',
    span_inferred: '// PERÍODO INFERIDO DEL TAMAÑO',
    annual_high_value: '// CIERRE ANUAL — CONFIRMA',
};

const PERIODICIDAD_LABELS = {
    mensual: 'Mensual',
    trimestral: 'Trimestral',
    anual: 'Anual',
    personalizado: 'Personalizado',
} as const;

const EN_TO_ES: Record<string, 'mensual' | 'trimestral' | 'anual' | 'personalizado'> = {
    monthly: 'mensual',
    quarterly: 'trimestral',
    annual: 'anual',
    custom: 'personalizado',
};

/**
 * HITL editor for the period & periodicidad of a Vía B upload. Renders when
 * the backend marks ``period_review.requires_review === true`` on
 * ``IngestDetailResponse``. Submitting hits
 * ``PATCH /api/v1/ingest/{id}/period`` via ``updateIngestPeriod``.
 *
 * The accountant is responsible for the final figure (Ley 43/1990), so the
 * UI invites verification rather than silent acceptance — especially on
 * annual closings that gate downstream NIC 7 derivation.
 */
export default function PeriodReviewCard({
    fileName,
    review,
    onConfirm,
    onCancel,
}: PeriodReviewCardProps) {
    const initialStart = review.extracted_period_start ?? '';
    const initialEnd = review.extracted_period_end ?? '';
    const initialPeriodicidad = (
        review.extracted_periodicidad
            ? (EN_TO_ES[review.extracted_periodicidad] ??
              (review.extracted_periodicidad as keyof typeof PERIODICIDAD_LABELS))
            : 'mensual'
    ) as 'mensual' | 'trimestral' | 'anual' | 'personalizado';

    const [periodStart, setPeriodStart] = useState(initialStart);
    const [periodEnd, setPeriodEnd] = useState(initialEnd);
    const [periodicidad, setPeriodicidad] = useState<
        'mensual' | 'trimestral' | 'anual' | 'personalizado'
    >(initialPeriodicidad);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rangeInvalid = periodStart && periodEnd && periodEnd < periodStart ? true : false;
    const disabled = submitting || !periodStart || !periodEnd || rangeInvalid;

    const handleSubmit = async () => {
        if (disabled) return;
        setError(null);
        setSubmitting(true);
        try {
            await onConfirm({
                period_start: periodStart,
                period_end: periodEnd,
                periodicidad,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No fue posible actualizar el período';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const accent = moduleAccents.upload ?? palette.amber;
    const reviewBadge = review.review_reason
        ? REVIEW_REASON_COPY[review.review_reason]
        : '// REVISIÓN SUGERIDA';

    return (
        <BrutalistCard accent={accent} active sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EditCalendar sx={{ color: accent, fontSize: 18 }} />
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.66rem',
                        letterSpacing: '0.2em',
                        color: accent,
                        textTransform: 'uppercase',
                    }}
                >
                    {'// VERIFICA EL PERÍODO'}
                </Typography>
            </Box>

            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontWeight: 700,
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    color: palette.paper,
                    letterSpacing: '-0.02em',
                    mb: 0.5,
                }}
            >
                {fileName}
            </Typography>
            <Typography
                sx={{
                    fontFamily: fonts.body,
                    fontSize: '0.85rem',
                    color: palette.paperDim,
                    mb: 2,
                }}
            >
                Detectamos este documento con el período abajo. La derivación de flujo de caja y
                cambios de patrimonio (NIC 7) solo aplica a estados anuales, por eso necesitamos que
                confirmes o corrijas antes de continuar.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                <BrutalistChip label={reviewBadge} color={accent} />
                {review.extraction_confidence !== null &&
                    review.extraction_confidence !== undefined && (
                        <BrutalistChip
                            label={`// CONFIANZA ${Math.round(
                                (review.extraction_confidence ?? 0) * 100
                            )}%`}
                            color={palette.paperFaint}
                        />
                    )}
                {review.inferred_from_span && (
                    <BrutalistChip label="// INFERIDO POR SISTEMA" color={palette.paperFaint} />
                )}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.5,
                    mb: 1.5,
                }}
            >
                <TextField
                    type="date"
                    label="Inicio del período"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                />
                <TextField
                    type="date"
                    label="Fin del período"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                />
            </Box>

            <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                <Select
                    value={periodicidad}
                    onChange={(e: SelectChangeEvent) =>
                        setPeriodicidad(
                            e.target.value as 'mensual' | 'trimestral' | 'anual' | 'personalizado'
                        )
                    }
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.85rem',
                        bgcolor: hexAlpha(palette.paper, 0.05),
                    }}
                >
                    {Object.entries(PERIODICIDAD_LABELS).map(([k, v]) => (
                        <MenuItem key={k} value={k}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {rangeInvalid && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1 }}>
                    El fin del período no puede ser anterior al inicio.
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {onCancel && (
                    <BrutalistButton
                        variant="ghost"
                        size="md"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancelar
                    </BrutalistButton>
                )}
                <BrutalistButton
                    variant="primary"
                    size="md"
                    accent={accent}
                    onClick={handleSubmit}
                    disabled={disabled}
                    loading={submitting}
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                >
                    Confirmar período
                </BrutalistButton>
            </Box>
        </BrutalistCard>
    );
}
