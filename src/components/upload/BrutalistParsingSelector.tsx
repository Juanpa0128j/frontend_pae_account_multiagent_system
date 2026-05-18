'use client';

import { useState, useRef } from 'react';
import { Box, Typography, Popper, ClickAwayListener, Fade } from '@mui/material';
import { KeyboardArrowDown as ArrowIcon } from '@mui/icons-material';
import { palette, fonts, hexAlpha } from '@/styles/brutalist';

type Mode = {
    value: string;
    label: string;
    description: string;
    accent: string;
};

const MODES: Mode[] = [
    {
        value: 'fast',
        label: 'Rápido',
        description: 'Documentos digitales nítidos (PDFs con texto seleccionable)',
        accent: palette.chartreuse,
    },
    {
        value: 'standard',
        label: 'Estándar',
        description: 'PDFs con tablas o varios elementos en una página',
        accent: palette.accent,
    },
    {
        value: 'premium',
        label: 'Alta calidad',
        description: 'Documentos complejos o con muchas tablas',
        accent: palette.amber,
    },
    {
        value: 'gpt4o',
        label: 'Máxima precisión',
        description: 'Texto difícil de leer (versión más cara)',
        accent: palette.pink,
    },
    {
        value: 'agentic',
        label: 'Foto o escaneo',
        description: 'Imágenes, fotos de papel o PDFs de baja calidad',
        accent: palette.success,
    },
    {
        value: 'agentic_plus',
        label: 'Documento largo y complejo',
        description: 'Múltiples páginas con tablas y razonamiento entre páginas',
        accent: palette.error,
    },
];

interface Props {
    value: string;
    onChange: (mode: string) => void;
}

export default function BrutalistParsingSelector({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    const selected = MODES.find((m) => m.value === value) ?? MODES[0];

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
                {'// CALIDAD DE EXTRACCIÓN'}
            </Typography>

            <Box
                ref={anchorRef}
                onClick={() => setOpen((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpen((v) => !v);
                    }
                    if (e.key === 'Escape') setOpen(false);
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    cursor: 'pointer',
                    border: `1px solid ${open ? selected.accent : hexAlpha(palette.paper, 0.18)}`,
                    bgcolor: hexAlpha(selected.accent, 0.04),
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': {
                        borderColor: selected.accent,
                    },
                }}
            >
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: selected.accent,
                        boxShadow: `0 0 6px ${hexAlpha(selected.accent, 0.5)}`,
                        flexShrink: 0,
                    }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.8rem',
                            color: palette.paper,
                            lineHeight: 1.2,
                        }}
                    >
                        {selected.label}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: fonts.body,
                            fontSize: '0.7rem',
                            color: hexAlpha(palette.paper, 0.55),
                            mt: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {selected.description}
                    </Typography>
                </Box>
                <ArrowIcon
                    sx={{
                        fontSize: 20,
                        color: hexAlpha(palette.paper, 0.5),
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                        flexShrink: 0,
                    }}
                />
            </Box>

            <Popper
                open={open}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                transition
                disablePortal={false}
                modifiers={[
                    { name: 'offset', options: { offset: [0, 4] } },
                    { name: 'preventOverflow', options: { padding: 8 } },
                    { name: 'flip', enabled: true },
                ]}
                sx={{ zIndex: 1500 }}
            >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={120}>
                        <Box
                            sx={{
                                width: anchorRef.current?.offsetWidth ?? 320,
                                bgcolor: palette.inkSoft,
                                border: `1px solid ${hexAlpha(palette.paper, 0.18)}`,
                                boxShadow: `0 8px 24px ${hexAlpha(palette.ink, 0.6)}`,
                                maxHeight: 360,
                                overflowY: 'auto',
                            }}
                        >
                            <ClickAwayListener onClickAway={() => setOpen(false)}>
                                <Box>
                                    {MODES.map((mode) => {
                                        const isActive = mode.value === value;
                                        return (
                                            <Box
                                                key={mode.value}
                                                onClick={() => {
                                                    onChange(mode.value);
                                                    setOpen(false);
                                                }}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    cursor: 'pointer',
                                                    bgcolor: isActive
                                                        ? hexAlpha(mode.accent, 0.08)
                                                        : 'transparent',
                                                    borderLeft: `2px solid ${
                                                        isActive ? mode.accent : 'transparent'
                                                    }`,
                                                    transition: 'background-color 0.1s',
                                                    '&:hover': {
                                                        bgcolor: hexAlpha(mode.accent, 0.06),
                                                    },
                                                    '& + &': {
                                                        borderTop: `1px solid ${hexAlpha(palette.paper, 0.06)}`,
                                                    },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        bgcolor: mode.accent,
                                                        boxShadow: isActive
                                                            ? `0 0 6px ${hexAlpha(mode.accent, 0.6)}`
                                                            : 'none',
                                                        flexShrink: 0,
                                                        mt: 0.5,
                                                    }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: fonts.mono,
                                                            fontSize: '0.8rem',
                                                            color: isActive
                                                                ? mode.accent
                                                                : palette.paper,
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {mode.label}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: fonts.body,
                                                            fontSize: '0.7rem',
                                                            color: hexAlpha(palette.paper, 0.55),
                                                            mt: 0.25,
                                                            lineHeight: 1.4,
                                                        }}
                                                    >
                                                        {mode.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </ClickAwayListener>
                        </Box>
                    </Fade>
                )}
            </Popper>
        </Box>
    );
}
