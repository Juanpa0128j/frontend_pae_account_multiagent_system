import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrutalistButton from '@/components/brutalist/BrutalistButton';

describe('BrutalistButton', () => {
    it('size="sm" renders with minHeight at least 44px', () => {
        render(<BrutalistButton size="sm">Small</BrutalistButton>);
        const btn = screen.getByRole('button', { name: 'Small' });
        expect(btn).toHaveStyle('min-height: 44px');
    });

    it('size="md" renders with minHeight at least 44px', () => {
        render(<BrutalistButton size="md">Medium</BrutalistButton>);
        const btn = screen.getByRole('button', { name: 'Medium' });
        expect(btn).toHaveStyle('min-height: 44px');
    });
});
