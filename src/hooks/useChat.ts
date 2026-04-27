'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatSessions,
  getChatMessages,
  deleteChatSession,
} from '@/lib/api';
import type { ChatMessage, ChatReasoningStep, FinancialDataCard } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TYPEWRITER_CHARS_PER_SEC = 40;

export function useChat(companyNit?: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  // Typewriter pacing — smooth token arrival to ~TYPEWRITER_CHARS_PER_SEC
  const bufferRef = useRef('');
  const displayedRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const charBudgetRef = useRef(0);
  const streamDoneRef = useRef(false);

  const cancelTypewriter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    bufferRef.current = '';
    displayedRef.current = '';
    lastTickRef.current = 0;
    charBudgetRef.current = 0;
    streamDoneRef.current = false;
  }, []);

  // Helper: abort any in-flight stream
  const abortCurrentStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isStreamingRef.current = false;
    setIsStreaming(false);
    cancelTypewriter();
  }, [cancelTypewriter]);

  // Cancel any in-flight stream + drain loop on unmount to avoid
  // setState on unmounted component (React dev warning / leak)
  useEffect(() => {
    return () => {
      abortCurrentStream();
    };
  }, [abortCurrentStream]);

  // List sessions
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions', companyNit],
    queryFn: () => getChatSessions(companyNit),
    staleTime: 30_000,
  });

  // Load a previous session's messages
  const loadSession = useCallback(async (id: string) => {
    abortCurrentStream();
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
          reasoning: m.reasoning ?? undefined,
          created_at: m.created_at,
        }))
      );
      setSessionId(id);
    } catch {
      // Session load failed — UI remains on current state
    }
  }, [abortCurrentStream]);

  // Send message with SSE streaming
  const sendMessage = useCallback(
    async (message: string) => {
      if (isStreamingRef.current) return;

      // Optimistic: add user message immediately
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: message }]);

      // Add empty assistant message to fill progressively
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      setIsStreaming(true);
      isStreamingRef.current = true;

      // Cancel any stale drain from a prior send before resetting typewriter state
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      bufferRef.current = '';
      displayedRef.current = '';
      lastTickRef.current = 0;
      charBudgetRef.current = 0;
      streamDoneRef.current = false;

      let dataCards: FinancialDataCard[] = [];
      let sources: string[] = [];
      let intent: string | undefined;
      let reasoningSteps: ChatReasoningStep[] = [];

      const applyDisplayed = () => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: displayedRef.current,
          };
          return updated;
        });
      };

      const finalizeMessage = () => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            role: 'assistant',
            content: displayedRef.current,
            data_cards: dataCards.length > 0 ? dataCards : undefined,
            intent,
            sources: sources.length > 0 ? sources : undefined,
            reasoning: reasoningSteps.length > 0 ? reasoningSteps : undefined,
          };
          return updated;
        });
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        setIsStreaming(false);
        isStreamingRef.current = false;
      };

      const tick = (ts: number) => {
        if (lastTickRef.current === 0) lastTickRef.current = ts;
        const dt = ts - lastTickRef.current;
        lastTickRef.current = ts;

        charBudgetRef.current += (dt / 1000) * TYPEWRITER_CHARS_PER_SEC;
        const toConsume = Math.floor(charBudgetRef.current);
        if (toConsume > 0 && bufferRef.current.length > 0) {
          const take = Math.min(toConsume, bufferRef.current.length);
          displayedRef.current += bufferRef.current.slice(0, take);
          bufferRef.current = bufferRef.current.slice(take);
          charBudgetRef.current -= take;
          applyDisplayed();
        } else if (bufferRef.current.length === 0) {
          // Cap idle budget so it does not burst when new tokens arrive
          if (charBudgetRef.current > TYPEWRITER_CHARS_PER_SEC) {
            charBudgetRef.current = TYPEWRITER_CHARS_PER_SEC;
          }
        }

        if (bufferRef.current.length === 0 && streamDoneRef.current) {
          rafRef.current = null;
          lastTickRef.current = 0;
          charBudgetRef.current = 0;
          streamDoneRef.current = false;
          finalizeMessage();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      const ensureTicking = () => {
        if (rafRef.current === null) {
          lastTickRef.current = 0;
          rafRef.current = requestAnimationFrame(tick);
        }
      };

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
          credentials: 'include',
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.content !== undefined) {
                  bufferRef.current += data.content;
                  ensureTicking();
                } else if (data.cards !== undefined) {
                  dataCards = data.cards;
                  sources = data.sources || [];
                  intent = data.intent;
                } else if (data.thinking !== undefined) {
                  // Backend emits one terminal step per `thinking` event
                  // (status='done' today). There are no in-place updates by
                  // contract, so we keep this append-only. If the contract
                  // ever adds 'running' -> 'done' transitions for the same
                  // phase, switch to a phase-keyed map merge here.
                  reasoningSteps = [...reasoningSteps, data.thinking as ChatReasoningStep];
                  // Live update so the panel fills as the agent works
                  const stepsSnapshot = reasoningSteps;
                  setMessages((prev) => {
                    if (prev.length === 0) return prev;
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      reasoning: stepsSnapshot,
                    };
                    return updated;
                  });
                } else if (data.session_id !== undefined) {
                  setSessionId(data.session_id);
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }

        // Signal drain loop to finalize once buffer empties
        streamDoneRef.current = true;
        if (rafRef.current === null) {
          // No pending chars — finalize immediately
          finalizeMessage();
          streamDoneRef.current = false;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled — stop typewriter, keep whatever is already displayed
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          bufferRef.current = '';
          lastTickRef.current = 0;
          charBudgetRef.current = 0;
          streamDoneRef.current = false;
        } else {
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          bufferRef.current = '';
          displayedRef.current = '';
          lastTickRef.current = 0;
          charBudgetRef.current = 0;
          streamDoneRef.current = false;
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              role: 'assistant',
              content: 'Error al comunicarse con el servidor. Verifica que el backend esté corriendo.',
            };
            return updated;
          });
        }
        setIsStreaming(false);
        isStreamingRef.current = false;
      } finally {
        abortRef.current = null;
      }
    },
    [sessionId, companyNit, queryClient]
  );

  // Start a new session
  const newSession = useCallback(() => {
    abortCurrentStream();
    setMessages([]);
    setSessionId(null);
  }, [abortCurrentStream]);

  // Stop streaming — cancels fetch if still open, and drain loop if
  // SSE already ended but typewriter is still emptying the buffer
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      bufferRef.current = '';
      lastTickRef.current = 0;
      charBudgetRef.current = 0;
      streamDoneRef.current = false;
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  }, []);

  // Delete a session
  const removeSession = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      if (sessionId === deletedId) {
        abortCurrentStream();
        setMessages([]);
        setSessionId(null);
      }
    },
  });

  return {
    messages,
    sessionId,
    isStreaming,
    sessions: sessionsQuery.data || [],
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.isError,
    sendMessage,
    loadSession,
    newSession,
    stopStreaming,
    removeSession: removeSession.mutate,
  };
}
