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

    it('numbers modules 1-10 without gaps (Configuración=9, Guía=10)', () => {
        render(<Sidebar userRole="admin" />);
        // Each module renders its number; the sequence must be gap-free 1-10.
        for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
            expect(screen.getByText(n)).toBeTruthy();
        }
        // The old bug skipped 9 and jumped to 11 — guard against that regression.
        expect(screen.queryByText('11')).toBeNull();
    });
});
