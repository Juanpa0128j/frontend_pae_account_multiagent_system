import { describe, it, expect } from 'vitest';
import { SECTIONS } from '@/components/help/helpData';

describe('helpData SECTIONS', () => {
    it('has at least one section', () => {
        expect(SECTIONS.length).toBeGreaterThan(0);
    });

    SECTIONS.forEach((section) => {
        describe(`section "${section.id}"`, () => {
            it('has required string fields: id, title, subtitle, lede', () => {
                expect(typeof section.id).toBe('string');
                expect(section.id.length).toBeGreaterThan(0);
                expect(typeof section.title).toBe('string');
                expect(section.title.length).toBeGreaterThan(0);
                expect(typeof section.subtitle).toBe('string');
                expect(section.subtitle.length).toBeGreaterThan(0);
                expect(typeof section.lede).toBe('string');
                expect(section.lede.length).toBeGreaterThan(0);
            });

            it('has at least one step', () => {
                expect(Array.isArray(section.steps)).toBe(true);
                expect(section.steps.length).toBeGreaterThan(0);
            });

            it('steps have title and body fields', () => {
                section.steps.forEach((step) => {
                    expect(typeof step.title).toBe('string');
                    expect(step.title.length).toBeGreaterThan(0);
                    expect(typeof step.body).toBe('string');
                    expect(step.body.length).toBeGreaterThan(0);
                });
            });

            it('step bodies contain no user-hostile technical strings (GET /api, TanStack)', () => {
                section.steps.forEach((step) => {
                    expect(step.body).not.toMatch(/GET \/api/);
                    expect(step.body).not.toMatch(/TanStack/);
                });
            });

            it('lede contains no user-hostile technical strings', () => {
                expect(section.lede).not.toMatch(/GET \/api/);
                expect(section.lede).not.toMatch(/TanStack/);
            });
        });
    });
});
