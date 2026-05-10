'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { setQueryErrorHandler } from '@/lib/queryClient';

interface ErrorState {
    open: boolean;
    message: string;
    severity: 'error' | 'warning';
}

interface GlobalErrorContextValue {
    showError: (message: string, severity?: 'error' | 'warning') => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextValue>({
    showError: () => {},
});

export function useGlobalError() {
    return useContext(GlobalErrorContext);
}

export function GlobalErrorProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ErrorState>({
        open: false,
        message: '',
        severity: 'error',
    });

    const showError = useCallback((message: string, severity: 'error' | 'warning' = 'error') => {
        setState({ open: true, message: friendlyMessage(message), severity });
    }, []);

    useEffect(() => {
        setQueryErrorHandler((msg) => showError(msg));
    }, [showError]);

    const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setState((prev) => ({ ...prev, open: false }));
    };

    return (
        <GlobalErrorContext.Provider value={{ showError }}>
            {children}
            <Snackbar
                open={state.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={state.severity}
                    variant="filled"
                    sx={{ maxWidth: 480, fontSize: '0.875rem' }}
                >
                    {state.message}
                </Alert>
            </Snackbar>
        </GlobalErrorContext.Provider>
    );
}

function friendlyMessage(raw: string): string {
    if (!raw) return 'Ocurrió un error inesperado. Intente de nuevo.';
    const lower = raw.toLowerCase();
    if (lower.includes('network') || lower.includes('no response'))
        return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (lower.includes('timeout')) return 'La solicitud tardó demasiado. Intente de nuevo.';
    if (lower.includes('500') || lower.includes('internal server'))
        return 'Error interno del servidor. El equipo ha sido notificado.';
    if (lower.includes('403') || lower.includes('forbidden'))
        return 'No tiene permiso para realizar esta acción.';
    if (lower.includes('404') || lower.includes('not found'))
        return 'El recurso solicitado no fue encontrado.';
    return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}
