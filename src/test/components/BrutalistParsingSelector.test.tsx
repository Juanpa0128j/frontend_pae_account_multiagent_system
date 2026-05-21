import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BrutalistParsingSelector from '@/components/upload/BrutalistParsingSelector';

describe('BrutalistParsingSelector', () => {
    it('renders the section label and the selected mode in the trigger', () => {
        render(<BrutalistParsingSelector value="fast" onChange={vi.fn()} />);
        expect(screen.getByText('// CALIDAD DE EXTRACCIÓN')).toBeInTheDocument();
        const trigger = screen.getByRole('combobox');
        expect(trigger).toHaveTextContent('Rápido');
        expect(trigger).toHaveTextContent('PDFs con texto seleccionable');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('opens the listbox on click and renders all six modes with descriptions', () => {
        render(<BrutalistParsingSelector value="fast" onChange={vi.fn()} />);
        fireEvent.click(screen.getByRole('combobox'));

        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();

        // All six accountant-friendly labels rendered inside the listbox.
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(6);

        const labels = options.map((o) => o.textContent ?? '');
        expect(labels.some((t) => t.includes('Rápido'))).toBe(true);
        expect(labels.some((t) => t.includes('Estándar'))).toBe(true);
        expect(labels.some((t) => t.includes('Alta calidad'))).toBe(true);
        expect(labels.some((t) => t.includes('Máxima precisión'))).toBe(true);
        expect(labels.some((t) => t.includes('Foto o escaneo'))).toBe(true);
        expect(labels.some((t) => t.includes('Documento largo y complejo'))).toBe(true);
    });

    it('marks the active option with aria-selected', () => {
        render(<BrutalistParsingSelector value="agentic" onChange={vi.fn()} />);
        fireEvent.click(screen.getByRole('combobox'));
        const options = screen.getAllByRole('option');
        const agenticOption = options.find((o) => o.textContent?.includes('Foto o escaneo'));
        expect(agenticOption).toHaveAttribute('aria-selected', 'true');
        const fastOption = options.find((o) => o.textContent?.includes('Rápido'));
        expect(fastOption).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onChange with the mode value when an option is clicked', () => {
        const onChange = vi.fn();
        render(<BrutalistParsingSelector value="fast" onChange={onChange} />);
        fireEvent.click(screen.getByRole('combobox'));
        const options = screen.getAllByRole('option');
        const premiumOption = options.find((o) => o.textContent?.includes('Alta calidad'));
        if (!premiumOption) throw new Error('Premium option not found');
        fireEvent.click(premiumOption);
        expect(onChange).toHaveBeenCalledWith('premium');
    });

    it('supports keyboard navigation: ArrowDown moves active index and Enter selects', () => {
        const onChange = vi.fn();
        render(<BrutalistParsingSelector value="fast" onChange={onChange} />);

        // Open via ArrowDown on the trigger
        const trigger = screen.getByRole('combobox');
        trigger.focus();
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        const options = screen.getAllByRole('option');
        // First option ("Rápido") starts focused; ArrowDown advances to "Estándar".
        fireEvent.keyDown(options[0], { key: 'ArrowDown' });
        fireEvent.keyDown(options[1], { key: 'Enter' });

        expect(onChange).toHaveBeenCalledWith('standard');
    });

    it('exposes agentic and agentic_plus as selectable modes', () => {
        const onChange = vi.fn();
        render(<BrutalistParsingSelector value="fast" onChange={onChange} />);
        fireEvent.click(screen.getByRole('combobox'));
        const options = screen.getAllByRole('option');

        const agenticOption = options.find((o) => o.textContent?.includes('Foto o escaneo'));
        if (!agenticOption) throw new Error('agentic option not rendered');
        fireEvent.click(agenticOption);
        expect(onChange).toHaveBeenCalledWith('agentic');

        // Reopen for agentic_plus (the menu closes after a selection).
        fireEvent.click(screen.getByRole('combobox'));
        const refreshedOptions = screen.getAllByRole('option');
        const agenticPlus = refreshedOptions.find((o) =>
            o.textContent?.includes('Documento largo y complejo')
        );
        if (!agenticPlus) throw new Error('agentic_plus option not rendered');
        fireEvent.click(agenticPlus);
        expect(onChange).toHaveBeenCalledWith('agentic_plus');
    });
});
