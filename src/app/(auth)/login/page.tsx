'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Auth } from '@supabase/auth-ui-react';
import { Box, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import { brutalistAuthTheme } from '@/lib/supabase/auth-theme';
import { classifyUnknownMessage, translateAuthMessage } from '@/lib/supabase/translate-auth-error';

const ATTR_KIND = 'data-brutalist-msg';
const ATTR_TRANSLATED = 'data-brutalist-translated';

const KNOWN_FRAGMENTS = [
    'invalid login credentials',
    'invalid email',
    'email not confirmed',
    'already registered',
    'check your email',
    'rate limit',
    'for security purposes',
    'password should be at least',
    'token has expired',
    'auth session missing',
    'failed to fetch',
    'network error',
    'unable to validate email',
    'user not found',
    'signups not allowed',
    'new password should be different',
    'your password has been updated',
    'correo o contraseña',
    'revisa tu correo',
    'demasiados intentos',
    'sesión expiró',
];

function looksLikeAuthMessage(text: string): boolean {
    const t = text.trim().toLowerCase();
    if (!t || t.length > 240) return false;
    return KNOWN_FRAGMENTS.some((frag) => t.includes(frag));
}

function useLocalizedAuthMessages(containerRef: React.RefObject<HTMLDivElement>) {
    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;

        const decorate = (element: HTMLElement) => {
            // Only operate on leaf elements (no child elements, just text nodes).
            if (element.children.length > 0) return;

            const tag = element.tagName.toLowerCase();
            if (tag === 'input' || tag === 'button' || tag === 'label' || tag === 'a') return;

            const text = element.textContent ?? '';
            if (!looksLikeAuthMessage(text)) return;

            const translated = translateAuthMessage(text);
            const kind = translated?.kind ?? classifyUnknownMessage(text);
            const finalText = translated?.text ?? text;

            // Don't mutate textContent — React may overwrite. Use attribute + CSS attr().
            if (element.getAttribute(ATTR_TRANSLATED) !== finalText) {
                element.setAttribute(ATTR_TRANSLATED, finalText);
            }
            if (element.getAttribute(ATTR_KIND) !== kind) {
                element.setAttribute(ATTR_KIND, kind);
            }
        };

        const scan = () => {
            root.querySelectorAll<HTMLElement>('*').forEach(decorate);
        };

        scan();
        const observer = new MutationObserver(scan);
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [containerRef]);
}

type Toast = { kind: 'success' | 'info' | 'error'; text: string };

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
    oauth_callback_failed: 'No se pudo completar el inicio de sesión con el proveedor externo',
};

const SIGNUP_BUTTON_TEXTS = ['crear cuenta', 'creando cuenta', 'sign up', 'signing up'];

