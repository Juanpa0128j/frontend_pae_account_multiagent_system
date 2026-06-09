import { ThemeSupa } from '@supabase/auth-ui-shared';

export const brutalistAuthTheme = {
    theme: ThemeSupa,
    variables: {
        default: {
            colors: {
                brand: '#6366F1',
                brandAccent: '#D4FF00',
                brandButtonText: '#FAFAF5',
                inputBackground: '#0F1424',
                inputBorder: 'rgba(250,250,245,0.15)',
                inputBorderFocus: '#6366F1',
                inputBorderHover: '#6366F1',
                inputText: '#FAFAF5',
                inputPlaceholder: 'rgba(250,250,245,0.4)',
                messageText: '#FAFAF5',
                messageBackground: 'rgba(99,102,241,0.15)',
                dividerBackground: 'rgba(250,250,245,0.12)',
                anchorTextColor: '#D4FF00',
                anchorTextHoverColor: '#6366F1',
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
