import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import NavigationProgress from '@/components/layout/NavigationProgress';

vi.mock('next/navigation', () => ({
    usePathname: () => '/tax',
}));

function clickAnchor(attrs: Record<string, string>) {
    const a = document.createElement('a');
    Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
    document.body.appendChild(a);
    fireEvent.click(a);
    document.body.removeChild(a);
}

describe('NavigationProgress', () => {
    it('does NOT show the bar for a blob download anchor', () => {
        const { container } = render(<NavigationProgress />);
        clickAnchor({ href: 'blob:http://x/y', download: '' });
        // component returns null when not visible -> nothing rendered
        expect(container.firstChild).toBeNull();
    });

    it('DOES show the bar for a normal internal link click', () => {
        const { container } = render(<NavigationProgress />);
        clickAnchor({ href: '/other' });
        expect(container.firstChild).not.toBeNull();
    });
});
