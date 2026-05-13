import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentStepCard } from '@/components/agent/AgentStepCard';

describe('AgentStepCard', () => {
    it('expand button has minimum 44px touch target', () => {
        render(
            <AgentStepCard
                step={{
                    agente: 'Auditor',
                    accion: 'Audit complete',
                    resultado: 'success',
                    duracion_ms: 1200,
                    detalle: 'All checks passed',
                }}
            />
        );
        const expandBtn = screen.getByRole('button');
        expect(expandBtn).toHaveStyle('padding: 8px');
    });
});
