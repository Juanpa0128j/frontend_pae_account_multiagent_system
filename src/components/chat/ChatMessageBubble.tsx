'use client';

import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import type { ChatMessage } from '@/types';
import FinancialDataCard from './FinancialDataCard';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 2,
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
          flexShrink: 0,
          mt: 0.5,
        }}
      >
        {isUser ? (
          <PersonIcon sx={{ fontSize: 18, color: 'primary.light' }} />
        ) : (
          <BotIcon sx={{ fontSize: 18, color: 'secondary.light' }} />
        )}
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: '75%', minWidth: 0 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isUser ? 'rgba(99,102,241,0.1)' : '#1A1F2E',
            border: `1px solid ${isUser ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#E5E7EB',
              lineHeight: 1.6,
              '& strong': { color: '#F9FAFB', fontWeight: 600 },
            }}
          >
            {message.content || (
              <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Pensando...
              </Box>
            )}
          </Typography>
        </Paper>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
            {message.sources.map((source, i) => (
              <Chip
                key={i}
                label={source}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  borderColor: 'rgba(99,102,241,0.3)',
                  color: 'primary.light',
                }}
              />
            ))}
          </Box>
        )}

        {/* Data cards */}
        {message.data_cards && message.data_cards.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            {message.data_cards.map((card, i) => (
              <FinancialDataCard key={i} card={card} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
