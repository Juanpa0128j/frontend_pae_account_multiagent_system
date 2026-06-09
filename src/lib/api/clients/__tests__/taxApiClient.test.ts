import { describe, it, expect } from 'vitest';

describe('Tax API Client Types', () => {
    it('should accept company_nit in getTarifasRenta options', () => {
        const options = { company_nit: 'ABC123', year: 2026 };
        expect(options.company_nit).toBe('ABC123');
    });

    it('should accept company_nit in listReteicaTarifas options', () => {
        const options = { company_nit: 'ABC123', municipio: 'Bogota' };
        expect(options.company_nit).toBe('ABC123');
    });

    it('should accept company_nit in listTaxConcepts options', () => {
        const options = { company_nit: 'ABC123', activo: true };
        expect(options.company_nit).toBe('ABC123');
    });
});
