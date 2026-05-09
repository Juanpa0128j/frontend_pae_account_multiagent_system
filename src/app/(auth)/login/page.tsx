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
                    {'// ACCESO AL SISTEMA'}
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

            <Box sx={{ position: 'relative' }}>
                {/* Mono label above frame */}
                <Typography
                    component="p"
                    sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.65rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: '#D4FF00',
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Box
                        component="span"
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#D4FF00',
                            display: 'inline-block',
                        }}
                    />
                    {'// AUTENTICACIÓN'}
                </Typography>

                {/* Brutalist frame */}
                <Box
                    sx={{
                        position: 'relative',
                        border: '3px solid #FAFAF5',
                        borderRadius: 0,
                        padding: { xs: '1.75rem', md: '2.5rem' },
                        backgroundColor: '#0A0E1A',
                        boxShadow: '8px 8px 0 0 #6366F1',
                        transition: 'box-shadow 220ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                        '&:hover': {
                            boxShadow: '10px 10px 0 0 #D4FF00',
                        },
                        // Top-right accent block (chartreuse corner)
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 32,
                            height: 12,
                            backgroundColor: '#D4FF00',
                        },
                        // Bottom-left accent bar
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -3,
                            left: -3,
                            width: 64,
                            height: 6,
                            backgroundColor: '#EC4899',
                        },
                        // Force input contrast tweaks via deep selectors
                        '& input': {
                            fontWeight: 500,
                        },
                        '& input::placeholder': {
                            color: 'rgba(10,14,26,0.7) !important',
                            opacity: 1,
                        },
                        '& label': {
                            fontWeight: 700,
                            color: '#FAFAF5 !important',
                            letterSpacing: '0.2em',
                        },
                        '& button[type="submit"]': {
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                        },
                        '& a': {
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.7rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        },
                        // Social provider button (Google) — brutalist override
                        '& button:not([type="submit"])': {
                            backgroundColor: '#0A0E1A !important',
                            color: '#FAFAF5 !important',
                            border: '2px solid #FAFAF5 !important',
                            borderRadius: '0 !important',
                            fontFamily: '"Bricolage Grotesque", sans-serif !important',
                            fontWeight: '700 !important',
                            letterSpacing: '0.15em !important',
                            textTransform: 'uppercase',
                            fontSize: '0.85rem !important',
                            padding: '14px 18px !important',
                            boxShadow: '5px 5px 0 0 #D4FF00',
                            transition:
                                'transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 180ms cubic-bezier(0.2, 0.9, 0.3, 1), background-color 180ms cubic-bezier(0.2, 0.9, 0.3, 1), color 180ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                        },
                        '& button:not([type="submit"]):hover': {
                            backgroundColor: '#D4FF00 !important',
                            color: '#0A0E1A !important',
                            transform: 'translate(-3px, -3px)',
                            boxShadow: '8px 8px 0 0 #FAFAF5',
                        },
                        '& button:not([type="submit"]):active': {
                            transform: 'translate(2px, 2px)',
                            boxShadow: '2px 2px 0 0 #D4FF00',
                        },
                        '& button:not([type="submit"]) svg, & button:not([type="submit"]) img': {
                            width: 20,
                            height: 20,
                            flexShrink: 0,
                        },
                    }}
                >
                    <Auth
                        supabaseClient={supabase}
                        appearance={brutalistAuthTheme}
                        providers={['google']}
                        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'CORREO ELECTRÓNICO',
                                    password_label: 'CONTRASEÑA',
                                    button_label: 'INGRESAR',
                                    loading_button_label: 'INGRESANDO…',
                                    email_input_placeholder: 'tu@correo.com',
                                    password_input_placeholder: 'Escribe tu contraseña',
                                    social_provider_text: 'CONTINUAR CON {{provider}}',
                                    link_text: '¿No tienes cuenta? Regístrate',
                                },
                                sign_up: {
                                    email_label: 'CORREO ELECTRÓNICO',
                                    password_label: 'CONTRASEÑA',
                                    button_label: 'CREAR CUENTA',
                                    loading_button_label: 'CREANDO CUENTA…',
                                    email_input_placeholder: 'tu@correo.com',
                                    password_input_placeholder: 'Crea una contraseña segura',
                                    social_provider_text: 'CONTINUAR CON {{provider}}',
                                    link_text: '¿Ya tienes cuenta? Inicia sesión',
                                    confirmation_text: 'Revisa tu correo para confirmar tu cuenta',
                                },
                                forgotten_password: {
                                    email_label: 'CORREO ELECTRÓNICO',
                                    password_label: 'CONTRASEÑA',
                                    email_input_placeholder: 'tu@correo.com',
                                    button_label: 'ENVIAR INSTRUCCIONES',
                                    loading_button_label: 'ENVIANDO…',
                                    link_text: '¿Olvidaste tu contraseña?',
                                    confirmation_text: 'Revisa tu correo para restablecer la contraseña',
                                },
                                update_password: {
                                    password_label: 'NUEVA CONTRASEÑA',
                                    password_input_placeholder: 'Escribe tu nueva contraseña',
                                    button_label: 'ACTUALIZAR CONTRASEÑA',
                                    loading_button_label: 'ACTUALIZANDO…',
                                    confirmation_text: 'Tu contraseña fue actualizada',
                                },
                                magic_link: {
                                    email_input_label: 'CORREO ELECTRÓNICO',
                                    email_input_placeholder: 'tu@correo.com',
                                    button_label: 'ENVIAR ENLACE MÁGICO',
                                    loading_button_label: 'ENVIANDO…',
                                    link_text: 'Enviar enlace mágico',
                                    confirmation_text: 'Revisa tu correo para iniciar sesión',
                                },
                                verify_otp: {
                                    email_input_label: 'CORREO ELECTRÓNICO',
                                    email_input_placeholder: 'tu@correo.com',
                                    phone_input_label: 'NÚMERO DE TELÉFONO',
                                    phone_input_placeholder: 'Tu número de teléfono',
                                    token_input_label: 'CÓDIGO',
                                    token_input_placeholder: 'Código de verificación',
                                    button_label: 'VERIFICAR',
                                    loading_button_label: 'VERIFICANDO…',
                                },
                            },
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
