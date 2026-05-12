import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BrutalistParsingSelector from '@/components/upload/BrutalistParsingSelector';

vi.mock('@/components/brutalist/BrutalistButton', () => ({
    default: vi.fn(({ children, subLabel, variant, onClick }) => (
        <button data-variant={variant} data-sublabel={subLabel} onClick={onClick}>
            {children}
            {subLabel && <span>{subLabel}</span>}
        </button>
    )),
}));

describe('BrutalistParsingSelector', () => {
    it('renders all 4 modes with Spanish labels', () => {
        render(<BrutalistParsingSelector value="fast" onChange={vi.fn()} />);
        expect(screen.getByText('RÁPIDO')).toBeInTheDocument();
        expect(screen.getByText('ESTÁNDAR')).toBeInTheDocument();
        expect(screen.getByText('PREMIUM')).toBeInTheDocument();
        expect(screen.getByText('GPT-4O')).toBeInTheDocument();
    });

    it('renders sub-labels for all modes', () => {
        render(<BrutalistParsingSelector value="fast" onChange={vi.fn()} />);
        expect(screen.getByText('económico')).toBeInTheDocument();
        expect(screen.getByText('balanceado')).toBeInTheDocument();
        expect(screen.getByText('tablas complejas')).toBeInTheDocument();
        expect(screen.getByText('máxima precisión')).toBeInTheDocument();
    });

    it('calls onChange with the correct value when a mode is clicked', () => {
        const onChange = vi.fn();
        render(<BrutalistParsingSelector value="fast" onChange={onChange} />);
        fireEvent.click(screen.getByText('PREMIUM'));
        expect(onChange).toHaveBeenCalledWith('premium');
    });

    it('renders active mode with primary variant and inactive modes with outline', () => {
        render(<BrutalistParsingSelector value="standard" onChange={vi.fn()} />);
        const buttons = screen.getAllByRole('button');
        const standardButton = buttons.find((b) => b.textContent?.includes('ESTÁNDAR'));
        const fastButton = buttons.find((b) => b.textContent?.includes('RÁPIDO'));
        expect(standardButton).toHaveAttribute('data-variant', 'primary');
        expect(fastButton).toHaveAttribute('data-variant', 'outline');
    });

    it('renders the extraction mode label', () => {
        render(<BrutalistParsingSelector value="fast" onChange={vi.fn()} />);
        expect(screen.getByText('// MODO DE EXTRACCIÓN')).toBeInTheDocument();
    });
});
