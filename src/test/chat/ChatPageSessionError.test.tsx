import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatPage from '@/components/chat/ChatPage';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/chat',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock brutalist styles
vi.mock('@/styles/brutalist', () => ({
    palette: {
        ink: '#0A0E1A',
        paper: '#FAFAF5',
        paperDim: '#AAAAAA',
        paperFaint: '#666666',
        paperGhost: '#333333',
        chartreuse: '#D4FF00',
        amber: '#F59E0B',
        line: '#1A1F2E',
    },
    fonts: {
        display: 'Bricolage Grotesque',
        mono: 'JetBrains Mono',
        body: 'Inter',
    },
    motion: {
        duration: { sm: '150ms' },
        snap: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    },
    sxLabel: { fontFamily: 'JetBrains Mono', fontSize: '0.7rem' },
    sxLabelSmall: { fontFamily: 'JetBrains Mono', fontSize: '0.65rem' },
    hexAlpha: (color: string, alpha: number) =>
        `${color}${Math.round(alpha * 255)
            .toString(16)
            .padStart(2, '0')}`,
}));

// Mock CompanyContext
vi.mock('@/context/CompanyContext', () => ({
    useCompany: () => ({
        activeCompany: { nit: '123456789-1', name: 'Test Co' },
        activeNit: '123456789-1',
    }),
}));

// Mock child components to keep tests simple
vi.mock('@/components/chat/ChatInput', () => ({
    default: () => <div data-testid="chat-input" />,
}));
vi.mock('@/components/chat/ChatMessageBubble', () => ({
    default: () => <div data-testid="chat-bubble" />,
}));
vi.mock('@/components/chat/SessionList', () => ({
    default: () => <div data-testid="session-list" />,
}));

const mockUseChat = vi.fn();
vi.mock('@/hooks/useChat', () => ({
    useChat: (...args: unknown[]) => mockUseChat(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const baseChatReturn = {
    messages: [],
    sessionId: null,
    isStreaming: false,
    sessions: [],
    sessionsLoading: false,
    sessionsError: false,
    sendMessage: vi.fn(),
    loadSession: vi.fn(),
    newSession: vi.fn(),
    stopStreaming: vi.fn(),
    removeSession: vi.fn(),
};

describe('ChatPage — sessions error', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        mockUseChat.mockReset();
        mockUseChat.mockReturnValue({ ...baseChatReturn, sessionsError: true });
    });

    it('shows Alert with severity error (not warning)', async () => {
        render(<ChatPage />, { wrapper });

        // Alert with sessions error text must exist
        const alerts = await screen.findAllByRole('alert');
        const sessionAlerts = alerts.filter((el) =>
            el.textContent?.includes('No se pudieron cargar')
        );
        expect(sessionAlerts.length).toBeGreaterThan(0);
        // Must not be warning severity
        sessionAlerts.forEach((el) => {
            expect(el.classList.contains('MuiAlert-colorWarning')).toBe(false);
        });
    });

    it('shows Reintentar button', async () => {
        render(<ChatPage />, { wrapper });

        expect(screen.getAllByRole('button', { name: /reintentar/i }).length).toBeGreaterThan(0);
    });
});

describe('ChatPage — empty state disclaimer', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        mockUseChat.mockReset();
        mockUseChat.mockReturnValue({ ...baseChatReturn });
    });

    it('shows informative disclaimer text', async () => {
        render(<ChatPage />, { wrapper });

        expect(screen.getByText(/el asistente es informativo/i)).toBeInTheDocument();
    });
});
