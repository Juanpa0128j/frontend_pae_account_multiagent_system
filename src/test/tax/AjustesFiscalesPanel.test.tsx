import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AjustesFiscalesPanel } from '../../app/tax/components/AjustesFiscalesPanel';
import type { AjusteFiscal } from '../../types';

vi.mock('../../hooks/useTax', () => ({
    useAjustesFiscales: vi.fn(),
    useUpsertAjusteFiscal: vi.fn(),
    useDeleteAjusteFiscal: vi.fn(),
}));

import * as useTaxModule from '../../hooks/useTax';

const mockAjuste: AjusteFiscal = {
    id: 'uuid-1',
    company_nit: '800999888',
    year: 2024,
    seccion: 'ESF_ACTIVO',
    concepto: 'Propiedad planta y equipo',
    valor_contable: 10000000,
    valor_fiscal: 8500000,
    tipo_diferencia: 'temporaria_deducible',
    descripcion: null,
};

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('AjustesFiscalesPanel', () => {
    beforeEach(() => {
        vi.mocked(useTaxModule.useAjustesFiscales).mockReturnValue({
            data: [mockAjuste],
            isLoading: false,
            error: null,
        } as any);
        vi.mocked(useTaxModule.useUpsertAjusteFiscal).mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue(mockAjuste),
            isPending: false,
        } as any);
        vi.mocked(useTaxModule.useDeleteAjusteFiscal).mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue(undefined),
            isPending: false,
        } as any);
    });

    it('renders seccion headings', () => {
        render(<AjustesFiscalesPanel companyNit="800999888" year={2024} />, { wrapper });
        expect(screen.getByText(/ESF_ACTIVO/i)).toBeInTheDocument();
    });

    it('renders existing ajuste concepto', () => {
        render(<AjustesFiscalesPanel companyNit="800999888" year={2024} />, { wrapper });
        expect(screen.getByText('Propiedad planta y equipo')).toBeInTheDocument();
    });

    it('renders add button per seccion', () => {
        render(<AjustesFiscalesPanel companyNit="800999888" year={2024} />, { wrapper });
        const addButtons = screen.getAllByRole('button', { name: /agregar/i });
        expect(addButtons.length).toBeGreaterThan(0);
    });

    it('shows loading state', () => {
        vi.mocked(useTaxModule.useAjustesFiscales).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        } as any);
        render(<AjustesFiscalesPanel companyNit="800999888" year={2024} />, { wrapper });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
