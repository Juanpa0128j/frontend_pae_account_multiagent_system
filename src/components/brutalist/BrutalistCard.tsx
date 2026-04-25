'use client';

import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { palette, motion, sxCardBase } from '@/styles/brutalist';

interface BrutalistCardProps {
    accent?: string;
    /** When true, shows the left accent bar (active/selected state) */
    active?: boolean;
    /** Optional hover transform — defaults to translateX(6px) */
    hoverTransform?: string;
    /** Click handler */
    onClick?: () => void;
    /** Card content */
    children: ReactNode;
    /** Additional sx */
    sx?: Record<string, unknown>;
}

export default function BrutalistCard({
    accent = palette.accent,
    active = false,
    hoverTransform = 'translateX(6px)',
    onClick,
    children,
    sx,
}: BrutalistCardProps) {
    const interactive = !!onClick;
    return (
        <Box
            onClick={onClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            sx={{
                ...sxCardBase,
                position: 'relative',
                p: { xs: 2.5, md: 3 },
                overflow: 'hidden',
                cursor: interactive ? 'pointer' : 'default',
                bgcolor: active ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderColor: active ? accent : palette.line,
                '&:hover': interactive
                    ? {
                          borderColor: accent,
                          transform: active ? 'none' : hoverTransform,
                          '& .brutalist-accent-bar': {
                              transform: 'scaleY(1)',
                          },
                      }
                    : {},
                ...sx,
            }}
        >
            {/* Animated left accent bar */}
            <Box
                className="brutalist-accent-bar"
                sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: accent,
                    transform: active ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'top',
                    transition: `transform ${motion.duration.md} ${motion.snap}`,
                    boxShadow: active ? `0 0 12px ${accent}` : 'none',
                }}
            />
            {children}
        </Box>
    );
}
