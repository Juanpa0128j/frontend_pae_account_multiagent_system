import { AxiosInstance } from 'axios';
import {
    ChatRequestPayload,
    ChatResponsePayload,
    ChatSessionSummary,
    ChatMessageRecord,
} from '@/types/api';

export class ChatApiClient {
    constructor(private client: AxiosInstance) {}

    async sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
        const response = await this.client.post<ChatResponsePayload>('/api/v1/chat', payload);
        return response.data;
    }

    async getChatSessions(companyNit?: string): Promise<ChatSessionSummary[]> {
        const response = await this.client.get<ChatSessionSummary[]>('/api/v1/chat/sessions', {
            params: companyNit ? { company_nit: companyNit } : undefined,
        });
        return response.data;
    }

    async getChatMessages(sessionId: string): Promise<ChatMessageRecord[]> {
        const response = await this.client.get<ChatMessageRecord[]>(
            `/api/v1/chat/sessions/${sessionId}/messages`
        );
        return response.data;
    }

    async deleteChatSession(sessionId: string): Promise<void> {
        await this.client.delete(`/api/v1/chat/sessions/${sessionId}`);
    }
}
