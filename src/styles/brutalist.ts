/**
 * Brutalist Editorial Design System — Token Source of Truth
 *
 * Use these tokens everywhere. Do not hardcode hex values, font sizes
 * or spacing. If you need a value that's not here, add it to this file
 * first, then use the named token.
 *
 * Reference page: /help — visual canon.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const palette = {
    ink: '#0A0E1A',
    inkSoft: '#0F1424',
    paper: '#FAFAF5',
    paperDim: 'rgba(250,250,245,0.85)',
    paperMuted: 'rgba(250,250,245,0.65)',
    paperFaint: 'rgba(250,250,245,0.45)',
    paperGhost: 'rgba(250,250,245,0.25)',

    accent: '#6366F1',
    pink: '#EC4899',
    chartreuse: '#D4FF00',
    amber: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',

    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.15)',
    lineFaint: 'rgba(255,255,255,0.04)',
    lineHover: 'rgba(99,102,241,0.5)',
} as const;

// ---------------------------------------------------------------------------
// Module accents — assign one per page/module for consistency
// ---------------------------------------------------------------------------

export const moduleAccents = {
    dashboard: palette.chartreuse,
    upload: palette.chartreuse,
    transactions: palette.accent,
    books: palette.pink,
    reports: palette.chartreuse,
    tax: palette.pink,
    evaluation: palette.amber,
    settings: palette.accent,
    help: palette.accent,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fonts = {
    display: 'var(--font-bricolage)',
    mono: 'var(--font-jetbrains)',
    body: 'var(--font-inter)',
} as const;

export const typeScale = {
    hero: { xs: '4rem', sm: '6rem', md: '9rem', lg: '12rem' },
    pageTitle: { xs: '2.5rem', sm: '3.5rem', md: '5rem', lg: '7rem' },
    sectionTitle: { xs: '2rem', sm: '2.75rem', md: '3.5rem', lg: '5rem' },
    cardTitle: { xs: '1.2rem', md: '1.55rem' },
    subtitle: { xs: '1.1rem', md: '1.4rem' },
    body: { xs: '0.95rem', md: '1rem' },
    bodyLarge: { xs: '1.05rem', md: '1.2rem' },
    caption: '0.85rem',
    monoLabel: '0.7rem',
    monoTiny: '0.62rem',
    kpiNumber: { xs: '1.8rem', md: '2.4rem' },
    kpiLarge: { xs: '2.5rem', md: '3.5rem' },
} as const;

// ---------------------------------------------------------------------------
// Motion — never use plain 'ease'
// ---------------------------------------------------------------------------

export const motion = {
    snap: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    softSnap: 'cubic-bezier(0.25, 0.7, 0.35, 1)',
    duration: {
        xs: '0.15s',
        sm: '0.2s',
        md: '0.3s',
        lg: '0.5s',
        xl: '0.8s',
    },
} as const;

// ---------------------------------------------------------------------------
// Composition utilities — common SX recipes
// ---------------------------------------------------------------------------

export const sxLabel = {
    fontFamily: fonts.mono,
    fontSize: typeScale.monoLabel,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: 500,
} as const;

export const sxLabelSmall = {
    fontFamily: fonts.mono,
    fontSize: typeScale.monoTiny,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    fontWeight: 500,
} as const;

export const sxCardBase = {
    border: `1px solid ${palette.line}`,
    borderRadius: 2,
    bgcolor: 'transparent',
    transition: `all ${motion.duration.md} ${motion.snap}`,
} as const;

export const sxAccentRule = (accent: string) => ({
    width: 40,
    height: 3,
    bgcolor: accent,
    boxShadow: `0 0 12px ${accent}`,
});

export const sxGhostNumber = (accent: string) => ({
    fontFamily: fonts.display,
    fontSize: { xs: '12rem', md: '22rem', lg: '28rem' },
    fontWeight: 800,
    lineHeight: 0.8,
    letterSpacing: '-0.08em',
    color: 'transparent',
    WebkitTextStroke: `1px ${accent}22`,
    pointerEvents: 'none',
    userSelect: 'none',
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Adds alpha to a hex color: hexAlpha('#6366F1', 0.2) → 'rgba(99,102,241,0.2)' */
export function hexAlpha(hex: string, alpha: number): string {
    const v = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
}

/** Background-with-low-opacity-from-accent for hover/active states */
export function accentBg(hex: string, alpha = 0.08): string {
    return hexAlpha(hex, alpha);
}
