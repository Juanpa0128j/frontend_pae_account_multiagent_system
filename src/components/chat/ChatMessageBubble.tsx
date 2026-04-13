'use client';

import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import FinancialDataCard from './FinancialDataCard';

const markdownStyles = {
  color: '#E5E7EB',
  lineHeight: 1.6,
  wordBreak: 'break-word',
  '& p': { m: 0, mb: 1 },
  '& p:last-child': { mb: 0 },
  '& strong': { color: '#F9FAFB', fontWeight: 600 },
  '& em': { fontStyle: 'italic' },
  '& ul, & ol': { pl: 2.5, my: 0.5 },
  '& li': { mb: 0.25 },
  '& code': {
    bgcolor: 'rgba(99,102,241,0.15)',
    px: 0.5,
    py: 0.25,
    borderRadius: 0.5,
    fontSize: '0.85em',
    fontFamily: 'monospace',
  },
  '& pre': {
    bgcolor: 'rgba(0,0,0,0.3)',
    p: 1.5,
    borderRadius: 1,
    overflow: 'auto',
    my: 1,
    '& code': { bgcolor: 'transparent', p: 0 },
  },
  '& h1, & h2, & h3, & h4': {
    color: '#F9FAFB',
    fontWeight: 600,
    mt: 1.5,
    mb: 0.5,
  },
  '& h1': { fontSize: '1.1rem' },
  '& h2': { fontSize: '1rem' },
  '& h3': { fontSize: '0.95rem' },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    my: 1,
  },
  '& th, & td': {
    border: '1px solid rgba(255,255,255,0.1)',
    px: 1,
    py: 0.5,
    fontSize: '0.85rem',
  },
  '& th': { bgcolor: 'rgba(99,102,241,0.1)', fontWeight: 600 },
  '& blockquote': {
    borderLeft: '3px solid rgba(99,102,241,0.4)',
    pl: 1.5,
    ml: 0,
    color: 'text.secondary',
  },
} as const;

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
          {message.content ? (
            <Box sx={markdownStyles}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              Pensando...
            </Typography>
          )}
        </Paper>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
            {message.sources.map((source) => (
              <Chip
                key={source}
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
              <FinancialDataCard key={`${card.card_type}-${i}`} card={card} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
