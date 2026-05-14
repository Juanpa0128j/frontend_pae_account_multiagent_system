'use client';

import { Box, Typography } from '@mui/material';
import BrutalistButton from '@/components/brutalist/BrutalistButton';
import { palette, fonts } from '@/styles/brutalist';

const MODES: { value: string; label: string; subLabel: string; accent: string }[] = [
    { value: 'fast', label: 'RÁPIDO', subLabel: 'económico', accent: palette.chartreuse },
    { value: 'standard', label: 'ESTÁNDAR', subLabel: 'balanceado', accent: palette.accent },
    { value: 'premium', label: 'PREMIUM', subLabel: 'tablas complejas', accent: palette.amber },
    { value: 'gpt4o', label: 'GPT-4O', subLabel: 'máxima precisión', accent: palette.pink },
];

interface Props {
    value: string;
    onChange: (mode: string) => void;
}

export default function BrutalistParsingSelector({ value, onChange }: Props) {
    return (
        <Box>
            <Typography
                sx={{
                    fontFamily: fonts.mono,
                    fontSize: '0.7rem',
                    letterSpacing: '0.22em',
                    color: palette.paperFaint,
                    textTransform: 'uppercase',
                    mb: 1.5,
                }}
            >
                {'// MODO DE EXTRACCIÓN'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {MODES.map((mode) => {
                    const isActive = value === mode.value;
                    return (
                        <BrutalistButton
                            key={mode.value}
                            size="sm"
                            variant={isActive ? 'primary' : 'outline'}
                            accent={mode.accent}
                            onClick={() => onChange(mode.value)}
                            subLabel={mode.subLabel}
                        >
                            {mode.label}
                        </BrutalistButton>
                    );
                })}
            </Box>
        </Box>
    );
}
