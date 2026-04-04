'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendChatMessage,
  getChatSessions,
  getChatMessages,
  deleteChatSession,
} from '@/lib/api';
import type { ChatMessage, FinancialDataCard } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useChat(companyNit?: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // List sessions
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions', companyNit],
    queryFn: () => getChatSessions(companyNit),
    staleTime: 30_000,
  });

  // Load a previous session's messages
  const loadSession = useCallback(async (id: string) => {
    try {
      const msgs = await getChatMessages(id);
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          data_cards: m.data_cards,
          intent: m.intent,
          sources: m.sources,
          created_at: m.created_at,
        }))
      );
      setSessionId(id);
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  }, []);

  // Send message with SSE streaming
  const sendMessage = useCallback(
    async (message: string) => {
      // Optimistic: add user message immediately
      setMessages((prev) => [...prev, { role: 'user', content: message }]);

      // Add empty assistant message to fill progressively
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setIsStreaming(true);

      const body = {
        message,
        session_id: sessionId,
        company_nit: companyNit,
      };

      try {
        abortRef.current = new AbortController();
        const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let dataCards: FinancialDataCard[] = [];
        let sources: string[] = [];
        let intent: string | undefined;
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.content !== undefined) {
                  // Token event
                  fullContent += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: fullContent,
                    };
                    return updated;
                  });
                } else if (data.cards !== undefined) {
                  // Data event
                  dataCards = data.cards;
                  sources = data.sources || [];
                  intent = data.intent;
                } else if (data.session_id !== undefined) {
                  // Done event
                  setSessionId(data.session_id);
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }

        // Finalize assistant message
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: fullContent,
            data_cards: dataCards.length > 0 ? dataCards : undefined,
            intent,
            sources: sources.length > 0 ? sources : undefined,
          };
          return updated;
        });

        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Chat stream error:', err);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Error al comunicarse con el servidor. Verifica que el backend esté corriendo.',
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionId, companyNit, queryClient]
  );

  // Start a new session
  const newSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Delete a session
  const removeSession = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      if (sessionId === deletedId) {
        newSession();
      }
    },
  });

  return {
    messages,
    sessionId,
    isStreaming,
    sessions: sessionsQuery.data || [],
    sessionsLoading: sessionsQuery.isLoading,
    sendMessage,
    loadSession,
    newSession,
    stopStreaming,
    removeSession: removeSession.mutate,
  };
}
