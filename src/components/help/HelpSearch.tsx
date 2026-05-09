'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, TextField, InputAdornment, keyframes } from '@mui/material';
import { Search as SearchIcon, KeyboardReturn } from '@mui/icons-material';
import { SECTIONS } from './helpData';

const pulse = keyframes`
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
`;

export default function HelpSearch({ onSelect }: { onSelect: (id: string) => void }) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    // Global listener for / key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (
                e.key === '/' &&
                !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')
            ) {
                e.preventDefault();
                (document.getElementById('help-search-input') as HTMLInputElement)?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const out: { id: string; title: string; hint: string; accent: string; match: string }[] =
            [];
        for (const s of SECTIONS) {
            if (
                s.title.toLowerCase().includes(q) ||
                s.subtitle.toLowerCase().includes(q) ||
                s.lede.toLowerCase().includes(q)
            ) {
                out.push({
                    id: s.id,
                    title: s.title,
                    hint: s.subtitle,
                    accent: s.accent,
                    match: 'section',
                });
            }
            for (const step of s.steps) {
                if (step.title.toLowerCase().includes(q) || step.body.toLowerCase().includes(q)) {
                    out.push({
                        id: s.id,
                        title: step.title,
                        hint: `${s.title} · paso`,
                        accent: s.accent,
                        match: 'step',
                    });
                }
            }
        }
        return out.slice(0, 8);
    }, [query]);

    return (
        <Box
            sx={{
                px: { xs: 3, sm: 6, md: 10 },
                py: { xs: 4, md: 6 },
                position: 'relative',
                zIndex: 2,
            }}
        >
            <Box sx={{ maxWidth: 720, mx: 'auto', position: 'relative' }}>
                <TextField
                    id="help-search-input"
                    fullWidth
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    placeholder="Buscar en la guía…"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon
                                    sx={{
                                        color: focused ? '#D4FF00' : 'rgba(255,255,255,0.5)',
                                        transition: 'color 0.2s',
                                    }}
                                />
                            </InputAdornment>
                        ),
                        endAdornment: !focused && !query && (
                            <InputAdornment position="end">
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1,
                                        py: 0.25,
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: 1,
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '0.7rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    /
                                </Box>
                            </InputAdornment>
                        ),
                        sx: {
                            fontFamily: 'var(--font-bricolage)',
                            fontSize: '1.1rem',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${focused ? '#D4FF00' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '& fieldset': { border: 'none' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            boxShadow: focused ? '0 0 40px rgba(212,255,0,0.12)' : 'none',
                        },
                    }}
                />

                {/* Results dropdown */}
                {focused && results.length > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            bgcolor: '#0A0E1A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            overflow: 'hidden',
                            maxHeight: 420,
                            overflowY: 'auto',
                        }}
                    >
                        {results.map((r, i) => (
                            <Box
                                key={`${r.id}-${i}`}
                                onMouseDown={() => {
                                    onSelect(r.id);
                                    setQuery('');
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 2,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.15s',
                                    '&:hover': { bgcolor: `${r.accent}15` },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: r.accent,
                                        flexShrink: 0,
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-bricolage)',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: '#FAFAF5',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {r.title}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '0.7rem',
                                            color: 'rgba(255,255,255,0.45)',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            mt: 0.25,
                                        }}
                                    >
                                        {r.hint}
                                    </Typography>
                                </Box>
                                <KeyboardReturn
                                    sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}

                {focused && query && results.length === 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            bgcolor: '#0A0E1A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            zIndex: 100,
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.4)',
                                letterSpacing: '0.15em',
                            }}
                        >
                            {`// sin resultados para "${query}"`}
                        </Typography>
                    </Box>
                )}

                <Typography
                    sx={{
                        mt: 2,
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        letterSpacing: '0.1em',
                    }}
                >
                    <Box
                        component="span"
                        sx={{ color: '#D4FF00', animation: `${pulse} 2s infinite` }}
                    >
                        ▸
                    </Box>{' '}
                    Pulsa{' '}
                    <Box component="span" sx={{ color: '#D4FF00', fontWeight: 700 }}>
                        /
                    </Box>{' '}
                    desde cualquier página de la guía
                </Typography>
            </Box>
        </Box>
    );
}
