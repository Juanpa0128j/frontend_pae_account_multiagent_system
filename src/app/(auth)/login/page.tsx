'use client';

import { Auth } from '@supabase/auth-ui-react';
import { Box, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import { brutalistAuthTheme } from '@/lib/supabase/auth-theme';

export default function LoginPage() {
    const supabase = createClient();

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 440,
                px: 3,
                py: 6,
            }}
        >
            <Box sx={{ mb: 5 }}>
                <Typography
                    component="p"
                    sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#6366F1',
                        mb: 1.5,
                    }}
                >
                    // ACCESO AL SISTEMA
                </Typography>
                <Typography
                    variant="h1"
                    sx={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 0.95,
                        color: '#FAFAF5',
                        textTransform: 'uppercase',
                        mb: 1.5,
                    }}
                >
                    PAE Contable
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.95rem',
                        color: 'rgba(250,250,245,0.5)',
                        fontStyle: 'italic',
                    }}
                >
                    Automatización contable para Colombia
                </Typography>
            </Box>

            <Auth
                supabaseClient={supabase}
                appearance={brutalistAuthTheme}
                providers={['google']}
                redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/companies`}
                localization={{
                    variables: {
                        sign_in: {
                            email_label: 'CORREO ELECTRÓNICO',
                            password_label: 'CONTRASEÑA',
                            button_label: 'INGRESAR',
                            social_provider_text: 'CONTINUAR CON {{provider}}',
                            link_text: '¿No tienes cuenta? Regístrate',
                        },
                        sign_up: {
                            email_label: 'CORREO ELECTRÓNICO',
                            password_label: 'CONTRASEÑA',
                            button_label: 'CREAR CUENTA',
                            social_provider_text: 'CONTINUAR CON {{provider}}',
                            link_text: '¿Ya tienes cuenta? Inicia sesión',
                        },
                    },
                }}
            />
        </Box>
    );
}
