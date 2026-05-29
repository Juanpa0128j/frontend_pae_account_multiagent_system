import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiClient } from '@/lib/api/core/apiClient';

function makeClient(): ApiClient {
    return {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    } as unknown as ApiClient;
}

describe('ChatApiClient', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = makeClient();
        vi.clearAllMocks();
    });

    it('sendChatMessage posts to /api/v1/chat with payload', async () => {
        (client.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { reply: 'hola', session_id: 'sess_1', data_cards: [], intent_detected: 'greeting', sources: [] },
        });
        const { ChatApiClient } = await import('@/lib/api/clients/chatApiClient');
        const api = new ChatApiClient(client);
        const result = await api.sendChatMessage({ message: 'hola', company_nit: 'nit_1' });
        expect(client.post).toHaveBeenCalledWith('/api/v1/chat', { message: 'hola', company_nit: 'nit_1' });
        expect(result.session_id).toBe('sess_1');
    });

    it('getChatSessions calls GET /api/v1/chat/sessions with company_nit param', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
        const { ChatApiClient } = await import('@/lib/api/clients/chatApiClient');
        const api = new ChatApiClient(client);
        await api.getChatSessions('nit_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/chat/sessions', {
            params: { company_nit: 'nit_1' },
        });
    });

    it('getChatSessions calls GET /api/v1/chat/sessions without params when no nit', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
        const { ChatApiClient } = await import('@/lib/api/clients/chatApiClient');
        const api = new ChatApiClient(client);
        await api.getChatSessions();
        expect(client.get).toHaveBeenCalledWith('/api/v1/chat/sessions', { params: undefined });
    });

    it('getChatMessages calls GET /api/v1/chat/sessions/{sessionId}/messages', async () => {
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
        const { ChatApiClient } = await import('@/lib/api/clients/chatApiClient');
        const api = new ChatApiClient(client);
        await api.getChatMessages('sess_1');
        expect(client.get).toHaveBeenCalledWith('/api/v1/chat/sessions/sess_1/messages');
    });

    it('deleteChatSession calls DELETE /api/v1/chat/sessions/{sessionId}', async () => {
        (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
        const { ChatApiClient } = await import('@/lib/api/clients/chatApiClient');
        const api = new ChatApiClient(client);
        await api.deleteChatSession('sess_1');
        expect(client.delete).toHaveBeenCalledWith('/api/v1/chat/sessions/sess_1');
    });
});
