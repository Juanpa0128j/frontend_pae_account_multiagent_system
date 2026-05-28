import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ViaBBlockerPanel from '@/app/tax/components/ViaBBlockerPanel';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

describe('ViaBBlockerPanel', () => {
    beforeEach(() => {
        mockPush.mockReset();
    });

    it('renders the declarations copy when section="declarations"', () => {
        render(<ViaBBlockerPanel section="declarations" />);

        expect(screen.getByText('// VÍA B — DECLARACIONES NO DISPONIBLE')).toBeInTheDocument();
        expect(screen.getByText('Necesitamos los documentos fuente.')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /cargar documentos fuente/i })
        ).toBeInTheDocument();
    });

    it('renders the certificates copy when section="certificates"', () => {
        render(<ViaBBlockerPanel section="certificates" />);

        expect(screen.getByText('// VÍA B — CERTIFICADOS F220 NO DISPONIBLE')).toBeInTheDocument();
        expect(screen.getByText('No tenemos retenciones por tercero.')).toBeInTheDocument();
    });

    it('renders the exogena copy when section="exogena"', () => {
        render(<ViaBBlockerPanel section="exogena" />);

        expect(
            screen.getByText('// VÍA B — INFORMACIÓN EXÓGENA NO DISPONIBLE')
        ).toBeInTheDocument();
        expect(screen.getByText('Exógena necesita el detalle por movimiento.')).toBeInTheDocument();
    });

    it('routes to /upload when the CTA is clicked', () => {
        render(<ViaBBlockerPanel section="declarations" />);

        fireEvent.click(screen.getByRole('button', { name: /cargar documentos fuente/i }));

        expect(mockPush).toHaveBeenCalledWith('/upload');
    });
});
