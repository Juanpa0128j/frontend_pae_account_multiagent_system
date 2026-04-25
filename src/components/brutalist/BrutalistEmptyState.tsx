'use client';

import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { palette, fonts, sxLabel } from '@/styles/brutalist';

interface BrutalistEmptyStateProps {
    /** Mono prefix label, e.g. "// SIN DATOS" */
    label: string;
    /** Big title */
    title: string;
    /** Optional description */
    description?: string;
    /** Optional accent color */
    accent?: string;
    /** Optional action */
    action?: ReactNode;
}

export default function BrutalistEmptyState({
    label,
    title,
    description,
    accent = palette.paperFaint,
    action,
}: BrutalistEmptyStateProps) {
    return (
        <Box
            sx={{
                py: { xs: 6, md: 10 },
                px: 3,
                textAlign: 'left',
                border: `1px dashed ${palette.line}`,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Typography sx={{ ...sxLabel, color: accent, mb: 2 }}>{label}</Typography>
            <Typography
                sx={{
                    fontFamily: fonts.display,
                    fontSize: { xs: '1.6rem', md: '2.4rem' },
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: palette.paper,
                    mb: description ? 1.5 : 0,
                }}
            >
                {title}
            </Typography>
            {description && (
                <Typography
                    sx={{
                        fontFamily: fonts.body,
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        color: palette.paperDim,
                        fontWeight: 300,
                        maxWidth: 520,
                    }}
                >
                    {description}
                </Typography>
            )}
            {action && <Box sx={{ mt: 3 }}>{action}</Box>}
        </Box>
    );
}
