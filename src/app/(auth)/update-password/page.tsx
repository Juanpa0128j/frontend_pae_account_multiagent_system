'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createClient(), []);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Exchange PKCE code from recovery email → session, so updateUser() works.
    // If no code is present and no active session exists, the user landed here
    // by accident — bounce them to /forgot-password.
    useEffect(() => {
        const code = searchParams.get('code');
        let cancelled = false;

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
                if (cancelled) return;
                if (exchangeError) {
                    setError(
                        'El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.'
                    );
                }
                const url = new URL(window.location.href);
                url.searchParams.delete('code');
                window.history.replaceState({}, '', url.toString());
            });
            return () => {
                cancelled = true;
            };
        }

        supabase.auth.getSession().then(({ data }) => {
            if (cancelled) return;
            if (!data.session) {
                router.replace('/forgot-password');
            }
        });

        return () => {
            cancelled = true;
        };
    }, [searchParams, supabase, router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setSuccess(true);
        setTimeout(() => router.push('/companies'), 1500);
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 440, px: 3, py: 6 }}>
            <Box sx={{ mb: 5 }}>
                <Typography
                    component="p"
                    sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: '#D4FF00',
                        mb: 1.5,
                    }}
                >
                    {'// RESTABLECER CONTRASEÑA'}
                </Typography>
                <Typography
                    variant="h1"
                    sx={{
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontSize: { xs: '2.25rem', md: '3rem' },
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 0.95,
                        color: '#FAFAF5',
                        textTransform: 'uppercase',
                        mb: 1.5,
                    }}
                >
                    Nueva contraseña
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.95rem',
                        color: 'rgba(250,250,245,0.5)',
                        fontStyle: 'italic',
                    }}
                >
                    Elige una contraseña segura para tu cuenta
                </Typography>
            </Box>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    position: 'relative',
                    border: '1px solid rgba(250,250,245,0.15)',
                    borderRadius: 0,
                    padding: { xs: '2rem', md: '2.75rem' },
                    backgroundColor: '#0A0E1A',
                    boxShadow: '4px 4px 0 0 rgba(99,102,241,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.5,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        width: 32,
                        height: 12,
                        backgroundColor: '#D4FF00',
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -1,
                        left: -1,
                        width: 64,
                        height: 6,
                        backgroundColor: '#EC4899',
                    },
                }}
            >
                <FieldLabel>Nueva contraseña</FieldLabel>
                <TextField
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    fullWidth
                    sx={brutalistInputSx}
                />

                <FieldLabel>Confirmar contraseña</FieldLabel>
                <TextField
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    fullWidth
                    sx={brutalistInputSx}
                />

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            borderRadius: 0,
                            backgroundColor: 'rgba(239,68,68,0.15)',
                            color: '#FAFAF5',
                            border: '2px solid #EF4444',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            borderRadius: 0,
                            backgroundColor: 'rgba(212,255,0,0.15)',
                            color: '#FAFAF5',
                            border: '2px solid #D4FF00',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        Contraseña actualizada. Redirigiendo…
                    </Alert>
                )}

                <Button
                    type="submit"
                    disabled={loading || success}
                    sx={{
                        mt: 1,
                        borderRadius: 0,
                        border: '2px solid #6366F1',
                        backgroundColor: 'transparent',
                        color: '#FAFAF5',
                        fontFamily: '"Bricolage Grotesque", sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        fontSize: '0.95rem',
                        py: 1.5,
                        textTransform: 'uppercase',
                        transition: 'all 180ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                        '&:hover': {
                            backgroundColor: '#6366F1',
                            color: '#FAFAF5',
                        },
                        '&:disabled': {
                            opacity: 0.5,
                            color: '#FAFAF5',
                        },
                    }}
                >
                    {loading ? 'ACTUALIZANDO…' : 'ACTUALIZAR CONTRASEÑA'}
                </Button>
            </Box>
        </Box>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            component="label"
            sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#FAFAF5',
                fontWeight: 700,
                mb: -1,
            }}
        >
            {children}
        </Typography>
    );
}

const brutalistInputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 0,
        backgroundColor: '#0F1424',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        '& fieldset': {
            border: '1px solid rgba(250,250,245,0.15)',
        },
        '&:hover fieldset': {
            border: '2px solid #6366F1',
        },
        '&.Mui-focused fieldset': {
            border: '2px solid #6366F1',
        },
    },
    '& input': {
        color: '#FAFAF5',
        padding: '12px 16px',
    },
    '& input::placeholder': {
        color: 'rgba(250,250,245,0.4)',
        opacity: 1,
    },
};