export default function LoginPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLDivElement>(null);
    const justSignedUpRef = useRef(false);
    const [toast, setToast] = useState<Toast | null>(null);
    useLocalizedAuthMessages(formRef);

    // Track which button (sign_in vs sign_up) was clicked so we can route
    // SIGNED_IN events accurately without timestamp heuristics.
    useEffect(() => {
        const root = formRef.current;
        if (!root) return;
        const onClick = (event: Event) => {
            const target = event.target as HTMLElement | null;
            const button = target?.closest('button[type="submit"]');
            if (!button) return;
            const label = (button.textContent ?? '').trim().toLowerCase();
            justSignedUpRef.current = SIGNUP_BUTTON_TEXTS.some((t) => label.includes(t));
        };
        root.addEventListener('click', onClick, true);
        return () => root.removeEventListener('click', onClick, true);
    }, []);

    // Surface OAuth callback errors carried back via ?error=
    useEffect(() => {
        const errorCode = searchParams.get('error');
        if (!errorCode) return;
        setToast({
            kind: 'error',
            text: OAUTH_ERROR_MESSAGES[errorCode] ?? 'Error al iniciar sesión',
        });
        // Strip ?error so a refresh doesn't re-show the toast
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
    }, [searchParams]);

    useEffect(() => {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                router.replace('/update-password');
                return;
            }
            if (event === 'SIGNED_OUT') {
                setToast(null);
                return;
            }
            if (event === 'SIGNED_IN' && session) {
                if (justSignedUpRef.current) {
                    justSignedUpRef.current = false;
                    await supabase.auth.signOut();
                    setToast({
                        kind: 'success',
                        text: 'Cuenta creada — inicia sesión con tu correo',
                    });
                    return;
                }
                setToast({ kind: 'success', text: 'Sesión iniciada — redirigiendo' });
                router.replace('/companies');
            }
        });

        return () => data.subscription.unsubscribe();
    }, [supabase, router]);

    // Watch for the Auth UI's "check your email" confirmation text and surface as toast.
    useEffect(() => {
        const root = formRef.current;
        if (!root) return;
        const check = () => {
            const info = root.querySelector('[data-brutalist-msg="info"]');
            if (info) {
                const translated = info.getAttribute('data-brutalist-translated') ?? '';
                setToast({
                    kind: 'info',
                    text: translated || 'Revisa tu correo para continuar',
                });
            }
        };
        check();
        const obs = new MutationObserver(check);
        obs.observe(root, { childList: true, subtree: true, attributes: true });
        return () => obs.disconnect();
    }, []);

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

            {toast && (
                <Box
                    role="status"
                    sx={{
                        mb: 3,
                        padding: '14px 16px',
                        border: '2px solid',
                        borderRadius: 0,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        lineHeight: 1.5,
                        position: 'relative',
                        ...(toast.kind === 'success' && {
                            backgroundColor: '#D4FF00',
                            color: '#0A0E1A',
                            borderColor: '#0A0E1A',
                            boxShadow: '4px 4px 0 0 #FAFAF5',
                        }),
                        ...(toast.kind === 'info' && {
                            backgroundColor: '#6366F1',
                            color: '#FAFAF5',
                            borderColor: '#FAFAF5',
                            boxShadow: '4px 4px 0 0 #D4FF00',
                        }),
                        ...(toast.kind === 'error' && {
                            backgroundColor: 'rgba(239,68,68,0.18)',
                            color: '#FAFAF5',
                            borderColor: '#EF4444',
                            boxShadow: '4px 4px 0 0 #EF4444',
                        }),
                    }}
                >
                    {`// ${toast.text}`}
                </Box>
            )}

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
                    ref={formRef}
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
                        // Hide Auth UI's built-in forgot-password link — replaced by our own
                        '& a[href*="forgot-password"]': {
                            display: 'none !important',
                        },
                        // Auth messages — hide original text, render Spanish via ::before attr()
                        '& [data-brutalist-msg]': {
                            display: 'block !important',
                            width: '100% !important',
                            boxSizing: 'border-box !important',
                            padding: '14px 16px !important',
                            margin: '8px 0 0 0 !important',
                            borderRadius: '0 !important',
                            border: '2px solid !important',
                            position: 'relative',
                            // Hide the original English text but keep element painted
                            fontSize: '0 !important',
                            lineHeight: '0 !important',
                            color: 'transparent !important',
                            textIndent: '-9999px',
                        },
                        '& [data-brutalist-msg]::before': {
                            content: '"// " attr(data-brutalist-translated)',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            lineHeight: 1.5,
                            textTransform: 'uppercase',
                            display: 'block',
                            textIndent: 0,
                        },
                        '& [data-brutalist-msg="error"]': {
                            backgroundColor: 'rgba(239,68,68,0.18) !important',
                            borderColor: '#EF4444 !important',
                            boxShadow: '4px 4px 0 0 #EF4444',
                        },
                        '& [data-brutalist-msg="error"]::before': {
                            color: '#FAFAF5',
                        },
                        '& [data-brutalist-msg="info"]': {
                            backgroundColor: '#D4FF00 !important',
                            borderColor: '#0A0E1A !important',
                            boxShadow: '4px 4px 0 0 #FAFAF5',
                        },
                        '& [data-brutalist-msg="info"]::before': {
                            color: '#0A0E1A',
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
                                    // Shown ON sign_up view, toggles BACK to sign_in
                                    link_text: '¿Ya tienes cuenta? Inicia sesión',
                                },
                                sign_up: {
                                    email_label: 'CORREO ELECTRÓNICO',
                                    password_label: 'CONTRASEÑA',
                                    button_label: 'CREAR CUENTA',
                                    loading_button_label: 'CREANDO CUENTA…',
                                    email_input_placeholder: 'tu@correo.com',
                                    password_input_placeholder: 'Crea una contraseña segura',
                                    social_provider_text: 'CONTINUAR CON {{provider}}',
                                    // Shown ON sign_in view, toggles to sign_up
                                    link_text: '¿No tienes cuenta? Regístrate',
                                    confirmation_text: 'Revisa tu correo para confirmar tu cuenta',
                                },
                                forgotten_password: {
                                    email_label: 'CORREO ELECTRÓNICO',
                                    password_label: 'CONTRASEÑA',
                                    email_input_placeholder: 'tu@correo.com',
                                    button_label: 'ENVIAR INSTRUCCIONES',
                                    loading_button_label: 'ENVIANDO…',
                                    link_text: '¿Olvidaste tu contraseña?',
                                    confirmation_text:
                                        'Revisa tu correo para restablecer la contraseña',
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

                {/* Custom forgot-password link (Auth UI's built-in is hidden via CSS) */}
                <Box
                    component={Link}
                    href="/forgot-password"
                    sx={{
                        display: 'block',
                        mt: 2.5,
                        textAlign: 'center',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#6366F1',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': { color: '#D4FF00' },
                    }}
                >
                    {'¿Olvidaste tu contraseña?'}
                </Box>
            </Box>
        </Box>
    );
}
