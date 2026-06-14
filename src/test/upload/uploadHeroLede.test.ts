import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Mirrors the inline lede logic from src/app/upload/page.tsx BrutalistPageHero
// ---------------------------------------------------------------------------

const LEDE_VIA_A =
    'Carga facturas, extractos y documentos fuente. Construye asientos desde cero con soporte para PDFs, XML, Excel e imágenes escaneadas.';

const LEDE_VIA_B =
    'Carga estados financieros de primer nivel para derivación automática. Vía B importa balances ya construidos y genera los demás formularios.';

const LEDE_DEFAULT =
    'Vía A construye asientos desde documentos fuente (facturas, extractos, recibos) y soporta PDFs, XML, Excel e imágenes escaneadas. Vía B importa estados financieros ya construidos y deriva los demás. Usa el selector de abajo para cambiar de flujo.';

function getHeroLede(mode: 'via-a' | 'via-b' | undefined): string {
    if (mode === 'via-a') return LEDE_VIA_A;
    if (mode === 'via-b') return LEDE_VIA_B;
    return LEDE_DEFAULT;
}

describe('upload hero lede', () => {
    it('returns via-a lede when mode is via-a', () => {
        expect(getHeroLede('via-a')).toBe(LEDE_VIA_A);
    });

    it('returns via-b lede when mode is via-b', () => {
        expect(getHeroLede('via-b')).toBe(LEDE_VIA_B);
    });

    it('via-a and via-b lede strings differ', () => {
        expect(getHeroLede('via-a')).not.toBe(getHeroLede('via-b'));
    });

    it('returns default lede when mode is undefined', () => {
        expect(getHeroLede(undefined)).toBe(LEDE_DEFAULT);
    });
});
