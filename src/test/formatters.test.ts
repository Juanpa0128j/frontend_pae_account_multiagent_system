import { describe, it, expect } from 'vitest';
import {
    formatCOP,
    formatNIT,
    formatDuration,
    formatFileSize,
    formatDate,
    formatDateLong,
    currentPeriodLabel,
    startOfCurrentMonth,
    today,
} from '@/lib/formatters';

describe('formatCOP', () => {
    it('formats positive COP value', () => {
        const result = formatCOP(1000000);
        expect(result).toMatch(/\$[\d.,\s ]+/);
    });

    it('prefixes negative value with minus sign', () => {
        const result = formatCOP(-500000);
        expect(result).toContain('−');
    });

    it('compact mode formats thousands', () => {
        const result = formatCOP(5000, { compact: true });
        expect(result).toBe('$5K');
    });

    it('compact mode formats millions', () => {
        const result = formatCOP(2500000, { compact: true });
        expect(result).toBe('$2.5M');
    });

    it('compact mode formats billions', () => {
        const result = formatCOP(3000000000, { compact: true });
        expect(result).toBe('$3.0B');
    });

    it('showSign prepends + for positive', () => {
        const result = formatCOP(100, { showSign: true });
        expect(result).toMatch(/^\+/);
    });
});

describe('formatNIT', () => {
    it('returns em-dash for empty string', () => {
        expect(formatNIT('')).toBe('—');
    });

    it('formats 10-digit NIT with dash', () => {
        const result = formatNIT('9001234561');
        expect(result).toBe('900.123.456-1');
    });

    it('passes through short NIT without dash', () => {
        const result = formatNIT('123456789');
        expect(result).toBe('123456789');
    });
});

describe('formatDuration', () => {
    it('returns ms for sub-second', () => {
        expect(formatDuration(500)).toBe('500ms');
    });

    it('returns seconds for >= 1000ms', () => {
        expect(formatDuration(2500)).toBe('2.5s');
    });
});

describe('formatFileSize', () => {
    it('returns 0 B for zero', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('formats megabytes', () => {
        expect(formatFileSize(1048576)).toBe('1 MB');
    });
});

describe('formatDate', () => {
    it('returns em-dash for empty string', () => {
        expect(formatDate('')).toBe('—');
    });

    it('returns formatted string for valid ISO date', () => {
        const result = formatDate('2024-01-15');
        expect(result).toMatch(/2024/);
        expect(result).toMatch(/ene|jan|enero|january/i);
    });
});

describe('formatDateLong', () => {
    it('returns em-dash for empty string', () => {
        expect(formatDateLong('')).toBe('—');
    });

    it('returns formatted string with year and month for valid ISO date', () => {
        const result = formatDateLong('2024-06-20');
        expect(result).toMatch(/2024/);
        expect(result).toMatch(/jun|june|junio/i);
    });
});

describe('currentPeriodLabel', () => {
    it('returns a string containing the current year', () => {
        const result = currentPeriodLabel();
        expect(result).toMatch(/\d{4}/);
    });

    it('contains a Spanish month name', () => {
        const result = currentPeriodLabel();
        expect(result).toMatch(
            /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i
        );
    });
});

describe('startOfCurrentMonth', () => {
    it('returns ISO date string starting with current year', () => {
        const result = startOfCurrentMonth();
        expect(result).toMatch(/^\d{4}-\d{2}-01$/);
    });
});

describe('today', () => {
    it('returns ISO date string for today', () => {
        const result = today();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
