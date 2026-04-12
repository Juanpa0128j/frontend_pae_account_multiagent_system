'use client';

import React, { useState, useRef } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send as SendIcon, Stop as StopIcon } from '@mui/icons-material';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        bgcolor: '#0D1120',
      }}
    >
      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={4}
        placeholder="Pregunta sobre tus finanzas..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: '#111827',
          },
        }}
      />
      {isStreaming ? (
        <IconButton
          onClick={onStop}
          sx={{
            bgcolor: 'error.main',
            color: '#fff',
            '&:hover': { bgcolor: 'error.dark' },
            width: 40,
            height: 40,
          }}
        >
          <StopIcon fontSize="small" />
        </IconButton>
      ) : (
        <IconButton
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'rgba(99,102,241,0.2)', color: 'rgba(255,255,255,0.3)' },
            width: 40,
            height: 40,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
