import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({ activeCompany: null }),
}));

vi.mock('@mui/material', async () => {
    const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
    return {
        ...actual,
        useMediaQuery: () => false,
    };
});

describe('Sidebar', () => {
    it('does NOT render Evaluación nav item for admin users', () => {
        render(<Sidebar userRole="admin" />);
        expect(screen.queryByText('Evaluación')).toBeNull();
    });

    it('does NOT render Evaluación nav item for non-admin users', () => {
        render(<Sidebar userRole="contador" />);
        expect(screen.queryByText('Evaluación')).toBeNull();
    });

    it('renders expected nav items without Evaluación', () => {
        render(<Sidebar userRole="admin" />);
        expect(screen.getByText('Dashboard')).toBeTruthy();
        expect(screen.getByText('Configuración')).toBeTruthy();
        expect(screen.queryByText('Evaluación')).toBeNull();
    });
});
