'use client';

import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ChatBubbleOutline as ChatIcon,
} from '@mui/icons-material';
import type { ChatSession } from '@/types';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function SessionList({
  sessions,
  activeSessionId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: SessionListProps) {
  return (
    <Box
      sx={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        bgcolor: '#0D1120',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onNew}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Nueva conversación
        </Button>
      </Box>

      {/* Session List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.disabled">
              Sin conversaciones previas
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1, py: 0.5 }}>
            {sessions.map((session) => {
              const active = session.id === activeSessionId;
              return (
                <ListItemButton
                  key={session.id}
                  onClick={() => onSelect(session.id)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    px: 1.5,
                    py: 1,
                    bgcolor: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  <ListItemText
                    primary={session.title || 'Conversación sin título'}
                    secondary={`${session.message_count} mensajes`}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: active ? 600 : 400,
                      noWrap: true,
                      color: active ? 'primary.light' : 'text.secondary',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.65rem',
                      color: 'text.disabled',
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                      sx={{
                        color: 'text.disabled',
                        opacity: 0.5,
                        '&:hover': { opacity: 1, color: 'error.main' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
