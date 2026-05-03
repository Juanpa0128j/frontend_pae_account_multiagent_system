'use client';

import { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from '@mui/material';
import { ArrowForward, SwapHoriz } from '@mui/icons-material';
import BrutalistCard from '@/components/brutalist/BrutalistCard';
import BrutalistChip from '@/components/brutalist/BrutalistChip';
import BrutalistButton from '@/components/brutalist/BrutalistButton';
import { fonts, hexAlpha, moduleAccents, palette } from '@/styles/brutalist';
import type { IngestClassificationReview } from '@/types';

interface ClassificationReviewCardProps {
    fileName: string;
    review: IngestClassificationReview;
    onConfirm: (docType: string) => Promise<void> | void;
}

export default function ClassificationReviewCard({
    fileName,
    review,
    onConfirm,
}: ClassificationReviewCardProps) {
    const predictedType = review.predicted_type ?? '';
    const predictedLabel = (review.predicted_label ?? predictedType) || 'Sin clasificar';
    const [selectedType, setSelectedType] = useState<string>(predictedType);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideType, setOverrideType] = useState<string>(
        review.available_types?.[0]?.value ?? ''
    );

    const options = useMemo(() => {
        if (Array.isArray(review.available_types) && review.available_types.length > 0) {
            return review.available_types;
        }
        return [{ value: predictedType, label: predictedLabel }].filter((opt) => opt.value);
    }, [predictedLabel, predictedType, review.available_types]);

    const confidenceLabel =
        typeof review.confidence === 'number'
            ? `${Math.round(review.confidence * 100)}%`
            : '—';

    const actionLabel =
        selectedType && selectedType === predictedType
            ? 'Confirmar'
            : 'Corregir y continuar';

    const handleConfirm = async () => {
        if (!selectedType || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedType);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (review.wrong_upload_area) {
        const handleOverrideConfirm = async () => {
            if (!overrideType || isSubmitting) return;
            setIsSubmitting(true);
            try {
                await onConfirm(overrideType);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <BrutalistCard accent={palette.amber} active sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.22em',
                                    color: palette.amber,
                                    textTransform: 'uppercase',
                                    mb: 0.5,
                                }}
                            >
                                {'// DOCUMENTO EN SECCION INCORRECTA'}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: fonts.display,
                                    fontSize: { xs: '1.5rem', md: '1.8rem' },
                                    fontWeight: 700,
                                    color: palette.paper,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.05,
                                }}
                            >
                                Sube este archivo en Via B
                            </Typography>
                        </Box>
                        <SwapHoriz sx={{ color: palette.amber, fontSize: 36, flexShrink: 0 }} />
                    </Box>
                    <Alert
                        severity="warning"
                        sx={{
                            bgcolor: hexAlpha(palette.amber, 0.08),
                            color: palette.paper,
                            border: `1px solid ${hexAlpha(palette.amber, 0.3)}`,
                            '& .MuiAlert-icon': { color: palette.amber },
                            fontFamily: fonts.body,
                        }}
                    >
                        <Typography sx={{ fontFamily: fonts.body, fontSize: '0.95rem', fontWeight: 600, mb: 0.5 }}>
                            Este documento parece ser un estado financiero ({predictedLabel}).
                        </Typography>
                        <Typography sx={{ fontFamily: fonts.body, fontSize: '0.88rem', color: palette.paperFaint }}>
                            Los estados financieros <strong>(Balance General, Estado de Resultados, Libro Auxiliar)</strong> deben
                            subirse en la sección <strong>Via B</strong>. Elimina este archivo de la cola y cárgalo
                            usando el selector <em>Estados financieros (Via B)</em> en la parte superior de esta página.
                        </Typography>
                    </Alert>

                    {/* Override: user can assert it's actually a Via A doc */}
                    <Box
                        sx={{
                            borderTop: `1px solid ${hexAlpha(palette.amber, 0.15)}`,
                            pt: 1.5,
                        }}
                    >
                        <Box
                            onClick={() => setOverrideOpen((v) => !v)}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                color: overrideOpen ? palette.paper : hexAlpha(palette.paper, 0.45),
                                transition: 'color 0.15s',
                                '&:hover': { color: palette.paper },
                            }}
                        >
                            <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                                {overrideOpen ? '// CANCELAR CORRECCIÓN' : '// CLASIFICACIÓN INCORRECTA — CORREGIR MANUALMENTE'}
                            </Typography>
                        </Box>

                        {overrideOpen && (
                            <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, alignItems: 'end' }}>
                                <Box>
                                    <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.65rem', letterSpacing: '0.18em', color: palette.paperGhost, textTransform: 'uppercase', mb: 0.5 }}>
                                        {'// TIPO CORRECTO (VÍA A)'}
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            value={overrideType}
                                            onChange={(e: SelectChangeEvent) => setOverrideType(String(e.target.value))}
                                            displayEmpty
                                            sx={{
                                                bgcolor: hexAlpha(palette.paper, 0.04),
                                                color: palette.paper,
                                                fontFamily: fonts.body,
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: hexAlpha(palette.amber, 0.3) },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.amber },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: palette.amber },
                                            }}
                                        >
                                            {review.available_types.map((opt) => (
                                                <MenuItem key={opt.value} value={opt.value}>
                                                    <Typography sx={{ fontFamily: fonts.body, fontSize: '0.95rem' }}>
                                                        {opt.label}
                                                    </Typography>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <BrutalistButton
                                    accent={palette.amber}
                                    onClick={handleOverrideConfirm}
                                    disabled={!overrideType}
                                    loading={isSubmitting}
                                    endIcon={<ArrowForward fontSize="small" />}
                                    fullWidth
                                >
                                    Confirmar tipo y continuar
                                </BrutalistButton>
                            </Box>
                        )}
                    </Box>

                    <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.7rem', color: palette.paperGhost, letterSpacing: '0.1em' }}>
                        {'// ARCHIVO: '}{fileName}
                    </Typography>
                </Box>
            </BrutalistCard>
        );
    }

    return (
        <BrutalistCard accent={moduleAccents.upload} active sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.22em',
                                color: moduleAccents.upload,
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            {'// REVISION HUMANA'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.display,
                                fontSize: { xs: '1.5rem', md: '1.8rem' },
                                fontWeight: 700,
                                color: palette.paper,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.05,
                            }}
                        >
                            Clasificacion pendiente
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.9rem',
                                color: palette.paperFaint,
                                mt: 0.5,
                            }}
                        >
                            Confirma el tipo de documento para continuar el pipeline.
                        </Typography>
                    </Box>
                    <BrutalistChip
                        label={`CONF ${confidenceLabel}`}
                        color={moduleAccents.upload}
                        variant="outlined"
                    />
                </Box>

                <Box
                    sx={{
                        borderTop: `1px solid ${hexAlpha(palette.paper, 0.08)}`,
                        pt: 2,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2,
                        alignItems: 'start',
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.18em',
                                color: palette.paperGhost,
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            {'// ARCHIVO'}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.95rem',
                                color: palette.paper,
                            }}
                        >
                            {fileName}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: fonts.body,
                                fontSize: '0.9rem',
                                color: palette.paperDim,
                                mt: 1.5,
                            }}
                        >
                            Prediccion: <strong>{predictedLabel}</strong>
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography
                            sx={{
                                fontFamily: fonts.mono,
                                fontSize: '0.7rem',
                                letterSpacing: '0.18em',
                                color: palette.paperGhost,
                                textTransform: 'uppercase',
                            }}
                        >
                            {'// TIPO DOCUMENTO'}
                        </Typography>
                        <FormControl fullWidth>
                            <Select
                                value={selectedType}
                                onChange={(event: SelectChangeEvent) =>
                                    setSelectedType(String(event.target.value))
                                }
                                displayEmpty
                                sx={{
                                    bgcolor: hexAlpha(palette.paper, 0.04),
                                    color: palette.paper,
                                    borderRadius: 1,
                                    fontFamily: fonts.body,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: hexAlpha(palette.paper, 0.12),
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: moduleAccents.upload,
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: moduleAccents.upload,
                                    },
                                }}
                            >
                                {options.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        <Typography sx={{ fontFamily: fonts.body, fontSize: '0.95rem' }}>
                                            {opt.label}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <BrutalistButton
                            accent={palette.chartreuse}
                            onClick={handleConfirm}
                            disabled={!selectedType}
                            loading={isSubmitting}
                            endIcon={<ArrowForward fontSize="small" />}
                            fullWidth
                        >
                            {actionLabel}
                        </BrutalistButton>
                    </Box>
                </Box>
            </Box>
        </BrutalistCard>
    );
}
