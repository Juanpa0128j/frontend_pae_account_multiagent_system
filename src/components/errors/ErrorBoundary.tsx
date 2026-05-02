'use client';

import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: unknown): State {
        const message =
            error instanceof Error ? error.message : 'Error inesperado al renderizar la página.';
        return { hasError: true, message };
    }

    componentDidCatch(error: unknown, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, message: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '40vh',
                        gap: 2,
                        p: 4,
                    }}
                >
                    <Alert
                        severity="error"
                        variant="outlined"
                        sx={{ maxWidth: 520, width: '100%' }}
                    >
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Algo salió mal
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            {this.state.message}
                        </Typography>
                    </Alert>
                    <Button variant="outlined" size="small" onClick={this.handleReset}>
                        Intentar de nuevo
                    </Button>
                </Box>
            );
        }
        return this.props.children;
    }
}
