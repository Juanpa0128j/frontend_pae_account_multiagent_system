'use client';

import { Box, Typography } from '@mui/material';
import { SECTIONS } from './helpData';

/**
 * PrintableManual — hidden on screen, shown only during window.print().
 * Renders the full manual in a clean black-on-white layout optimized for PDF.
 * Activated via `body.printing-help` class toggled by HelpDownload.
 */
export default function PrintableManual() {
    return (
        <Box className="printable-manual">
            {/* Cover page */}
            <Box
                sx={{
                    pageBreakAfter: 'always',
                    py: 10,
                    px: 6,
                    borderBottom: '2px solid #0A0E1A',
                }}
            >
                <Typography
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '10pt',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: '#6366F1',
                        mb: 3,
                    }}
                >
                    PAE CONTABLE · MANUAL_v0.1
                </Typography>
                <Typography
                    component="h1"
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: '72pt',
                        fontWeight: 800,
                        lineHeight: 0.9,
                        letterSpacing: '-0.04em',
                        color: '#0A0E1A',
                        mb: 4,
                        textTransform: 'uppercase',
                    }}
                >
                    Cómo usar<br />esto
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '14pt',
                        color: '#4B5563',
                        maxWidth: '80%',
                        lineHeight: 1.5,
                        mb: 8,
                    }}
                >
                    Sistema multiagente contable para Colombia. Manual de usuario
                    completo con los {SECTIONS.length} módulos de la aplicación.
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 6,
                        borderTop: '1px solid #D1D5DB',
                        pt: 4,
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '8pt',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#6B7280',
                            }}
                        >
                            Módulos
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '28pt',
                                fontWeight: 700,
                                color: '#0A0E1A',
                            }}
                        >
                            {SECTIONS.length}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '8pt',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#6B7280',
                            }}
                        >
                            Insights
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '28pt',
                                fontWeight: 700,
                                color: '#0A0E1A',
                            }}
                        >
                            {SECTIONS.reduce((sum, s) => sum + s.steps.length, 0)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '8pt',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#6B7280',
                            }}
                        >
                            Generado
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '14pt',
                                fontWeight: 600,
                                color: '#0A0E1A',
                                mt: 1.5,
                            }}
                        >
                            {new Date().toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Table of contents */}
            <Box
                sx={{
                    pageBreakAfter: 'always',
                    py: 6,
                    px: 6,
                }}
            >
                <Typography
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '10pt',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#6366F1',
                        mb: 2,
                    }}
                >
                    Índice
                </Typography>
                <Typography
                    component="h2"
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: '36pt',
                        fontWeight: 700,
                        color: '#0A0E1A',
                        mb: 5,
                        letterSpacing: '-0.03em',
                    }}
                >
                    Contenido
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {SECTIONS.map((s) => (
                        <Box
                            key={s.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 3,
                                py: 1.5,
                                borderBottom: '1px solid #E5E7EB',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-jetbrains)',
                                    fontSize: '11pt',
                                    fontWeight: 500,
                                    color: s.accent,
                                    minWidth: 30,
                                }}
                            >
                                {s.number}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-bricolage)',
                                        fontSize: '16pt',
                                        fontWeight: 600,
                                        color: '#0A0E1A',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {s.title}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-inter)',
                                        fontSize: '10pt',
                                        color: '#6B7280',
                                        fontStyle: 'italic',
                                        mt: 0.5,
                                    }}
                                >
                                    {s.subtitle}
                                </Typography>
                            </Box>
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-jetbrains)',
                                    fontSize: '9pt',
                                    color: '#9CA3AF',
                                }}
                            >
                                {s.steps.length} insights
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Sections */}
            {SECTIONS.map((section) => (
                <Box
                    key={section.id}
                    sx={{
                        pageBreakBefore: 'always',
                        py: 6,
                        px: 6,
                    }}
                >
                    {/* Section header */}
                    <Box
                        sx={{
                            mb: 6,
                            pb: 4,
                            borderBottom: `2px solid ${section.accent}`,
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-jetbrains)',
                                fontSize: '10pt',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                color: section.accent,
                                mb: 1,
                            }}
                        >
                            {section.number} / {SECTIONS.length.toString().padStart(2, '0')}
                        </Typography>
                        <Typography
                            component="h2"
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '42pt',
                                fontWeight: 700,
                                color: '#0A0E1A',
                                lineHeight: 0.95,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {section.title}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-bricolage)',
                                fontSize: '14pt',
                                fontStyle: 'italic',
                                color: '#6B7280',
                                mt: 1,
                            }}
                        >
                            — {section.subtitle}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 3,
                                fontFamily: 'var(--font-inter)',
                                fontSize: '11pt',
                                lineHeight: 1.6,
                                color: '#374151',
                            }}
                        >
                            {section.lede}
                        </Typography>
                    </Box>

                    {/* Steps */}
                    {section.steps.map((step, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                mb: 4,
                                pageBreakInside: 'avoid',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-jetbrains)',
                                    fontSize: '9pt',
                                    color: section.accent,
                                    letterSpacing: '0.15em',
                                    mb: 0.5,
                                }}
                            >
                                {String(idx + 1).padStart(2, '0')}
                            </Typography>
                            <Typography
                                component="h3"
                                sx={{
                                    fontFamily: 'var(--font-bricolage)',
                                    fontSize: '18pt',
                                    fontWeight: 600,
                                    color: '#0A0E1A',
                                    mb: 1.5,
                                    letterSpacing: '-0.015em',
                                }}
                            >
                                {step.title}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '11pt',
                                    lineHeight: 1.65,
                                    color: '#374151',
                                    mb: step.highlights ? 2 : 0,
                                }}
                            >
                                {step.body}
                            </Typography>

                            {step.highlights && (
                                <Box
                                    sx={{
                                        borderLeft: `3px solid ${section.accent}`,
                                        pl: 2,
                                        py: 1,
                                        mb: 2,
                                    }}
                                >
                                    {step.highlights.map((h, i) => (
                                        <Typography
                                            key={i}
                                            sx={{
                                                fontFamily: 'var(--font-inter)',
                                                fontSize: '10.5pt',
                                                lineHeight: 1.5,
                                                color: '#1F2937',
                                                mb: 0.5,
                                                '&::before': { content: '"▸  "', color: section.accent },
                                            }}
                                        >
                                            {h}
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                            {step.code && (
                                <Box
                                    sx={{
                                        bgcolor: '#F3F4F6',
                                        border: `1px solid ${section.accent}33`,
                                        borderLeft: `3px solid ${section.accent}`,
                                        p: 1.5,
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '9.5pt',
                                            color: '#0A0E1A',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {step.code}
                                    </Typography>
                                </Box>
                            )}

                            {step.warning && (
                                <Box
                                    sx={{
                                        bgcolor: '#FFFBEB',
                                        border: '1px solid #FCD34D',
                                        p: 1.5,
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-jetbrains)',
                                            fontSize: '8pt',
                                            fontWeight: 700,
                                            color: '#D97706',
                                            letterSpacing: '0.2em',
                                            textTransform: 'uppercase',
                                            mb: 0.5,
                                        }}
                                    >
                                        Cuidado
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: 'var(--font-inter)',
                                            fontSize: '10pt',
                                            color: '#78350F',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {step.warning}
                                    </Typography>
                                </Box>
                            )}

                            {step.related && (
                                <Typography
                                    sx={{
                                        fontFamily: 'var(--font-jetbrains)',
                                        fontSize: '9pt',
                                        color: section.accent,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    → {step.related}
                                </Typography>
                            )}
                        </Box>
                    ))}

                    {/* Section tip */}
                    {section.tip && (
                        <Box
                            sx={{
                                mt: 4,
                                bgcolor: `${section.accent}10`,
                                border: `1px solid ${section.accent}40`,
                                p: 2,
                                pageBreakInside: 'avoid',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-jetbrains)',
                                    fontSize: '8pt',
                                    fontWeight: 700,
                                    color: section.accent,
                                    letterSpacing: '0.3em',
                                    textTransform: 'uppercase',
                                    mb: 0.75,
                                }}
                            >
                                Tip
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '10.5pt',
                                    lineHeight: 1.55,
                                    color: '#0A0E1A',
                                }}
                            >
                                {section.tip}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ))}

            {/* Final page */}
            <Box
                sx={{
                    pageBreakBefore: 'always',
                    py: 10,
                    px: 6,
                    textAlign: 'center',
                }}
            >
                <Typography
                    sx={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: '48pt',
                        fontWeight: 800,
                        color: '#0A0E1A',
                        mb: 3,
                        letterSpacing: '-0.04em',
                    }}
                >
                    Fin del manual
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'var(--font-jetbrains)',
                        fontSize: '10pt',
                        color: '#6B7280',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                    }}
                >
                    soporte@paecontable.co · v0.1.0
                </Typography>
            </Box>
        </Box>
    );
}
