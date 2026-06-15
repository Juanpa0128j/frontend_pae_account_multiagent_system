import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HelpStickyNav from '@/components/help/HelpStickyNav';
import { SECTIONS } from '@/components/help/helpData';

describe('HelpStickyNav', () => {
    it('renders all section titles', () => {
        render(<HelpStickyNav activeSection={SECTIONS[0].id} />);
        SECTIONS.forEach((s) => {
            expect(screen.getAllByText(s.title).length).toBeGreaterThan(0);
        });
    });

    it('active item renders at all', () => {
        const activeId = SECTIONS[0].id;
        render(<HelpStickyNav activeSection={activeId} />);
        const titles = screen.getAllByText(SECTIONS[0].title);
        expect(titles.length).toBeGreaterThan(0);
    });

    it('active section number is visible', () => {
        const activeId = SECTIONS[2].id;
        render(<HelpStickyNav activeSection={activeId} />);
        const nums = screen.getAllByText(SECTIONS[2].number);
        expect(nums.length).toBeGreaterThan(0);
    });

    it('active nav item link contains active section title', () => {
        const activeId = SECTIONS[1].id;
        const { container } = render(<HelpStickyNav activeSection={activeId} />);
        const links = container.querySelectorAll('a');
        const activeLink = Array.from(links).find((link) =>
            link.textContent?.includes(SECTIONS[1].title)
        );
        expect(activeLink).toBeTruthy();
        expect(activeLink?.textContent).toContain(SECTIONS[1].title);
    });

    it('active nav item link has data-active attribute set to true', () => {
        const activeId = SECTIONS[0].id;
        const { container } = render(<HelpStickyNav activeSection={activeId} />);
        const links = container.querySelectorAll('a');
        const activeLink = Array.from(links).find((link) =>
            link.textContent?.includes(SECTIONS[0].title)
        );
        expect(activeLink).toBeTruthy();
        // Active link should have data-active="true" to signal distinct styling
        expect(activeLink?.getAttribute('data-active')).toBe('true');
    });
});
