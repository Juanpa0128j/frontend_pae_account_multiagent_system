'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { Box, Typography, Collapse } from '@mui/material';
import {
    CancelOutlined,
    WarningAmberOutlined,
    InfoOutlined,
    CheckCircleOutline,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import { palette, fonts, motion, hexAlpha } from '@/styles/brutalist';
import type { PreflightCheck, PreflightSeverity } from '@/lib/api';

interface PreflightChecklistProps {
    checks: PreflightCheck[];
    ready: boolean;
}

interface SeverityStyle {
    color: string;
    Icon: typeof CancelOutlined;
    label: string;
}

function getSeverityStyle(severity: PreflightSeverity, passed: boolean): SeverityStyle {
    if (passed) {
        return { color: palette.chartreuse, Icon: CheckCircleOutline, label: '// OK' };
    }
    switch (severity) {
        case 'blocker':
            return { color: palette.error, Icon: CancelOutlined, label: '// BLOQUEO' };
        case 'warning':
            return { color: palette.amber, Icon: WarningAmberOutlined, label: '// AVISO' };
        case 'info':
            return { color: palette.accent, Icon: InfoOutlined, label: '// INFO' };
        default: {
            const _exhaustive: never = severity;
            return { color: palette.paperMuted, Icon: InfoOutlined, label: _exhaustive };
        }
    }
}

interface CheckRowProps {
    check: PreflightCheck;
}

function CheckRow({ check }: CheckRowProps) {
    const { color, Icon } = getSeverityStyle(check.severity, check.passed);
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderTop: `1px solid ${palette.line}`,
                transition: `background-color ${motion.duration.md} ${motion.snap}`,
                '&:hover': {
                    bgcolor: hexAlpha(color, 0.04),
                },
            }}
        >
            <Icon sx={{ color, fontSize: '1.25rem', mt: '2px', flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color,
                        mb: 0.5,
                    }}
                >
                    {check.code}
                </Typography>
                <Typography
                    sx={{
                        fontSize: '0.9rem',
                        color: palette.paper,
                        lineHeight: 1.45,
                    }}
                >
                    {check.message}
                </Typography>
            </Box>
            {check.cta_path && !check.passed && (
                <NextLink
                    href={check.cta_path}
                    style={{
                        color,
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        textDecoration: 'underline',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    Resolver →
                </NextLink>
            )}
        </Box>
    );
}

export default function PreflightChecklist({ checks, ready }: PreflightChecklistProps) {
    const [showPassed, setShowPassed] = useState(false);

    const blockers = checks.filter((c) => !c.passed && c.severity === 'blocker');
    const warnings = checks.filter((c) => !c.passed && c.severity === 'warning');
    const info = checks.filter((c) => !c.passed && c.severity === 'info');
    const passed = checks.filter((c) => c.passed);

    const headerColor = ready ? palette.chartreuse : palette.error;

    return (
        <Box
            sx={{
                border: `1px solid ${palette.line}`,
                borderRadius: 1,
                bgcolor: hexAlpha(palette.ink, 0.4),
                mb: 4,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2.5,
                    borderBottom: `1px solid ${palette.line}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: headerColor,
                        fontWeight: 700,
                    }}
                >
                    {'// LISTO PARA GENERAR'}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: palette.paperMuted,
                    }}
                >
                    {ready
                        ? 'Sin bloqueos'
                        : `${blockers.length} bloqueo${blockers.length === 1 ? '' : 's'} · ${warnings.length} aviso${warnings.length === 1 ? '' : 's'}`}
                </Typography>
            </Box>

            {checks.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography
                        sx={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: palette.paperMuted,
                        }}
                    >
                        {'// SIN VERIFICACIONES'}
                    </Typography>
                </Box>
            ) : (
                <>
                    {blockers.map((c) => (
                        <CheckRow key={c.code} check={c} />
                    ))}
                    {warnings.map((c) => (
                        <CheckRow key={c.code} check={c} />
                    ))}
                    {info.map((c) => (
                        <CheckRow key={c.code} check={c} />
                    ))}
                    {passed.length > 0 && (
                        <>
                            <Box
                                component="button"
                                onClick={() => setShowPassed((v) => !v)}
                                sx={{
                                    width: '100%',
                                    border: 'none',
                                    borderTop: `1px solid ${palette.line}`,
                                    bgcolor: 'transparent',
                                    color: palette.paperMuted,
                                    p: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    cursor: 'pointer',
                                    fontFamily: fonts.mono,
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    transition: `color ${motion.duration.md} ${motion.snap}`,
                                    '&:hover': { color: palette.paper },
                                }}
                            >
                                {showPassed ? (
                                    <ExpandLess fontSize="small" />
                                ) : (
                                    <ExpandMore fontSize="small" />
                                )}
                                {`// ${passed.length} verificacion${passed.length === 1 ? '' : 'es'} ok`}
                            </Box>
                            <Collapse in={showPassed}>
                                {passed.map((c) => (
                                    <CheckRow key={c.code} check={c} />
                                ))}
                            </Collapse>
                        </>
                    )}
                </>
            )}
        </Box>
    );
}
