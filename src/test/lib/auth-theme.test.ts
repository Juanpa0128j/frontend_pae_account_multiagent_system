import { describe, it, expect } from 'vitest';
import { brutalistAuthTheme } from '@/lib/supabase/auth-theme';

describe('brutalistAuthTheme', () => {
    it('sets brand color to ink (#0A0E1A)', () => {
        expect(brutalistAuthTheme.variables?.default?.colors?.brand).toBe('#0A0E1A');
    });

    it('sets button border radius to 0px (brutalist: no radius)', () => {
        expect(brutalistAuthTheme.variables?.default?.radii?.borderRadiusButton).toBe('0px');
    });

    it('sets button font to Bricolage Grotesque', () => {
        expect(brutalistAuthTheme.variables?.default?.fonts?.buttonFontFamily).toContain(
            'Bricolage Grotesque'
        );
    });

    it('sets label font to JetBrains Mono', () => {
        expect(brutalistAuthTheme.variables?.default?.fonts?.labelFontFamily).toContain(
            'JetBrains Mono'
        );
    });

    it('sets input background to paper (#FAFAF5)', () => {
        expect(brutalistAuthTheme.variables?.default?.colors?.inputBackground).toBe('#FAFAF5');
    });
});
