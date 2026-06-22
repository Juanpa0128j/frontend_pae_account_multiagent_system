'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { companyApiClient } from '@/lib/api/clients';
import type { CompanyMembership } from '@/types';
import BrutalistButton from '@/components/brutalist/BrutalistButton';
import BrutalistCard from '@/components/brutalist/BrutalistCard';
import BrutalistPageHero from '@/components/brutalist/BrutalistPageHero';
import BrutalistSection from '@/components/brutalist/BrutalistSection';
import { palette } from '@/styles/brutalist';
import { useClerk } from '@clerk/nextjs';

export default function CompaniesPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const { signOut } = useClerk();
    const [nit, setNit] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);

    const { data: companies = [], isLoading } = useQuery<CompanyMembership[]>({
        queryKey: ['my-companies'],
        queryFn: () => companyApiClient.listMyCompanies(),
    });

    const joinMutation = useMutation({
        mutationFn: (nitValue: string) => companyApiClient.joinCompany(nitValue),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['my-companies'] });
            setNit('');
            setJoinError(null);
        },
        onError: (err: { response?: { status: number } }) => {
            if (err.response?.status === 404) {
                setJoinError('NIT no encontrado. Verifique que la empresa esté registrada.');
            } else if (err.response?.status === 409) {
                setJoinError('Ya pertenece a esta empresa.');
            } else {
                setJoinError('Error al unirse. Intente de nuevo.');
            }
        },
    });

    function handleSelect(companyNit: string) {
        localStorage.setItem('activeNit', companyNit);
        router.push('/');
    }

    async function handleSignOut() {
        await signOut();
        router.push('/login');
    }

    function handleJoinSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!nit.trim()) return;
        joinMutation.mutate(nit.trim());
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#0A0E1A', color: '#FAFAF5' }}>
            <BrutalistPageHero
                eyebrow="// MÓDULO_0 // EMPRESAS"
                title="Empresas"
                subtitle="Selecciona o únete a una empresa"
                accent="#6366F1"
            />

            <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, pb: { xs: 6, md: 10 } }}>
                <BrutalistSection
                    number="01"
                    title="Mis Empresas"
                    subtitle="Empresas a las que tienes acceso"
                    accent="#6366F1"
                >
                    {isLoading && <CircularProgress sx={{ color: '#6366F1' }} />}

                    {!isLoading && companies.length === 0 && (
                        <Typography
                            sx={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.7rem',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                color: 'rgba(250,250,245,0.4)',
                            }}
                        >
                            {'// SIN EMPRESAS — Únete a una empresa abajo'}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {companies.map((c) => (
                            <BrutalistCard
                                key={c.company_nit}
                                onClick={() => handleSelect(c.company_nit)}
                                accent="#6366F1"
                            >
                                {c.razon_social ? (
                                    <>
                                        <Typography
                                            sx={{
                                                fontFamily: '"Bricolage Grotesque", sans-serif',
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                letterSpacing: '-0.02em',
                                                color: '#FAFAF5',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {c.razon_social}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontFamily: '"JetBrains Mono", monospace',
                                                fontSize: '0.7rem',
                                                letterSpacing: '0.2em',
                                                color: 'rgba(250,250,245,0.45)',
                                                mt: 0.5,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {c.company_nit}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography
                                        sx={{
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: '0.85rem',
                                            letterSpacing: '0.15em',
                                            color: '#FAFAF5',
                                        }}
                                    >
                                        {c.company_nit}
                                    </Typography>
                                )}
                            </BrutalistCard>
                        ))}
                    </Box>
                </BrutalistSection>

                <BrutalistSection
                    number="02"
                    title="Unirse a Empresa"
                    subtitle="Ingresa el NIT de la empresa"
                    accent="#6366F1"
                >
                    <Box
                        component="form"
                        onSubmit={handleJoinSubmit}
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                        }}
                    >
                        <TextField
                            value={nit}
                            onChange={(e) => setNit(e.target.value)}
                            placeholder="NIT de la empresa (ej: 800999888-1)"
                            helperText="El NIT lo encontrarás en el RUT de la empresa"
                            variant="outlined"
                            size="small"
                            sx={{
                                flex: 1,
                                minWidth: 240,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 0,
                                    backgroundColor: 'rgba(250,250,245,0.05)',
                                    border: '2px solid rgba(250,250,245,0.2)',
                                    color: '#FAFAF5',
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: '0.85rem',
                                    '&:hover': { borderColor: '#6366F1' },
                                    '&.Mui-focused': { borderColor: '#6366F1' },
                                    '& fieldset': { border: 'none' },
                                },
                                '& input::placeholder': { color: 'rgba(250,250,245,0.3)' },
                            }}
                        />
                        <BrutalistButton
                            type="submit"
                            disabled={joinMutation.isPending || !nit.trim()}
                            accent="#6366F1"
                        >
                            {joinMutation.isPending ? 'UNIENDO...' : 'UNIRSE'}
                        </BrutalistButton>
                    </Box>

                    {joinError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 2, borderRadius: 0, border: '2px solid #EF4444' }}
                        >
                            {joinError}
                        </Alert>
                    )}
                </BrutalistSection>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, px: 1 }}>
                    <BrutalistButton
                        variant="ghost"
                        accent={palette.paperFaint}
                        size="sm"
                        onClick={() => void handleSignOut()}
                    >
                        {'// CERRAR SESIÓN'}
                    </BrutalistButton>
                </Box>
            </Box>
        </Box>
    );
}
