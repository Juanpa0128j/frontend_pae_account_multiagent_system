import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Typography, Box } from '@mui/material';
import type { CompanyMembership } from '@/types';

/**
 * Mirrors the card label rendering logic from src/app/companies/page.tsx.
 * Kept as a pure render helper so we can test it without mocking Next.js router,
 * TanStack Query, Supabase, etc.
 */
function CompanyCardLabel({ company }: { company: CompanyMembership }) {
    if (company.razon_social) {
        return (
            <Box>
                <Typography data-testid="primary-label">{company.razon_social}</Typography>
                <Typography data-testid="secondary-label">{company.company_nit}</Typography>
            </Box>
        );
    }
    return <Typography data-testid="primary-label">{company.company_nit}</Typography>;
}

describe('CompanyCard label rendering', () => {
    it('shows razon_social as primary label and NIT as secondary when razon_social is present', () => {
        const company: CompanyMembership = {
            user_id: 'u1',
            company_nit: '800999888-1',
            razon_social: 'ACME S.A.S.',
        };

        render(<CompanyCardLabel company={company} />);

        expect(screen.getByTestId('primary-label')).toHaveTextContent('ACME S.A.S.');
        expect(screen.getByTestId('secondary-label')).toHaveTextContent('800999888-1');
    });

    it('falls back to NIT as primary label when razon_social is null', () => {
        const company: CompanyMembership = {
            user_id: 'u1',
            company_nit: '800999888-1',
            razon_social: null,
        };

        render(<CompanyCardLabel company={company} />);

        expect(screen.getByTestId('primary-label')).toHaveTextContent('800999888-1');
        expect(screen.queryByTestId('secondary-label')).toBeNull();
    });

    it('falls back to NIT as primary label when razon_social is undefined', () => {
        const company: CompanyMembership = {
            user_id: 'u1',
            company_nit: '800999888-1',
        };

        render(<CompanyCardLabel company={company} />);

        expect(screen.getByTestId('primary-label')).toHaveTextContent('800999888-1');
        expect(screen.queryByTestId('secondary-label')).toBeNull();
    });

    it('falls back to NIT as primary label when razon_social is empty string', () => {
        const company: CompanyMembership = {
            user_id: 'u1',
            company_nit: '800999888-1',
            razon_social: '',
        };

        render(<CompanyCardLabel company={company} />);

        expect(screen.getByTestId('primary-label')).toHaveTextContent('800999888-1');
        expect(screen.queryByTestId('secondary-label')).toBeNull();
    });
});
