import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable from '@/components/common/DataTable';

vi.mock('@mui/material', async () => {
    const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
    return {
        ...actual,
        useMediaQuery: vi.fn(),
    };
});

import { useMediaQuery } from '@mui/material';

describe('DataTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hides columns marked hideOnMobile when viewport is narrow', () => {
        (useMediaQuery as unknown as { mockReturnValue: (value: boolean) => void }).mockReturnValue(
            true
        );

        render(
            <DataTable
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'hidden', label: 'Hidden', hideOnMobile: true },
                ]}
                rows={[{ id: '1', name: 'Test', hidden: 'X' }]}
                pagination={false}
            />
        );

        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
});
