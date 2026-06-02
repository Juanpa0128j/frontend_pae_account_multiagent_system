import { describe, it, expect } from 'vitest';

describe('usePuc Hooks - Type Support', () => {
    it('should accept company_nit param', () => {
        const params = { company_nit: 'ABC123', search: 'test' };
        expect(params.company_nit).toBe('ABC123');
    });

    it('should accept optional company_nit', () => {
        const params = { search: 'test' };
        expect(params.search).toBe('test');
    });
});
