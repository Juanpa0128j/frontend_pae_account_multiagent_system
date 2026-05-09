import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Appearance } from '@supabase/auth-ui-react';

export const brutalistAuthTheme: Appearance = {
    theme: ThemeSupa,
    variables: {
        default: {
            colors: {
                brand: '#0A0E1A',
                brandAccent: '#6366F1',
                brandButtonText: '#FAFAF5',
                inputBackground: '#FAFAF5',
                inputBorder: '#0A0E1A',
                inputBorderFocus: '#6366F1',
                inputBorderHover: '#6366F1',
                inputText: '#0A0E1A',
                inputPlaceholder: 'rgba(10,14,26,0.4)',
                messageText: '#FAFAF5',
                messageBackground: 'rgba(99,102,241,0.15)',
                dividerBackground: 'rgba(250,250,245,0.12)',
                anchorTextColor: '#6366F1',
                anchorTextHoverColor: '#FAFAF5',
            },
            fonts: {
                bodyFontFamily: 'Inter, sans-serif',
                buttonFontFamily: '"Bricolage Grotesque", sans-serif',
                inputFontFamily: 'Inter, sans-serif',
                labelFontFamily: '"JetBrains Mono", monospace',
            },
            fontSizes: {
                baseBodySize: '14px',
                baseInputSize: '14px',
                baseLabelSize: '11px',
                baseButtonSize: '13px',
            },
            radii: {
                borderRadiusButton: '0px',
                buttonBorderRadius: '0px',
                inputBorderRadius: '0px',
            },
            borderWidths: {
                buttonBorderWidth: '2px',
                inputBorderWidth: '2px',
            },
            space: {
                inputPadding: '12px 16px',
                buttonPadding: '12px 24px',
            },
        },
    },
};
