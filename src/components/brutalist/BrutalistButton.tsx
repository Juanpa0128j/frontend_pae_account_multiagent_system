'use client';

import { ReactNode, MouseEvent } from 'react';
import { Box, Typography, CircularProgress, keyframes } from '@mui/material';
import { palette, fonts, motion, hexAlpha } from '@/styles/brutalist';

const shineSweep = keyframes`
    0% { transform: translateX(-100%) rotate(35deg); }
    100% { transform: translateX(200%) rotate(35deg); }
`;

interface BrutalistButtonProps {
    children: ReactNode;
    /** Sub-label in mono font (optional) */
    subLabel?: string;
    /** Click handler */
    onClick?: (e: MouseEvent) => void;
    /** Variant */
    variant?: 'primary' | 'ghost' | 'outline';
    /** Color: defaults to chartreuse for primary */
    accent?: string;
    /** Optional leading icon */
    icon?: ReactNode;
    /** Optional trailing icon */
    endIcon?: ReactNode;
    /** Disabled */
    disabled?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Full width */
    fullWidth?: boolean;
    /** Type */
    type?: 'button' | 'submit';
    /** Size: sm | md | lg */
    size?: 'sm' | 'md' | 'lg';
}

export default function BrutalistButton({
    children,
    subLabel,
    onClick,
    variant = 'primary',
    accent = palette.chartreuse,
    icon,
    endIcon,
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    size = 'md',
}: BrutalistButtonProps) {
    const sizes = {
        sm: { py: 1, px: 2, fontSize: '0.78rem' },
        md: { py: 1.5, px: 3, fontSize: '0.92rem' },
        lg: { py: { xs: 2.5, md: 3 }, px: { xs: 3, md: 5 }, fontSize: '1.05rem' },
    }[size];

    const variantStyles = {
        primary: {
            bgcolor: accent,
            color: palette.ink,
            border: `1px solid ${accent}`,
            '&:hover': {
                bgcolor: accent,
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 28px ${hexAlpha(accent, 0.3)}`,
            },
        },
        ghost: {
            bgcolor: 'transparent',
            color: accent,
            border: 'none',
            '&:hover': {
                bgcolor: hexAlpha(accent, 0.1),
            },
        },
        outline: {
            bgcolor: 'transparent',
            color: palette.paper,
            border: `1px solid ${hexAlpha(accent, 0.4)}`,
            '&:hover': {
                borderColor: accent,
                bgcolor: hexAlpha(accent, 0.05),
                transform: 'translateY(-1px)',
            },
        },
    }[variant];

    const isDisabled = disabled || loading;

    return (
        <Box
            component="button"
            type={type}
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                if (!isDisabled && onClick) onClick(e);
            }}
            disabled={isDisabled}
            sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 44,
                ...sizes,
                fontFamily: fonts.body,
                fontWeight: 700,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                opacity: isDisabled ? 0.5 : 1,
                overflow: 'hidden',
                width: fullWidth ? '100%' : 'auto',
                justifyContent: fullWidth ? 'center' : 'flex-start',
                borderRadius: 1.5,
                transition: `all ${motion.duration.md} ${motion.snap}`,
                ...variantStyles,
                '&:hover .brutalist-btn-shine': isDisabled
                    ? {}
                    : { animation: `${shineSweep} 0.7s ${motion.snap}` },
            }}
        >
            {/* Shine sweep */}
            {variant === 'primary' && !isDisabled && (
                <Box
                    className="brutalist-btn-shine"
                    sx={{
                        position: 'absolute',
                        top: '-50%',
                        left: 0,
                        width: '40%',
                        height: '200%',
                        background: `linear-gradient(90deg, transparent, ${hexAlpha(palette.paper, 0.3)}, transparent)`,
                        transform: 'translateX(-100%) rotate(35deg)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {loading ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
            ) : (
                icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    lineHeight: 1,
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        lineHeight: 1,
                        letterSpacing: 'inherit',
                    }}
                >
                    {children}
                </Typography>
                {subLabel && (
                    <Typography
                        component="span"
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.65rem',
                            letterSpacing: '0.15em',
                            opacity: 0.7,
                            mt: 0.4,
                            fontWeight: 500,
                        }}
                    >
                        {subLabel}
                    </Typography>
                )}
            </Box>

            {endIcon && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>{endIcon}</Box>
            )}
        </Box>
    );
}
