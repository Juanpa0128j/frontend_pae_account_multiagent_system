'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Box, ClickAwayListener, Fade, Popper, Typography } from '@mui/material';
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
    const [activeIndex, setActiveIndex] = useState<number>(() =>
        Math.max(
            0,
            MODES.findIndex((m) => m.value === value)
        )
    );
    const anchorRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
    const listboxId = useId();
    const labelId = useId();

    const selected = MODES.find((m) => m.value === value) ?? MODES[0];

    // Sync active index with the controlled value whenever it changes
    // externally (e.g. the form resets the parser_mode).
    useEffect(() => {
        const idx = MODES.findIndex((m) => m.value === value);
        if (idx >= 0) setActiveIndex(idx);
    }, [value]);

    // When the listbox opens, focus the active option so arrow keys land on
    // the visible selection instead of the document body.
    useEffect(() => {
        if (open) {
            const node = optionRefs.current[activeIndex];
            if (node) node.focus();
        }
    }, [open, activeIndex]);

    const commitSelection = (idx: number) => {
        const mode = MODES[idx];
        if (!mode) return;
        onChange(mode.value);
        setOpen(false);
        anchorRef.current?.focus();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
        } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            setOpen(false);
        }
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((idx + 1) % MODES.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((idx - 1 + MODES.length) % MODES.length);
        } else if (e.key === 'Home') {
            e.preventDefault();
            setActiveIndex(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            setActiveIndex(MODES.length - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            commitSelection(idx);
        } else if (e.key === 'Escape' || e.key === 'Tab') {
            setOpen(false);
            anchorRef.current?.focus();
        }
    };

    return (
        <Box>
            <Typography
                id={labelId}
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
                component="button"
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-labelledby={labelId}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={handleTriggerKeyDown}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    gap: 1.5,
                    p: 1.5,
                    cursor: 'pointer',
                    border: `1px solid ${open ? selected.accent : hexAlpha(palette.paper, 0.18)}`,
                    bgcolor: hexAlpha(selected.accent, 0.04),
                    transition: 'border-color 0.15s, background-color 0.15s',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    '&:hover': {
                        borderColor: selected.accent,
                    },
                    '&:focus-visible': {
                        outline: `2px solid ${selected.accent}`,
                        outlineOffset: 2,
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
                            id={listboxId}
                            role="listbox"
                            aria-labelledby={labelId}
                            sx={{
                                width: anchorRef.current?.offsetWidth ?? 320,
                                bgcolor: palette.inkSoft,
                                border: `1px solid ${hexAlpha(palette.paper, 0.18)}`,
                                boxShadow: `0 8px 24px ${hexAlpha(palette.ink, 0.6)}`,
                                maxHeight: 360,
                                overflowY: 'auto',
                                outline: 'none',
                            }}
                        >
                            <ClickAwayListener onClickAway={() => setOpen(false)}>
                                <Box>
                                    {MODES.map((mode, idx) => {
                                        const isActive = mode.value === value;
                                        const isFocused = idx === activeIndex;
                                        return (
                                            <Box
                                                key={mode.value}
                                                ref={(node: HTMLDivElement | null) => {
                                                    optionRefs.current[idx] = node;
                                                }}
                                                role="option"
                                                aria-selected={isActive}
                                                tabIndex={isFocused ? 0 : -1}
                                                onClick={() => commitSelection(idx)}
                                                onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5,
                                                    p: 1.5,
                                                    cursor: 'pointer',
                                                    bgcolor: isFocused
                                                        ? hexAlpha(mode.accent, 0.1)
                                                        : isActive
                                                          ? hexAlpha(mode.accent, 0.06)
                                                          : 'transparent',
                                                    borderLeft: `2px solid ${
                                                        isActive ? mode.accent : 'transparent'
                                                    }`,
                                                    outline: 'none',
                                                    transition: 'background-color 0.1s',
                                                    '&:hover': {
                                                        bgcolor: hexAlpha(mode.accent, 0.08),
                                                    },
                                                    '&:focus-visible': {
                                                        bgcolor: hexAlpha(mode.accent, 0.12),
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
