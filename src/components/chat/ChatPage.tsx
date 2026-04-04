'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import { useChat } from '@/hooks/useChat';
import ChatInput from './ChatInput';
import ChatMessageBubble from './ChatMessageBubble';
import SessionList from './SessionList';

export default function ChatPage() {
  const {
    messages,
    sessionId,
    isStreaming,
    sessions,
    sessionsLoading,
    sendMessage,
    loadSession,
    newSession,
    stopStreaming,
    removeSession,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Session Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <SessionList
          sessions={sessions}
          activeSessionId={sessionId}
          loading={sessionsLoading}
          onSelect={loadSession}
          onNew={newSession}
          onDelete={removeSession}
        />
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, md: 4 },
            py: 3,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BotIcon sx={{ fontSize: 32, color: 'primary.light' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Chat Financiero
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
                Pregunta sobre tu balance general, estado de resultados, IVA, retenciones, ratios financieros y mas.
                Las respuestas se basan en los datos reales de tu contabilidad.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                {[
                  '¿Cuál es mi balance general?',
                  '¿Cuánto debo de IVA?',
                  '¿Cómo está mi liquidez?',
                  'Dame un análisis completo',
                ].map((suggestion) => (
                  <Box
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: 'primary.light',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: 'rgba(99,102,241,0.1)',
                        borderColor: 'rgba(99,102,241,0.5)',
                      },
                    }}
                  >
                    {suggestion}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessageBubble key={i} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
        />
      </Box>
    </Box>
  );
}
