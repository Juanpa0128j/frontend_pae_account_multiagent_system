import { fonts, palette } from '@/styles/brutalist';

/**
 * Clerk appearance configuration using brutalist design system tokens.
 * The `appearance` prop on ClerkProvider is typed as `any` in this version of
 * @clerk/nextjs, so we define the shape explicitly to keep strict TypeScript.
 */
interface ClerkVariables {
    colorBackground?: string;
    colorText?: string;
    colorPrimary?: string;
    colorDanger?: string;
    fontFamily?: string;
    borderRadius?: string;
}

interface ClerkElementStyle {
    backgroundColor?: string;
    border?: string;
    boxShadow?: string;
    fontFamily?: string;
    letterSpacing?: string;
    textTransform?: string;
    borderRadius?: number | string;
}

interface ClerkElements {
    card?: ClerkElementStyle;
    headerTitle?: ClerkElementStyle;
    formFieldLabel?: ClerkElementStyle;
    formButtonPrimary?: ClerkElementStyle;
}

interface ClerkAppearance {
    variables?: ClerkVariables;
    elements?: ClerkElements;
}

export const clerkAppearance: ClerkAppearance = {
    variables: {
        colorBackground: palette.ink,
        colorText: palette.paper,
        colorPrimary: palette.accent,
        colorDanger: palette.error,
        fontFamily: fonts.body,
        borderRadius: '8px',
    },
    elements: {
        card: {
            backgroundColor: palette.ink,
            border: `1px solid ${palette.line}`,
            boxShadow: 'none',
        },
        headerTitle: {
            fontFamily: fonts.display,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
        },
        formFieldLabel: {
            fontFamily: fonts.mono,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
        },
        formButtonPrimary: {
            backgroundColor: palette.accent,
            borderRadius: 0,
            textTransform: 'uppercase',
            fontFamily: fonts.mono,
        },
    },
};
