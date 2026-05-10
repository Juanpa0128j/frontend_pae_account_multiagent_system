// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/lib/api/core/apiClient';
import { ChatApiClient } from '@/lib/api/clients/chatApiClient';
import {
    ChatRequestPayload,
    ChatResponsePayload,
    ChatSessionSummary,
    ChatMessageRecord,
} from '@/types/api';

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            signOut: vi.fn(() => Promise.resolve()),
        },
    }),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ChatApiClient', () => {
    const baseURL = 'http://localhost:8000';
    const client = apiClient;
    const chatClient = new ChatApiClient(client);

    describe('sendChatMessage', () => {
        it('posts payload and returns chat response', async () => {
            const payload: ChatRequestPayload = {
                message: 'Hola',
                session_id: null,
                company_nit: '9001234561',
                start_date: null,
                end_date: null,
            };

            const mockResponse: ChatResponsePayload = {
                reply: 'Hola, ¿en qué puedo ayudarte?',
                session_id: 'sess_123',
                data_cards: [],
                intent_detected: 'greeting',
                sources: [],
            };

            server.use(
                http.post(`${baseURL}/api/v1/chat`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await chatClient.sendChatMessage(payload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getChatSessions', () => {
        it('returns chat sessions for the current company', async () => {
            const mockResponse: ChatSessionSummary[] = [
                {
                    id: 'sess_123',
                    title: 'Consulta contable',
                    company_nit: '9001234561',
                    message_count: 5,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                },
            ];

            server.use(
                http.get(`${baseURL}/api/v1/chat/sessions`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await chatClient.getChatSessions();
            expect(result).toEqual(mockResponse);
        });

        it('includes company_nit query param when provided', async () => {
            const mockResponse: ChatSessionSummary[] = [
                {
                    id: 'sess_124',
                    title: 'Consulta fiscal',
                    company_nit: '9001234561',
                    message_count: 3,
                    created_at: '2024-01-03T00:00:00Z',
                    updated_at: '2024-01-03T00:00:00Z',
                },
            ];

            let capturedUrl: string | undefined;
            server.use(
                http.get(`${baseURL}/api/v1/chat/sessions`, ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json(mockResponse);
                })
            );

            await chatClient.getChatSessions('9001234561');
            expect(capturedUrl).toContain('company_nit=9001234561');
        });
    });

    describe('getChatMessages', () => {
        it('returns messages for a given session id', async () => {
            const mockResponse: ChatMessageRecord[] = [
                {
                    id: 'msg_1',
                    role: 'user',
                    content: '¿Cuál es mi balance?',
                    data_cards: null,
                    intent: null,
                    sources: null,
                    reasoning: null,
                    created_at: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'msg_2',
                    role: 'assistant',
                    content: 'Tu balance total es de $1,000,000.',
                    data_cards: [
                        {
                            card_type: 'balance',
                            title: 'Balance General',
                            data: { activos: 1000000, pasivos: 500000 },
                        },
                    ],
                    intent: 'query_balance',
                    sources: ['reports/balance'],
                    reasoning: null,
                    created_at: '2024-01-01T00:00:01Z',
                },
            ];

            server.use(
                http.get(`${baseURL}/api/v1/chat/sessions/sess_123/messages`, () => {
                    return HttpResponse.json(mockResponse);
                })
            );

            const result = await chatClient.getChatMessages('sess_123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteChatSession', () => {
        it('deletes session and resolves void', async () => {
            server.use(
                http.delete(`${baseURL}/api/v1/chat/sessions/sess_123`, () => {
                    return new HttpResponse(null, { status: 204 });
                })
            );

            await expect(chatClient.deleteChatSession('sess_123')).resolves.toBeUndefined();
        });
    });
});
