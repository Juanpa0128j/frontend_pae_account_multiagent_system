'use client';

export const runtime = 'edge';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const supabase = useMemo(() => createClient(), []);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/update-password`,
        });
        setLoading(false);
        // Always show success — anti-enumeration (don't reveal if email exists)
        setSubmitted(true);
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
                    {'// RECUPERAR ACCESO'}
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
                    Restablecer contraseña
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.95rem',
                        color: 'rgba(250,250,245,0.5)',
                        fontStyle: 'italic',
                    }}
                >
                    Te enviaremos un enlace por correo para crear una nueva contraseña
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
                    Correo electrónico
                </Typography>
                <TextField
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    fullWidth
                    disabled={submitted}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                            backgroundColor: '#0F1424',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            '& fieldset': { border: '1px solid rgba(250,250,245,0.15)' },
                            '&:hover fieldset': { border: '2px solid #6366F1' },
                            '&.Mui-focused fieldset': { border: '2px solid #6366F1' },
                        },
                        '& input': { color: '#FAFAF5', padding: '12px 16px' },
                        '& input::placeholder': { color: 'rgba(250,250,245,0.4)', opacity: 1 },
                    }}
                />

                {submitted && (
                    <Alert
                        severity="success"
                        sx={{
                            borderRadius: 0,
                            backgroundColor: '#D4FF00',
                            color: '#0A0E1A',
                            border: '2px solid #0A0E1A',
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            boxShadow: '4px 4px 0 0 #FAFAF5',
                            '& .MuiAlert-icon': { color: '#0A0E1A' },
                        }}
                    >
                        {`// Si la cuenta existe, te enviamos un correo`}
                    </Alert>
                )}

                <Button
                    type="submit"
                    disabled={loading || submitted || !email.trim()}
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
                        '&:hover': { backgroundColor: '#6366F1', color: '#FAFAF5' },
                        '&:disabled': { opacity: 0.5, color: '#FAFAF5' },
                    }}
                >
                    {loading ? 'ENVIANDO…' : 'ENVIAR ENLACE'}
                </Button>

                <Box
                    component={Link}
                    href="/login"
                    sx={{
                        mt: 1,
                        textAlign: 'center',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.7rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#D4FF00',
                        textDecoration: 'none',
                        '&:hover': { color: '#6366F1' },
                    }}
                >
                    {'← Volver al inicio de sesión'}
                </Box>
            </Box>
        </Box>
    );
}
