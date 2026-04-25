'use client';

import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { palette, fonts, typeScale, sxLabel, sxAccentRule } from '@/styles/brutalist';

interface BrutalistSectionProps {
    /** "01", "02", etc. */
    number?: string;
    /** Total of N sections, used in "01 / 08" */
    total?: number;
    /** Section title */
    title: string;
    /** Optional italic subtitle */
    subtitle?: string;
    /** Lede paragraph */
    lede?: ReactNode;
    /** Accent color */
    accent: string;
    /** Children content */
    children: ReactNode;
    /** Pull-up margin between sections */
    dense?: boolean;
}

export default function BrutalistSection({
    number,
    total,
    title,
    subtitle,
    lede,
    accent,
    children,
    dense = false,
}: BrutalistSectionProps) {
    return (
        <Box
            sx={{
                position: 'relative',
                pt: dense ? { xs: 4, md: 6 } : { xs: 6, md: 9 },
                pb: dense ? { xs: 3, md: 4 } : { xs: 4, md: 6 },
            }}
        >
            {/* Number/total label */}
            {number && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={sxAccentRule(accent)} />
                    <Typography sx={{ ...sxLabel, color: accent }}>
                        {total ? `${number} / ${String(total).padStart(2, '0')}` : number}
                    </Typography>
                </Box>
            )}

            {/* Title */}
            <Typography
                component="h2"
                sx={{
                    fontFamily: fonts.display,
                    fontSize: typeScale.sectionTitle,
                    fontWeight: 700,
                    lineHeight: 0.98,
                    letterSpacing: '-0.04em',
                    color: palette.paper,
                    mb: 1,
                    pt: '0.05em',
                }}
            >
                {title}
            </Typography>

            {/* Subtitle */}
            {subtitle && (
                <Typography
                    sx={{
                        fontFamily: fonts.display,
                        fontSize: typeScale.subtitle,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        color: palette.paperFaint,
                        mb: 3,
                        letterSpacing: '-0.01em',
                    }}
                >
                    — {subtitle}
                </Typography>
            )}

            {/* Lede */}
            {lede && (
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: typeScale.body,
                        lineHeight: 1.65,
                        color: palette.paperDim,
                        fontWeight: 300,
                        maxWidth: 720,
                        mb: { xs: 3, md: 4 },
                    }}
                >
                    {lede}
                </Typography>
            )}

            <Box>{children}</Box>
        </Box>
    );
}
