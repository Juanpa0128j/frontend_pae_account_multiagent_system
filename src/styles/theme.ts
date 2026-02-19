'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366F1',
            light: '#818CF8',
            dark: '#4F46E5',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
        },
        warning: {
            main: '#F59E0B',
            light: '#FCD34D',
            dark: '#D97706',
        },
        info: {
            main: '#3B82F6',
            light: '#60A5FA',
            dark: '#2563EB',
        },
        success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
        },
        background: {
            default: '#0A0E1A',
            paper: '#111827',
        },
        text: {
            primary: '#F9FAFB',
            secondary: '#9CA3AF',
            disabled: '#6B7280',
        },
        divider: 'rgba(255,255,255,0.08)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, letterSpacing: '-0.01em' },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, color: '#D1D5DB' },
        subtitle2: { fontWeight: 500, color: '#9CA3AF' },
        body1: { lineHeight: 1.6 },
        body2: { lineHeight: 1.5, color: '#D1D5DB' },
        caption: { color: '#6B7280' },
        button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#374151 #0A0E1A',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#0A0E1A',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#374151',
                        borderRadius: '3px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        borderColor: 'rgba(99,102,241,0.3)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                },
                contained: {
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #818CF8, #6366F1)',
                        boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(99,102,241,0.5)',
                    color: '#818CF8',
                    '&:hover': {
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99,102,241,0.08)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: 6,
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        backgroundColor: '#0D1120',
                        color: '#9CA3AF',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    },
                },
            },
        },
        MuiTableBody: {
            styleOverrides: {
                root: {
                    '& .MuiTableRow-root': {
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(99,102,241,0.05)',
                        },
                    },
                    '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: '#D1D5DB',
                    },
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    height: 6,
                    backgroundColor: 'rgba(99,102,241,0.15)',
                },
                bar: {
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    minHeight: 48,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.12)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(99,102,241,0.4)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#6366F1',
                        },
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#0D1120',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(10,14,26,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: 'none',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: 'rgba(255,255,255,0.06)',
                },
            },
        },
    },
};

const theme = createTheme(themeOptions);

export default theme;
